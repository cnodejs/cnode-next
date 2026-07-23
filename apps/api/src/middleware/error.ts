import { createMiddleware } from "hono/factory";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export const errorHandler = () =>
  createMiddleware(async (c, next) => {
    try {
      await next();
    } catch (err) {
      console.error("[api error]", err);
      const message = err instanceof Error ? err.message : "Internal Server Error";
      return c.json({ success: false, error_msg: message }, 500 as ContentfulStatusCode);
    }
  });
