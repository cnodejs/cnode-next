import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import OSS from "ali-oss";
import bcryptjs from "bcryptjs";
import { Buffer } from "node:buffer";
import { v4 as uuidv4 } from "uuid";
import {
  signinBodySchema,
  signupBodySchema,
  searchPassBodySchema,
  resetPassBodySchema,
  githubCreateBodySchema,
  githubUnbindSchema,
  errorResponseSchema,
} from "@cnode/shared";
import { auditQueries, roleQueries, settingQueries, userQueries } from "../lib/db";
import { sendActiveMail, sendResetPassMail } from "../lib/mail";
import { setSessionCookie, clearSessionCookie, authMiddleware, type AuthVars } from "../middleware/auth";
import { perIpPerDay, perUserPerDay } from "../middleware/rate-limit";
import { requestIp, verifyTurnstile } from "../lib/turnstile";
import {
  decideGithubBind,
  executeGithubUnbind,
  isGithubIdUniqueViolation,
  revokeGithubToken,
} from "../lib/github-account-linking";

const auth = new OpenAPIHono<{ Variables: AuthVars }>();
auth.use("*", authMiddleware());

const CREATE_USER_PER_IP = 1000;
const RETRIEVE_KEY_TTL = 24 * 60 * 60 * 1000;
const GITHUB_PENDING_COOKIE = "github_profile";
const GITHUB_OAUTH_COOKIE = "github_oauth_state";

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
  if (!accessKeyId || !accessKeySecret || !bucket) throw new Error("OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET and OSS_BUCKET are required");
  return new OSS({ accessKeyId, accessKeySecret, bucket, region, endpoint });
}
function uploadPrefix(purpose?: string | null) {
  const base = (process.env.OSS_UPLOAD_PREFIX || "cnode-next/uploads").replace(/^\/+|\/+$/g, "");
  return purpose === "job-logo" ? `${base}/jobs` : base;
}
function staticUploadUrl(filename: string) { return `${(process.env.OSS_STATIC_HOST || "https://static.cnodejs.org").replace(/\/+$/g, "")}/${filename}`; }
function safeOriginalName(name: string) { return name.replace(/[/\\]/g, "").trim().slice(0, 255) || "image"; }
function extensionForFilename(name: string) { return name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || ""; }
function webBaseUrl() { return process.env.APP_WEB_BASE_URL || "http://localhost:5173"; }
function cookieSecret() { return process.env.AUTH_SESSION_SECRET || "local-dev-secret"; }

