import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import OSS from "ali-oss";
import bcryptjs from "bcryptjs";
import { Buffer } from "node:buffer";
import { v4 as uuidv4 } from "uuid";
import { settingQueries, userQueries } from "../lib/db";
import {
  sendActiveMail,
  sendResetPassMail,
  sendReplyNotifyMail,
  sendAtNotifyMail,
} from "../lib/mail";
import {
  setSessionCookie,
  clearSessionCookie,
  authMiddleware,
  type AuthVars,
} from "../middleware/auth";
import { perIpPerDay } from "../middleware/rate-limit";
import { requestIp, verifyTurnstile } from "../lib/turnstile";

const auth = new Hono<{
  Variables: AuthVars;
}>();

const CREATE_USER_PER_IP = 1000;

const presignUploadSchema = z.object({
  filename: z.string().max(255).optional(),
  contentType: z.string().regex(/^image\/(png|jpeg|gif|webp)$/).default("image/png"),
});

const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);
const allowedImageExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);

function extensionForContentType(contentType: string) {
  if (contentType === "image/jpeg") return ".jpg";
  if (contentType === "image/gif") return ".gif";
  if (contentType === "image/webp") return ".webp";
  return ".png";
}

function createOssClient() {
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;
  const bucket = process.env.OSS_BUCKET;
  const region = process.env.OSS_REGION || "oss-cn-hangzhou";
  const endpoint = process.env.OSS_ENDPOINT || undefined;

  if (!accessKeyId || !accessKeySecret || !bucket) {
    throw new Error("OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET and OSS_BUCKET are required");
  }

  return new OSS({
    accessKeyId,
    accessKeySecret,
    bucket,
    region,
    endpoint,
  });
}

function uploadPrefix() {
  return (process.env.OSS_UPLOAD_PREFIX || "cnode-next/uploads").replace(/^\/+|\/+$/g, "");
}

function staticUploadUrl(filename: string) {
  const staticHost = process.env.OSS_STATIC_HOST || "https://static.cnodejs.org";
  return `${staticHost.replace(/\/+$/g, "")}/${filename}`;
}

function safeOriginalName(name: string) {
  return name.replace(/[/\\]/g, "").trim().slice(0, 255) || "image";
}

function extensionForFilename(name: string) {
  const match = name.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] || "";
}

auth.use("*", authMiddleware());

const signinSchema = z.object({
  name: z.string().min(1),
  pass: z.string().min(1),
});

const signupSchema = z.object({
  loginname: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-zA-Z0-9\-_]+$/),
  pass: z
    .string()
    .min(8)
    .regex(/[a-zA-Z]/, "密码必须包含字母")
    .regex(/[0-9]/, "密码必须包含数字"),
  email: z.string().email(),
  turnstileToken: z.string().optional(),
});

const searchPassSchema = z.object({
  email: z.string().email(),
  turnstileToken: z.string().optional(),
});

const resetPassSchema = z.object({
  key: z.string().min(1),
  psw: z
    .string()
    .min(8)
    .regex(/[a-zA-Z]/)
    .regex(/[0-9]/),
});

const githubCreateSchema = z.object({
  isnew: z.boolean().optional(),
  name: z.string().optional(),
  pass: z.string().optional(),
});

const RETRIEVE_KEY_TTL = 24 * 60 * 60 * 1000;
const GITHUB_PENDING_COOKIE = "github_profile";
const GITHUB_OAUTH_COOKIE = "github_oauth_state";

type PendingGithubProfile = {
  id: string;
  login: string;
  email: string;
  avatarUrl?: string;
  accessToken: string;
};

type GithubOAuthState = {
  state: string;
  intent: "login" | "bind";
};

function webBaseUrl() {
  return process.env.APP_WEB_BASE_URL || "http://localhost:5173";
}

function cookieSecret() {
  return process.env.AUTH_SESSION_SECRET || "local-dev-secret";
}

