import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ErrorHandler } from "hono";
import { appLog, errorType } from "../telemetry/logger";

export const errorHandler = (
  log = (eventName: string, attributes: Parameters<typeof appLog>[2]) =>
    appLog(eventName, "ERROR", attributes),
) =>
  ((err, c) => {
    log("http.request.error", {
      "cnode.request.id": c.get("requestId"),
      "error.type": errorType(err),
    });
    return c.json(
      { success: false, error_msg: err.message || "Internal Server Error" },
      500 as ContentfulStatusCode,
    );
  }) satisfies ErrorHandler;