function setPendingGithubProfile(c: any, profile: PendingGithubProfile) {
  const domain = process.env.AUTH_COOKIE_DOMAIN || undefined;
  setCookie(c, GITHUB_PENDING_COOKIE, Buffer.from(JSON.stringify(profile)).toString("base64url"), { domain, path: "/", httpOnly: true, signed: true, secret: cookieSecret(), maxAge: 600, sameSite: "Lax" } as any);
}
function clearPendingGithubProfile(c: any) { deleteCookie(c, GITHUB_PENDING_COOKIE, { domain: process.env.AUTH_COOKIE_DOMAIN || undefined, path: "/" }); }
function getPendingGithubProfile(c: any): PendingGithubProfile | null {
  const raw = (getCookie as any)(c, GITHUB_PENDING_COOKIE, cookieSecret());
  if (!raw) return null;
  try { const p = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")); return p.id && p.login && p.email && p.accessToken ? p : null; } catch { return null; }
}
function getGithubOAuthState(c: any): GithubOAuthState | null {
  const raw = getCookie(c, GITHUB_OAUTH_COOKIE); if (!raw) return null;
  try { const p = JSON.parse(decodeURIComponent(raw)); return p.state && ["login","bind"].includes(p.intent) ? p : null; } catch { return null; }
}
function clearGithubOAuthState(c: any) { deleteCookie(c, GITHUB_OAUTH_COOKIE, { domain: process.env.AUTH_COOKIE_DOMAIN || undefined, path: "/" }); }
async function logGithubAccountAction(user: { id: number; loginname: string }, action: string, result: string, detail: Record<string, string | number | null>) {
  await auditQueries.log(user.id, user.loginname, action, { type: "user", id: String(user.id), name: user.loginname }, result, JSON.stringify(detail));
}
async function rejectGithubBind(c: any, currentUser: { id: number; loginname: string }, githubId: string, githubUsername: string, accessToken: string, error: "github_already_bound" | "github_different_account") {
  const revoke = await revokeGithubToken(accessToken);
  await logGithubAccountAction(currentUser, "github_bind", "rejected", { githubId, githubUsername, reason: error, tokenRevoke: revoke.revoked ? revoke.reason : "failed" });
  return c.redirect(`${webBaseUrl()}/setting?error=${error}`);
}

type PendingGithubProfile = { id: string; login: string; email: string; avatarUrl?: string; accessToken: string };
type GithubOAuthState = { state: string; intent: "login" | "bind" };

// --- POST /auth/local/login ---
const loginRoute = createRoute({
  method: "post", path: "/auth/local/login", tags: ["auth"], summary: "本地登录",
  request: { body: { content: { "application/json": { schema: signinBodySchema } } } },
  responses: {
    200: { description: "登录成功", content: { "application/json": { schema: z.object({ success: z.literal(true) }) } } },
    403: { description: "用户名或密码错误或账号未激活", content: { "application/json": { schema: errorResponseSchema } } },
  },
});
auth.openapi(loginRoute, async (c) => {
  const { name, pass } = c.req.valid("json");
  let user = await userQueries.getByLoginName(name.toLowerCase());
  if (!user) user = await userQueries.getByEmail(name);
  if (!user) return c.json({ success: false as const, error_msg: "用户名或密码错误" }, 403);
  const equal = await bcryptjs.compare(pass, user.pass);
  if (!equal) return c.json({ success: false as const, error_msg: "用户名或密码错误" }, 403);
  if (!user.active) return c.json({ success: false as const, error_msg: "账号未激活" }, 403);
  setSessionCookie(c, user.id);
  return c.json({ success: true as const }, 200);
});

// --- GET /auth/config ---
const configRoute = createRoute({
  method: "get", path: "/auth/config", tags: ["system config"], summary: "获取公开认证配置",
  responses: { 200: { description: "配置", content: { "application/json": { schema: z.object({ success: z.literal(true), data: z.object({ allow_signup: z.boolean() }) }) } } } },
});
auth.openapi(configRoute, async (c) => {
  const allowSignup = (await settingQueries.get("allow_signup", "true")) !== "false";
  return c.json({ success: true as const, data: { allow_signup: allowSignup } }, 200);
});

// --- POST /auth/local/signup ---
const signupRoute = createRoute({
  method: "post", path: "/auth/local/signup", tags: ["auth"], summary: "本地注册",
  middleware: [perIpPerDay("create_user_per_ip", CREATE_USER_PER_IP, true)],
  request: { body: { content: { "application/json": { schema: signupBodySchema } } } },
  responses: {
    200: { description: "注册成功", content: { "application/json": { schema: z.object({ success: z.literal(true), message: z.string() }) } } },
    403: { description: "注册关闭或人机验证失败", content: { "application/json": { schema: errorResponseSchema } } },
    422: { description: "用户名或邮箱已存在", content: { "application/json": { schema: errorResponseSchema } } },
  },
});
auth.openapi(signupRoute, async (c) => {
  const allowSignup = (await settingQueries.get("allow_signup", "true")) !== "false";
  if (!allowSignup) return c.json({ success: false as const, error_msg: "当前暂不开放注册" }, 403);
  const { loginname, pass, email, turnstileToken } = c.req.valid("json");
  if (!(await verifyTurnstile(turnstileToken, requestIp(c)))) return c.json({ success: false as const, error_msg: "人机验证失败" }, 403);
  if (await userQueries.getByLoginName(loginname.toLowerCase())) return c.json({ success: false as const, error_msg: "用户名已被使用" }, 422);
  if (await userQueries.getByEmail(email)) return c.json({ success: false as const, error_msg: "邮箱已被使用" }, 422);
  const passhash = await bcryptjs.hash(pass, 10);
  const retrieveKey = uuidv4();
  const user = await userQueries.newAndSave({ loginname: loginname.toLowerCase(), pass: passhash, email, active: false });
  await userQueries.updateRetrieveKey(user.id, retrieveKey, Date.now());
  if (process.env.APP_ENV !== "development") await sendActiveMail(email, retrieveKey);
  return c.json({ success: true as const, message: "注册成功,请查收邮件激活账号" }, 200);
});

// --- GET /auth/local/active_account ---
const activeAccountRoute = createRoute({
  method: "get", path: "/auth/local/active_account", tags: ["auth"], summary: "激活账号",
  request: { query: z.object({ key: z.string().optional() }) },
  responses: { 200: { description: "激活成功", content: { "application/json": { schema: z.object({ success: z.literal(true), message: z.string() }) } } }, 400: { description: "无效链接", content: { "application/json": { schema: errorResponseSchema } } } },
});
auth.openapi(activeAccountRoute, async (c) => {
  const { key } = c.req.valid("query");
  if (!key) return c.json({ success: false as const, error_msg: "无效的激活链接" }, 400);
  const user = await userQueries.getByRetrieveKey(key);
  if (!user) return c.json({ success: false as const, error_msg: "无效的激活链接" }, 400);
  await userQueries.updateActive(user.id);
  await userQueries.updateRetrieveKey(user.id, null, null);
  return c.json({ success: true as const, message: "账号已激活" }, 200);
});

// --- POST /auth/local/search_pass ---
const searchPassRoute = createRoute({
  method: "post", path: "/auth/local/search_pass", tags: ["auth"], summary: "找回密码",
  request: { body: { content: { "application/json": { schema: searchPassBodySchema } } } },
  responses: { 200: { description: "邮件已发送", content: { "application/json": { schema: z.object({ success: z.literal(true), message: z.string() }) } } }, 403: { description: "人机验证失败", content: { "application/json": { schema: errorResponseSchema } } }, 404: { description: "邮箱不存在", content: { "application/json": { schema: errorResponseSchema } } } },
});
auth.openapi(searchPassRoute, async (c) => {
  const { email, turnstileToken } = c.req.valid("json");
  if (!(await verifyTurnstile(turnstileToken, requestIp(c)))) return c.json({ success: false as const, error_msg: "人机验证失败" }, 403);
  const user = await userQueries.getByEmail(email);
  if (!user) return c.json({ success: false as const, error_msg: "邮箱不存在" }, 404);
  const key = uuidv4();
  await userQueries.updateRetrieveKey(user.id, key, Date.now());
  if (process.env.APP_ENV !== "development") await sendResetPassMail(email, key);
  return c.json({ success: true as const, message: "重置密码邮件已发送" }, 200);
});

// --- POST /auth/local/reset_pass ---
const resetPassRoute = createRoute({
  method: "post", path: "/auth/local/reset_pass", tags: ["auth"], summary: "重置密码",
  request: { body: { content: { "application/json": { schema: resetPassBodySchema } } } },
  responses: { 200: { description: "重置成功", content: { "application/json": { schema: z.object({ success: z.literal(true), message: z.string() }) } } }, 400: { description: "链接无效或过期", content: { "application/json": { schema: errorResponseSchema } } } },
});
auth.openapi(resetPassRoute, async (c) => {
  const { key, psw } = c.req.valid("json");
  const user = await userQueries.getByRetrieveKey(key);
  if (!user || !user.retrieveTime || Date.now() - Number(user.retrieveTime) > RETRIEVE_KEY_TTL) return c.json({ success: false as const, error_msg: "重置链接无效或已过期" }, 400);
  await userQueries.updatePass(user.id, await bcryptjs.hash(psw, 10));
  await userQueries.updateRetrieveKey(user.id, null, null);
  return c.json({ success: true as const, message: "密码已重置" }, 200);
});

// --- GET /auth/github (redirect, no OAS) ---
auth.get("/auth/github", (c) => c.redirect("/auth/github"));

// --- GET /auth/github/callback (redirect, no OAS) ---
auth.get("/auth/github/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  if (!code) return c.json({ success: false, error_msg: "missing code" }, 400);
  const oauthState = getGithubOAuthState(c);
  clearGithubOAuthState(c);
  if (!state || !oauthState || state !== oauthState.state) return c.redirect(`${webBaseUrl()}/signin?error=github_state_invalid`);
  const clientId = process.env.AUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.AUTH_GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return c.json({ success: false, error_msg: "GitHub OAuth 未配置" }, 500);
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }) });
    const tokenData: any = await tokenRes.json();
    if (tokenData.error) return c.json({ success: false, error_msg: tokenData.error }, 400);
    const ghAccessToken = tokenData.access_token;
    if (!ghAccessToken) return c.json({ success: false, error_msg: "no access_token" }, 400);
    const profileRes = await fetch("https://api.github.com/user", { headers: { Authorization: `token ${ghAccessToken}`, "User-Agent": "cnode-next" } });
    const profile: any = await profileRes.json();
    if (!profile.id) return c.json({ success: false, error_msg: "failed to get profile" }, 400);
    let email = profile.email;
    if (!email) { const emailsRes = await fetch("https://api.github.com/user/emails", { headers: { Authorization: `token ${ghAccessToken}`, "User-Agent": "cnode-next" } }); const emails: any = await emailsRes.json(); email = Array.isArray(emails) ? emails.find((e: any) => e.primary)?.email : null; }
    if (!email) return c.redirect(`${webBaseUrl()}/auth/github/no-email`);
    const user = await userQueries.getByGithubId(String(profile.id));
    if (oauthState.intent === "bind") {
      const currentUser = c.get("user");
      if (!currentUser) { await revokeGithubToken(ghAccessToken); return c.redirect(`${webBaseUrl()}/signin?error=github_bind_login_required`); }
      const decision = decideGithubBind(currentUser.githubId, String(profile.id), user?.id ?? null, currentUser.id);
      if (decision === "reject-different" || decision === "reject-occupied") return rejectGithubBind(c, currentUser, String(profile.id), profile.login, ghAccessToken, decision === "reject-different" ? "github_different_account" : "github_already_bound");
      try { await userQueries.updateGithubInfo(currentUser.id, { githubId: String(profile.id), githubUsername: profile.login, githubAccessToken: ghAccessToken, avatar: profile.avatar_url }); } catch (error) { if (isGithubIdUniqueViolation(error)) return rejectGithubBind(c, currentUser, String(profile.id), profile.login, ghAccessToken, "github_already_bound"); throw error; }
      await logGithubAccountAction(currentUser, "github_bind", "success", { githubId: String(profile.id), githubUsername: profile.login, mode: decision });
      return c.redirect(`${webBaseUrl()}/setting?github=bound`);
    }
    if (user) { await userQueries.updateGithubInfo(user.id, { githubId: String(profile.id), githubUsername: profile.login, githubAccessToken: ghAccessToken, avatar: profile.avatar_url }); }
    else { setPendingGithubProfile(c, { id: String(profile.id), login: profile.login, email, avatarUrl: profile.avatar_url, accessToken: ghAccessToken }); return c.redirect(`${webBaseUrl()}/auth/github/new`); }
    setSessionCookie(c, user.id);
    return c.redirect(`${webBaseUrl()}${c.req.query("redirect") || "/"}`);
  } catch { return c.json({ success: false, error_msg: "GitHub 登录暂时不可用" }, 500); }
});