function setPendingGithubProfile(c: any, profile: PendingGithubProfile) {
  const domain = process.env.AUTH_COOKIE_DOMAIN || undefined;
  setCookie(c as any, GITHUB_PENDING_COOKIE, Buffer.from(JSON.stringify(profile)).toString("base64url"), {
    domain,
    path: "/",
    httpOnly: true,
    signed: true,
    secret: cookieSecret(),
    maxAge: 10 * 60,
    sameSite: "Lax",
  } as any);
}

function clearPendingGithubProfile(c: any) {
  const domain = process.env.AUTH_COOKIE_DOMAIN || undefined;
  deleteCookie(c, GITHUB_PENDING_COOKIE, { domain, path: "/" });
}

function getPendingGithubProfile(c: any): PendingGithubProfile | null {
  const raw = (getCookie as any)(c, GITHUB_PENDING_COOKIE, cookieSecret());
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (!parsed.id || !parsed.login || !parsed.email || !parsed.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getGithubOAuthState(c: any): GithubOAuthState | null {
  const raw = getCookie(c, GITHUB_OAUTH_COOKIE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (!parsed.state || !["login", "bind"].includes(parsed.intent)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearGithubOAuthState(c: any) {
  const domain = process.env.AUTH_COOKIE_DOMAIN || undefined;
  deleteCookie(c, GITHUB_OAUTH_COOKIE, { domain, path: "/" });
}

auth.post("/auth/local/login", zValidator("json", signinSchema), async (c) => {
  const { name, pass } = c.req.valid("json");

  let user = await userQueries.getByLoginName(name.toLowerCase());
  if (!user) {
    user = await userQueries.getByEmail(name);
  }

  if (!user) {
    return c.json({ success: false, error_msg: "用户名或密码错误" }, 403);
  }

  const equal = await bcryptjs.compare(pass, user.pass);
  if (!equal) {
    return c.json({ success: false, error_msg: "用户名或密码错误" }, 403);
  }

  if (!user.active) {
    return c.json({ success: false, error_msg: "账号未激活" }, 403);
  }

  setSessionCookie(c, user.id);
  return c.json({ success: true });
});

auth.get("/auth/config", async (c) => {
  const allowSignup = (await settingQueries.get("allow_signup", "true")) !== "false";
  return c.json({ success: true, data: { allow_signup: allowSignup } });
});

auth.post(
  "/auth/local/signup",
  perIpPerDay("create_user_per_ip", CREATE_USER_PER_IP, true),
  zValidator("json", signupSchema),
  async (c) => {
  const allowSignup = (await settingQueries.get("allow_signup", "true")) !== "false";
  if (!allowSignup) {
    return c.json({ success: false, error_msg: "当前暂不开放注册" }, 403);
  }
  const { loginname, pass, email, turnstileToken } = c.req.valid("json");
  if (!(await verifyTurnstile(turnstileToken, requestIp(c)))) {
    return c.json({ success: false, error_msg: "人机验证失败" }, 403);
  }

  const existingByLogin = await userQueries.getByLoginName(loginname.toLowerCase());
  if (existingByLogin) {
    return c.json({ success: false, error_msg: "用户名已被使用" }, 422);
  }

  const existingByEmail = await userQueries.getByEmail(email);
  if (existingByEmail) {
    return c.json({ success: false, error_msg: "邮箱已被使用" }, 422);
  }

  const passhash = await bcryptjs.hash(pass, 10);
  const retrieveKey = uuidv4();

  const user = await userQueries.newAndSave({
    loginname: loginname.toLowerCase(),
    pass: passhash,
    email,
    active: false,
  });

  await userQueries.updateRetrieveKey(user.id, retrieveKey, Date.now());

  if (process.env.APP_ENV === "development") {
    // Skip email in dev
  } else {
    await sendActiveMail(email, retrieveKey);
  }

    return c.json({ success: true, message: "注册成功,请查收邮件激活账号" });
  },
);

auth.get("/auth/local/active_account", async (c) => {
  const key = c.req.query("key");
  if (!key) {
    return c.json({ success: false, error_msg: "无效的激活链接" }, 400);
  }

  const user = await userQueries.getByRetrieveKey(key);
  if (!user) {
    return c.json({ success: false, error_msg: "无效的激活链接" }, 400);
  }

  await userQueries.updateActive(user.id);
  await userQueries.updateRetrieveKey(user.id, null, null);

  return c.json({ success: true, message: "账号已激活" });
});

auth.post("/auth/local/search_pass", zValidator("json", searchPassSchema), async (c) => {
  const { email, turnstileToken } = c.req.valid("json");

  if (!(await verifyTurnstile(turnstileToken, requestIp(c)))) {
    return c.json({ success: false, error_msg: "人机验证失败" }, 403);
  }

  const user = await userQueries.getByEmail(email);
  if (!user) {
    return c.json({ success: false, error_msg: "邮箱不存在" }, 404);
  }

  const key = uuidv4();
  await userQueries.updateRetrieveKey(user.id, key, Date.now());

  if (process.env.APP_ENV !== "development") {
    await sendResetPassMail(email, key);
  }

  return c.json({ success: true, message: "重置密码邮件已发送" });
});

auth.post("/auth/local/reset_pass", zValidator("json", resetPassSchema), async (c) => {
  const { key, psw } = c.req.valid("json");

  const user = await userQueries.getByRetrieveKey(key);
  if (!user || !user.retrieveTime || Date.now() - Number(user.retrieveTime) > RETRIEVE_KEY_TTL) {
    return c.json({ success: false, error_msg: "重置链接无效或已过期" }, 400);
  }

  const passhash = await bcryptjs.hash(psw, 10);
  await userQueries.updatePass(user.id, passhash);
  await userQueries.updateRetrieveKey(user.id, null, null);

  return c.json({ success: true, message: "密码已重置" });
});

auth.get("/auth/github", (c) => {
  // This route is now handled by the web frontend (auth/github.tsx)
  // API only handles the callback
  return c.redirect("/auth/github");
});

auth.get("/auth/github/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  if (!code) {
    return c.json({ success: false, error_msg: "missing code" }, 400);
  }

  const oauthState = getGithubOAuthState(c);
  clearGithubOAuthState(c);
  if (!state || !oauthState || state !== oauthState.state) {
    return c.redirect(`${webBaseUrl()}/signin?error=github_state_invalid`);
  }

  const clientId = process.env.AUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.AUTH_GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return c.json({ success: false, error_msg: "GitHub OAuth 未配置" }, 500);
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData: any = await tokenRes.json();

    if (tokenData.error) {
      console.error("[github oauth] token error:", tokenData.error);
      return c.json({ success: false, error_msg: tokenData.error }, 400);
    }

    const ghAccessToken = tokenData.access_token;
    if (!ghAccessToken) {
      console.error("[github oauth] no access_token in response:", tokenData);
      return c.json({ success: false, error_msg: "no access_token" }, 400);
    }

    const profileRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${ghAccessToken}`,
        "User-Agent": "cnode-next",
      },
    });
    const profile: any = await profileRes.json();

    if (!profile.id) {
      console.error("[github oauth] profile error:", profile);
      return c.json({ success: false, error_msg: "failed to get profile" }, 400);
    }

    // Get email (may need separate call for private email)
    let email = profile.email;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `token ${ghAccessToken}`,
          "User-Agent": "cnode-next",
        },
      });
      const emails: any = await emailsRes.json();
      const primaryEmail = Array.isArray(emails) ? emails.find((e: any) => e.primary) : null;
      email = primaryEmail?.email;
    }

    if (!email) {
      return c.redirect(`${webBaseUrl()}/auth/github/no-email`);
    }

    let user = await userQueries.getByGithubId(String(profile.id));

    if (oauthState.intent === "bind") {
      const currentUser = c.get("user");
      if (!currentUser) {
        return c.redirect(`${webBaseUrl()}/signin?error=github_bind_login_required`);
      }
      if (user && user.id !== currentUser.id) {
        return c.redirect(`${webBaseUrl()}/setting?error=github_already_bound`);
      }
      await userQueries.updateGithubInfo(currentUser.id, {
        githubId: String(profile.id),
        githubUsername: profile.login,
        githubAccessToken: ghAccessToken,
        avatar: profile.avatar_url,
      });
      return c.redirect(`${webBaseUrl()}/setting?github=bound`);
    }

    if (user) {
      await userQueries.updateGithubInfo(user.id, {
        githubId: String(profile.id),
        githubUsername: profile.login,
        githubAccessToken: ghAccessToken,
        avatar: profile.avatar_url,
      });
    } else {
      setPendingGithubProfile(c, {
        id: String(profile.id),
        login: profile.login,
        email,
        avatarUrl: profile.avatar_url,
        accessToken: ghAccessToken,
      });
      return c.redirect(`${webBaseUrl()}/auth/github/new`);
    }

    setSessionCookie(c, user.id);
    const redirectPath = c.req.query("redirect") || "/";
    return c.redirect(`${webBaseUrl()}${redirectPath}`);
  } catch (err) {
    console.error("[github oauth] error:", err);
    return c.json(
      { success: false, error_msg: err instanceof Error ? err.message : "github oauth failed" },
      500,
    );
  }
});

auth.get("/auth/github/pending", async (c) => {
  const profile = getPendingGithubProfile(c);
  if (!profile) return c.json({ success: false, error_msg: "GitHub 登录状态已过期" }, 401);
  const existingByEmail = await userQueries.getByEmail(profile.email);
  return c.json({
    success: true,
    data: {
      loginname: profile.login,
      email: profile.email,
      avatar_url: profile.avatarUrl,
      email_exists: !!existingByEmail,
    },
  });
});

auth.post(
  "/auth/github/create",
  perIpPerDay("create_user_per_ip", CREATE_USER_PER_IP, true),
  zValidator("json", githubCreateSchema),
  async (c) => {
  const profile = getPendingGithubProfile(c);
  if (!profile) return c.json({ success: false, error_msg: "GitHub 登录状态已过期，请重新授权" }, 401);

  const body = c.req.valid("json");
  let user: Awaited<ReturnType<typeof userQueries.getById>> | null = null;

  if (body.isnew) {
    const loginname = profile.login.toLowerCase();
    const existingByLogin = await userQueries.getByLoginName(loginname);
    if (existingByLogin) return c.json({ success: false, error_msg: "GitHub 用户名已被使用，请关联老账号" }, 422);
    const existingByEmail = await userQueries.getByEmail(profile.email);
    if (existingByEmail) return c.json({ success: false, error_msg: "该邮箱已注册，请关联老账号" }, 422);

    user = await userQueries.newAndSave({
      loginname,
      pass: await bcryptjs.hash(uuidv4(), 10),
      email: profile.email,
      avatar: profile.avatarUrl,
      active: true,
    });
  } else {
    const loginname = (body.name || "").trim().toLowerCase();
    const pass = body.pass || "";
    if (!loginname || !pass) return c.json({ success: false, error_msg: "账号名或密码错误" }, 403);
    user = await userQueries.getByLoginName(loginname);
    if (!user || !user.pass) return c.json({ success: false, error_msg: "账号名或密码错误" }, 403);
    const equal = await bcryptjs.compare(pass, user.pass);
    if (!equal) return c.json({ success: false, error_msg: "账号名或密码错误" }, 403);
  }

  await userQueries.updateGithubInfo(user.id, {
    githubId: profile.id,
    githubUsername: profile.login,
    githubAccessToken: profile.accessToken,
    avatar: profile.avatarUrl,
  });
  clearPendingGithubProfile(c);
  setSessionCookie(c, user.id);
    return c.json({ success: true });
  },
);

auth.post("/auth/signout", (c) => {
  clearSessionCookie(c);
  return c.json({ success: true });
});

auth.get("/auth/me", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ success: false, data: null });
  }
  const admins = (process.env.APP_ADMINS || "").split(",").filter(Boolean);
  const moderators = (process.env.APP_MODERATORS || "").split(",").filter(Boolean);
  const isAdmin = admins.includes(user.loginname);
  const isMod = moderators.includes(user.loginname) || isAdmin;

  return c.json({
    success: true,
    data: {
      loginname: user.loginname,
      email: user.email,
      github_username: user.githubUsername,
      github_bound: !!user.githubId,
      url: user.url,
      location: user.location,
      signature: user.signature,
      weibo: user.weibo,
      receive_reply_mail: !!user.receiveReplyMail,
      receive_at_mail: !!user.receiveAtMail,
      is_admin: isAdmin,
      is_mod: isMod,
      is_muted: !!user.isMuted || !!user.isBlock,
      is_block: !!user.isBlock,
    },
  });
});

auth.post("/auth/local/setting", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error_msg: "未登录" }, 401);
  const body = await c.req.json().catch(() => ({}));
  const { url, location, signature, weibo, receive_reply_mail, receive_at_mail } = body;
  await userQueries.updateProfile(user.id, {
    url,
    location,
    signature,
    weibo,
    receive_reply_mail,
    receive_at_mail,
  });
  return c.json({ success: true });
});

auth.post("/auth/local/change_pass", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error_msg: "未登录" }, 401);
  const body = await c.req.json().catch(() => ({}));
  const { oldPass, newPass } = body;
  const equal = await bcryptjs.compare(oldPass, user.pass);
  if (!equal) return c.json({ success: false, error_msg: "原密码错误" }, 403);
  if (newPass.length < 8 || !/[a-zA-Z]/.test(newPass) || !/[0-9]/.test(newPass)) {
    return c.json({ success: false, error_msg: "新密码至少 8 位,必须包含字母和数字" }, 422);
  }
  const passhash = await bcryptjs.hash(newPass, 10);
  await userQueries.updatePass(user.id, passhash);
  return c.json({ success: true });
});

auth.post("/upload/presign", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ success: false, error_msg: "未登录" }, 401);
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = presignUploadSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error_msg: "只支持 png/jpeg/gif/webp 图片上传" }, 422);
  }

  const { contentType } = parsed.data;
  const filename = `${uploadPrefix()}/${uuidv4()}${extensionForContentType(contentType)}`;
  const uploadUrl = createOssClient().signatureUrl(filename, {
    method: "PUT",
    expires: Number(process.env.OSS_UPLOAD_EXPIRES || 600),
    headers: {
      "Content-Type": contentType,
    },
  });
  const url = staticUploadUrl(filename);

  return c.json({
    success: true,
    url,
    upload_url: uploadUrl,
    method: "PUT",
    headers: { "Content-Type": contentType },
    filename,
  });
});

auth.post("/upload/image", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ success: false, error_msg: "未登录" }, 401);
  }

  const formData = await c.req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return c.json({ success: false, error_msg: "请选择要上传的图片" }, 400);
  }

  if (!allowedImageTypes.has(file.type)) {
    return c.json({ success: false, error_msg: "只支持 png/jpeg/gif/webp 图片上传" }, 422);
  }

  const originalName = safeOriginalName(file.name);
  const originalExtension = extensionForFilename(originalName);
  if (originalExtension && !allowedImageExtensions.has(originalExtension)) {
    return c.json({ success: false, error_msg: "只支持 png/jpeg/gif/webp 图片上传" }, 422);
  }

  const maxSize = Number(process.env.OSS_UPLOAD_MAX_BYTES || 5 * 1024 * 1024);
  if (file.size > maxSize) {
    return c.json({ success: false, error_msg: "图片不能超过 5MB" }, 413);
  }

  const filename = `${uploadPrefix()}/${uuidv4()}${extensionForContentType(file.type)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await createOssClient().put(filename, buffer, {
    headers: {
      "Content-Type": file.type,
    },
  });

  return c.json({
    success: true,
    url: staticUploadUrl(filename),
    filename: originalName,
  });
});

export { auth as authRoutes };
