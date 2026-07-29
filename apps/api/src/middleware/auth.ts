import { createMiddleware } from "hono/factory";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { roleQueries, userQueries } from "../lib/db";

export interface AuthVars {
  user: Awaited<ReturnType<typeof userQueries.getById>> | null;
  isLogin: boolean;
  isAdmin: boolean;
  isMod: boolean;
  roles: string[];
}

export function setSessionCookie(
  c: any,
  userId: number,
) {
  const cookieName = process.env.AUTH_COOKIE_NAME || "node_club";
  const domain = process.env.AUTH_COOKIE_DOMAIN || undefined;
  const secret = process.env.AUTH_SESSION_SECRET || "local-dev-secret";
  const token = `${userId}$$$$`;
  setCookie(c as any, cookieName, token, {
    domain,
    path: "/",
    httpOnly: true,
    signed: true,
    secret,
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "Lax",
  } as any);
}

export function clearSessionCookie(c: any) {
  const cookieName = process.env.AUTH_COOKIE_NAME || "node_club";
  const domain = process.env.AUTH_COOKIE_DOMAIN || undefined;
  deleteCookie(c, cookieName, { domain, path: "/" });
}

export const authMiddleware = () =>
  createMiddleware<{
    Variables: AuthVars;
  }>(async (c, next) => {
    const cookieName = process.env.AUTH_COOKIE_NAME || "node_club";
    const secret = process.env.AUTH_SESSION_SECRET || "local-dev-secret";
  const token = (getCookie as any)(c, cookieName, secret);

    let user: AuthVars["user"] = null;

    if (token) {
      const parts = token.split("$$$$");
      const userId = parts[0];
      if (userId) {
        const id = Number(userId);
        if (id > 0 && !Number.isNaN(id)) {
          user = await userQueries.getById(id);
        }
      }
    }

    const admins = (process.env.APP_ADMINS || "").split(",").filter(Boolean);
    const moderators = (process.env.APP_MODERATORS || "").split(",").filter(Boolean);

    const roles = user ? await roleQueries.listByUserId(user.id) : [];
    const isAdmin = user ? admins.includes(user.loginname) : false;
    const isMod = user ? moderators.includes(user.loginname) || roles.includes("moderator") || isAdmin : false;

    c.set("user", user);
    c.set("isLogin", !!user);
    c.set("isAdmin", isAdmin);
    c.set("isMod", isMod);
    c.set("roles", roles);

    await next();
  });

export function userRequired() {
  return createMiddleware<{
    Variables: AuthVars;
  }>(async (c, next) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ success: false, error_msg: "未登录" }, 401);
    }
    if (user.isMuted || user.isBlock) {
      return c.json({ success: false, error_msg: "您已被禁言" }, 403);
    }
    await next();
  });
}

export function adminRequired() {
  return createMiddleware<{
    Variables: AuthVars;
  }>(async (c, next) => {
    if (!c.get("isAdmin")) {
      return c.json({ success: false, error_msg: "需要管理员权限" }, 403);
    }
    await next();
  });
}

export function modRequired() {
  return createMiddleware<{
    Variables: AuthVars;
  }>(async (c, next) => {
    if (!c.get("isMod")) {
      return c.json({ success: false, error_msg: "需要版主权限" }, 403);
    }
    await next();
  });
}