// --- GET /auth/github/pending ---
const githubPendingRoute = createRoute({
  method: "get", path: "/auth/github/pending", tags: ["auth"], summary: "获取 GitHub pending profile",
  responses: { 200: { description: "pending profile", content: { "application/json": { schema: z.object({ success: z.literal(true), data: z.object({ loginname: z.string(), email: z.string(), avatar_url: z.string().optional(), email_exists: z.boolean() }) }) } } }, 401: { description: "状态过期", content: { "application/json": { schema: errorResponseSchema } } } },
});
auth.openapi(githubPendingRoute, async (c) => {
  const profile = getPendingGithubProfile(c);
  if (!profile) return c.json({ success: false as const, error_msg: "GitHub 登录状态已过期" }, 401);
  const existingByEmail = await userQueries.getByEmail(profile.email);
  return c.json({ success: true as const, data: { loginname: profile.login, email: profile.email, avatar_url: profile.avatarUrl, email_exists: !!existingByEmail } }, 200);
});

// --- POST /auth/github/create ---
const githubCreateRoute = createRoute({
  method: "post", path: "/auth/github/create", tags: ["auth"], summary: "GitHub 注册或关联",
  middleware: [perIpPerDay("create_user_per_ip", CREATE_USER_PER_IP, true)],
  request: { body: { content: { "application/json": { schema: githubCreateBodySchema } } } },
  responses: { 200: { description: "成功", content: { "application/json": { schema: z.object({ success: z.literal(true) }) } } }, 401: { description: "状态过期", content: { "application/json": { schema: errorResponseSchema } } }, 403: { description: "账号名或密码错误", content: { "application/json": { schema: errorResponseSchema } } }, 409: { description: "绑定冲突", content: { "application/json": { schema: errorResponseSchema } } }, 422: { description: "用户名或邮箱已存在", content: { "application/json": { schema: errorResponseSchema } } } },
});
auth.openapi(githubCreateRoute, async (c) => {
  const profile = getPendingGithubProfile(c);
  if (!profile) return c.json({ success: false as const, error_msg: "GitHub 登录状态已过期，请重新授权" }, 401);
  const body = c.req.valid("json");
  let user: Awaited<ReturnType<typeof userQueries.getById>> | null = null;
  if (body.isnew) {
    const loginname = profile.login.toLowerCase();
    if (await userQueries.getByLoginName(loginname)) return c.json({ success: false as const, error_msg: "GitHub 用户名已被使用，请关联老账号" }, 422);
    if (await userQueries.getByEmail(profile.email)) return c.json({ success: false as const, error_msg: "该邮箱已注册，请关联老账号" }, 422);
    try { user = await userQueries.newAndSave({ loginname, pass: await bcryptjs.hash(uuidv4(), 10), email: profile.email, avatar: profile.avatarUrl, active: true, githubId: profile.id, githubUsername: profile.login, githubAccessToken: profile.accessToken }); }
    catch (error) { if (isGithubIdUniqueViolation(error)) { await revokeGithubToken(profile.accessToken); clearPendingGithubProfile(c); return c.json({ success: false as const, error_msg: "该 GitHub 账号已绑定到其他用户" }, 409); } throw error; }
  } else {
    const loginname = (body.name || "").trim().toLowerCase();
    const pass = body.pass || "";
    if (!loginname || !pass) return c.json({ success: false as const, error_msg: "账号名或密码错误" }, 403);
    user = await userQueries.getByLoginName(loginname);
    if (!user || !user.pass) return c.json({ success: false as const, error_msg: "账号名或密码错误" }, 403);
    if (!(await bcryptjs.compare(pass, user.pass))) return c.json({ success: false as const, error_msg: "账号名或密码错误" }, 403);
    const occupyingUser = await userQueries.getByGithubId(profile.id);
    const decision = decideGithubBind(user.githubId, profile.id, occupyingUser?.id ?? null, user.id);
    if (decision === "reject-different" || decision === "reject-occupied") { await revokeGithubToken(profile.accessToken); clearPendingGithubProfile(c); return c.json({ success: false as const, error_msg: decision === "reject-different" ? "当前账号已绑定其他 GitHub 账号，请先解绑" : "该 GitHub 账号已绑定到其他用户" }, 409); }
    try { await userQueries.updateGithubInfo(user.id, { githubId: profile.id, githubUsername: profile.login, githubAccessToken: profile.accessToken, avatar: profile.avatarUrl }); }
    catch (error) { if (isGithubIdUniqueViolation(error)) { await revokeGithubToken(profile.accessToken); clearPendingGithubProfile(c); return c.json({ success: false as const, error_msg: "该 GitHub 账号已绑定到其他用户" }, 409); } throw error; }
  }
  await logGithubAccountAction(user, "github_bind", "success", { githubId: profile.id, githubUsername: profile.login, mode: body.isnew ? "new-user" : "existing-user" });
  clearPendingGithubProfile(c);
  setSessionCookie(c, user.id);
  return c.json({ success: true as const }, 200);
});

