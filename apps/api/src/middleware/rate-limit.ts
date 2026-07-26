import { createMiddleware } from "hono/factory";
import { getCache } from "../lib/cache";
import { userQueries } from "../lib/db";

const SECONDS_PER_DAY = 86400;

interface RateLimitOptions {
  identityName: string;
  name: string;
  identityFn: (c: any) => string | Promise<string>;
  limitCount: number;
  showJson: boolean;
}

function makePerDayLimiter(options: RateLimitOptions) {
  return createMiddleware(async (c, next) => {
    const identity = await options.identityFn(c);
    if (!identity && process.env.APP_ENV === "development") {
      await next();
      return;
    }

    const date = new Date();
    const YYYYMMDD = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
      date.getDate(),
    ).padStart(2, "0")}`;
    const key = `${YYYYMMDD}^_^@T_T${options.identityName}^_^@T_T${options.name}^_^@T_T${identity}`;

    const cache = getCache();
    const count = await cache.incr(key, SECONDS_PER_DAY);

    if (count > options.limitCount) {
      c.status(403);
      c.header("X-RateLimit-Limit", String(options.limitCount));
      c.header("X-RateLimit-Remaining", "0");
      if (options.showJson) {
        return c.json({
          success: false,
          error_msg: `频率限制:当前操作每天可以进行 ${options.limitCount} 次`,
        });
      }
      return c.json({
        success: false,
        error_msg: `频率限制:当前操作每天可以进行 ${options.limitCount} 次`,
      });
    }

    c.header("X-RateLimit-Limit", String(options.limitCount));
    c.header("X-RateLimit-Remaining", String(options.limitCount - count));

    await next();
  });
}

export function perUserPerDay(name: string, limitCount: number, showJson = true) {
  return makePerDayLimiter({
    identityName: "peruserperday",
    name,
    identityFn: async (c) => {
      const user = c.get("user");
      if (user) return user.loginname;
      const body = c.req.valid?.("json") || {};
      const token = body.accesstoken || c.req.query("accesstoken");
      if (!token) return "";
      const tokenUser = await userQueries.getByToken(token);
      if (tokenUser) {
        c.set("user", tokenUser);
        return tokenUser.loginname;
      }
      return "";
    },
    limitCount,
    showJson,
  });
}

export function perIpPerDay(name: string, limitCount: number, showJson = true) {
  return makePerDayLimiter({
    identityName: "peripperday",
    name,
    identityFn: (c) => {
      const realIP = c.req.header("x-real-ip") || c.req.header("cf-connecting-ip");
      if (!realIP && process.env.APP_ENV !== "development") {
        throw new Error("should provide x-real-ip header");
      }
      return realIP || "dev";
    },
    limitCount,
    showJson,
  });
}
