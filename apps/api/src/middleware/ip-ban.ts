import { createMiddleware } from "hono/factory";
import { ipBanQueries } from "../lib/db";
import type { AuthVars } from "./auth";

function requestIp(c: any) {
  const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  return c.req.header("x-real-ip") || c.req.header("cf-connecting-ip") || forwarded || "";
}

export function ipBanMiddleware() {
  return createMiddleware<{
    Variables: AuthVars;
  }>(async (c, next) => {
    const ip = requestIp(c);
    if (ip && (await ipBanQueries.isBanned(ip))) {
      return c.json({ success: false, error_msg: "IP 已被封禁" }, 403);
    }

    await next();
  });
}