// --- POST /auth/github/unbind ---
const githubUnbindRoute = createRoute({
  method: "post", path: "/auth/github/unbind", tags: ["auth"], summary: "解绑 GitHub",
  middleware: [perUserPerDay("github_unbind", 10, true)],
  request: { body: { content: { "application/json": { schema: githubUnbindSchema } } } },
  responses: { 200: { description: "解绑成功", content: { "application/json": { schema: z.object({ success: z.literal(true) }) } } }, 401: { description: "未登录", content: { "application/json": { schema: errorResponseSchema } } }, 403: { description: "密码错误", content: { "application/json": { schema: errorResponseSchema } } }, 409: { description: "未绑定或状态变化", content: { "application/json": { schema: errorResponseSchema } } }, 503: { description: "操作失败", content: { "application/json": { schema: errorResponseSchema } } } },
});
auth.openapi(githubUnbindRoute, async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) return c.json({ success: false as const, error_msg: "未登录" }, 401);
  const user = await userQueries.getById(sessionUser.id);
  if (!user) return c.json({ success: false as const, error_msg: "未登录" }, 401);
  if (!user.githubId) return c.json({ success: false as const, error_msg: "当前账号未绑定 GitHub" }, 409);
  const { password } = c.req.valid("json");
  let result: Awaited<ReturnType<typeof executeGithubUnbind>>;
  try { result = await executeGithubUnbind(user, password, { clearGithubInfo: userQueries.clearGithubInfo, revokeToken: revokeGithubToken, verifyPassword: bcryptjs.compare }); }
  catch { await logGithubAccountAction(user, "github_unbind", "failed", { githubId: user.githubId, reason: "local-operation-failed" }); return c.json({ success: false as const, error_msg: "解除绑定暂时失败，请稍后重试" }, 503); }
  if (!result.success && result.reason === "invalid-password") { await logGithubAccountAction(user, "github_unbind", "rejected", { githubId: user.githubId, reason: "invalid-password" }); return c.json({ success: false as const, error_msg: "当前密码错误；如果你从未设置过密码，请先重置密码" }, 403); }
  if (!result.success && result.reason === "revoke-failed") { await logGithubAccountAction(user, "github_unbind", "failed", { githubId: user.githubId, reason: "token-revoke-failed" }); return c.json({ success: false as const, error_msg: "GitHub 授权暂时无法撤销，请稍后重试" }, 503); }
  if (!result.success && result.reason === "binding-changed") { await logGithubAccountAction(user, "github_unbind", "failed", { githubId: user.githubId, reason: "binding-changed" }); return c.json({ success: false as const, error_msg: "GitHub 绑定状态已变化，请刷新后重试" }, 409); }
  if (!result.success) return c.json({ success: false as const, error_msg: "当前账号未绑定 GitHub" }, 409);
  await logGithubAccountAction(user, "github_unbind", "success", { githubId: user.githubId, githubUsername: user.githubUsername, tokenRevoke: result.tokenRevoke });
  return c.json({ success: true as const }, 200);
});

