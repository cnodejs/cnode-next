import { randomUUID } from "node:crypto";
import { SpanKind, SpanStatusCode, trace, type Tracer } from "@opentelemetry/api";
import { createMiddleware } from "hono/factory";
import { appLog, errorType, type AppLogAttributes } from "../telemetry/logger";
import { recordHttpCompletion, recordHttpStart } from "../telemetry/metrics";

export interface TelemetryVariables {
  requestId: string;
}

function routeName(method: string, routePath: string) {
  return `${method.toUpperCase()} ${routePath || "unmatched"}`;
}

interface TelemetryMiddlewareDependencies {
  log?: (eventName: string, attributes: AppLogAttributes) => void;
  now?: () => number;
  recordStart?: (method: string) => void;
  recordCompletion?: typeof recordHttpCompletion;
}

export function telemetryMiddleware(
  tracer: Tracer = trace.getTracer("cnode-api-hono"),
  dependencies: TelemetryMiddlewareDependencies = {},
) {
  return createMiddleware<{ Variables: TelemetryVariables }>(async (c, next) => {
    const requestId = randomUUID();
    const now = dependencies.now ?? Date.now;
    const startedAt = now();
    const method = c.req.method.toUpperCase();
    (dependencies.recordStart ?? recordHttpStart)(method);
    c.set("requestId", requestId);
    c.header("X-Request-ID", requestId);

    return tracer.startActiveSpan(
      "HTTP request",
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          "cnode.request.id": requestId,
          "http.request.method": c.req.method,
        },
      },
      async (span) => {
        let caughtErrorType: string | undefined;
        try {
          await next();
          const status = c.res.status;
          span.setAttribute("http.response.status_code", status);
          if (status >= 500) span.setStatus({ code: SpanStatusCode.ERROR });
        } catch (error) {
          span.setStatus({ code: SpanStatusCode.ERROR });
          const type = errorType(error);
          caughtErrorType = type;
          if (type !== "unknown") span.setAttribute("error.type", type);
          throw error;
        } finally {
          const route =
            !c.req.routePath || c.req.routePath === "/*" ? "unmatched" : c.req.routePath;
          const status = caughtErrorType ? 500 : c.res.status;
          const durationMs = Math.max(0, now() - startedAt);
          span.updateName(routeName(method, route));
          span.setAttribute("http.route", route);
          span.setAttribute("http.response.status_code", status);
          (dependencies.recordCompletion ?? recordHttpCompletion)(durationMs, {
            method,
            route,
            status,
            errorType: caughtErrorType,
          });
          const attributes: AppLogAttributes = {
            "cnode.request.id": requestId,
            "http.request.method": method,
            "http.route": route,
            "http.response.status_code": status,
            duration_ms: durationMs,
          };
          if (dependencies.log) dependencies.log("http.request.completed", attributes);
          else appLog("http.request.completed", "INFO", attributes);
          span.end();
        }
      },
    );
  });
}