// --- POST /auth/signout ---
const signoutRoute = createRoute({
  method: "post", path: "/auth/signout", tags: ["auth"], summary: "退出登录",
  responses: { 200: { description: "成功", content: { "application/json": { schema: z.object({ success: z.literal(true) }) } } } },
});
auth.openapi(signoutRoute, (c) => { clearSessionCookie(c); return c.json({ success: true as const }, 200); });

// --- GET /auth/me ---
const meRoute = createRoute({
  method: "get", path: "/auth/me", tags: ["auth"], summary: "获取当前登录用户",
  responses: { 200: { description: "当前用户", content: { "application/json": { schema: z.object({ success: z.boolean(), data: z.any().nullable() }) } } } },
});
auth.openapi(meRoute, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, data: null }, 200);
  const admins = (process.env.APP_ADMINS || "").split(",").filter(Boolean);
  const moderators = (process.env.APP_MODERATORS || "").split(",").filter(Boolean);
  const roles = await roleQueries.listByUserId(user.id);
  const isAdmin = admins.includes(user.loginname);
  const isMod = moderators.includes(user.loginname) || roles.includes("moderator") || isAdmin;
  return c.json({ success: true, data: { loginname: user.loginname, email: user.email, github_username: user.githubUsername, github_bound: !!user.githubId, url: user.url, location: user.location, signature: user.signature, weibo: user.weibo, receive_reply_mail: !!user.receiveReplyMail, receive_at_mail: !!user.receiveAtMail, is_admin: isAdmin, is_mod: isMod, roles, is_muted: !!user.isMuted || !!user.isBlock, is_block: !!user.isBlock } }, 200);
});

// --- POST /auth/local/setting ---
const settingRoute = createRoute({
  method: "post", path: "/auth/local/setting", tags: ["auth"], summary: "更新个人资料",
  request: { body: { content: { "application/json": { schema: z.object({ url: z.string().optional(), location: z.string().optional(), signature: z.string().optional(), weibo: z.string().optional(), receive_reply_mail: z.boolean().optional(), receive_at_mail: z.boolean().optional() }).passthrough() } } } },
  responses: { 200: { description: "成功", content: { "application/json": { schema: z.object({ success: z.literal(true) }) } } }, 401: { description: "未登录", content: { "application/json": { schema: errorResponseSchema } } } },
});
auth.openapi(settingRoute, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ success: false as const, error_msg: "未登录" }, 401);
  const { url, location, signature, weibo, receive_reply_mail, receive_at_mail } = c.req.valid("json");
  await userQueries.updateProfile(user.id, { url, location, signature, weibo, receive_reply_mail, receive_at_mail });
  return c.json({ success: true as const }, 200);
});

// --- POST /auth/local/change_pass ---
const changePassRoute = createRoute({
  method: "post", path: "/auth/local/change_pass", tags: ["auth"], summary: "修改密码",
  request: { body: { content: { "application/json": { schema: z.object({ oldPass: z.string(), newPass: z.string() }) } } } },
  responses: { 200: { description: "成功", content: { "application/json": { schema: z.object({ success: z.literal(true) }) } } }, 401: { description: "未登录", content: { "application/json": { schema: errorResponseSchema } } }, 403: { description: "原密码错误", content: { "application/json": { schema: errorResponseSchema } } }, 422: { description: "新密码不合规", content: { "application/json": { schema: errorResponseSchema } } } },
});
auth.openapi(changePassRoute, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ success: false as const, error_msg: "未登录" }, 401);
  const { oldPass, newPass } = c.req.valid("json");
  if (!(await bcryptjs.compare(oldPass, user.pass))) return c.json({ success: false as const, error_msg: "原密码错误" }, 403);
  if (newPass.length < 8 || !/[a-zA-Z]/.test(newPass) || !/[0-9]/.test(newPass)) return c.json({ success: false as const, error_msg: "新密码至少 8 位,必须包含字母和数字" }, 422);
  await userQueries.updatePass(user.id, await bcryptjs.hash(newPass, 10));
  return c.json({ success: true as const }, 200);
});

// --- POST /upload/presign ---
const presignRoute = createRoute({
  method: "post", path: "/upload/presign", tags: ["auth"], summary: "获取图片上传预签名 URL",
  request: { body: { content: { "application/json": { schema: presignUploadSchema } } } },
  responses: { 200: { description: "预签名 URL", content: { "application/json": { schema: z.object({ success: z.literal(true), url: z.string(), upload_url: z.string(), method: z.string(), headers: z.record(z.string(), z.string()), filename: z.string() }) } } }, 401: { description: "未登录", content: { "application/json": { schema: errorResponseSchema } } }, 422: { description: "不支持的图片类型", content: { "application/json": { schema: errorResponseSchema } } } },
});
auth.openapi(presignRoute, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ success: false as const, error_msg: "未登录" }, 401);
  const parsed = presignUploadSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ success: false as const, error_msg: "只支持 png/jpeg/gif/webp 图片上传" }, 422);
  const { contentType } = parsed.data;
  const filename = `${uploadPrefix()}/${uuidv4()}${extensionForContentType(contentType)}`;
  const uploadUrl = createOssClient().signatureUrl(filename, { method: "PUT", expires: Number(process.env.OSS_UPLOAD_EXPIRES || 600), headers: { "Content-Type": contentType } });
  return c.json({ success: true as const, url: staticUploadUrl(filename), upload_url: uploadUrl, method: "PUT", headers: { "Content-Type": contentType }, filename }, 200);
});

// --- POST /upload/image (formData, no OAS) ---
auth.post("/upload/image", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error_msg: "未登录" }, 401);
  const formData = await c.req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) return c.json({ success: false, error_msg: "请选择要上传的图片" }, 400);
  if (!allowedImageTypes.has(file.type)) return c.json({ success: false, error_msg: "只支持 png/jpeg/gif/webp 图片上传" }, 422);
  const originalName = safeOriginalName(file.name);
  const originalExtension = extensionForFilename(originalName);
  if (originalExtension && !allowedImageExtensions.has(originalExtension)) return c.json({ success: false, error_msg: "只支持 png/jpeg/gif/webp 图片上传" }, 422);
  const maxSize = Number(process.env.OSS_UPLOAD_MAX_BYTES || 5 * 1024 * 1024);
  if (file.size > maxSize) return c.json({ success: false, error_msg: "图片不能超过 5MB" }, 413);
  const purpose = typeof formData?.get("purpose") === "string" ? String(formData.get("purpose")) : null;
  const filename = `${uploadPrefix(purpose)}/${uuidv4()}${extensionForContentType(file.type)}`;
  await createOssClient().put(filename, Buffer.from(await file.arrayBuffer()), { headers: { "Content-Type": file.type } });
  return c.json({ success: true, url: staticUploadUrl(filename), filename: originalName });
});

export { auth as authRoutes };
