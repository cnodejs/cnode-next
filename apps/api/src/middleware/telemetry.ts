import { randomUUID } from "node:crypto";
import { SpanKind, SpanStatusCode, trace, type Tracer } from "@opentelemetry/api";
import { createMiddleware } from "hono/factory";

export interface TelemetryVariables {
  requestId: string;
}

const allowedErrorTypes = new Set(["Error", "HTTPException"]);

function routeName(method: string, routePath: string) {
  return `${method.toUpperCase()} ${routePath || "unmatched"}`;
}

export function telemetryMiddleware(tracer: Tracer = trace.getTracer("cnode-api-hono")) {
  return createMiddleware<{ Variables: TelemetryVariables }>(async (c, next) => {
    const requestId = randomUUID();
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
        try {
          await next();
          const status = c.res.status;
          span.setAttribute("http.response.status_code", status);
          if (status >= 500) span.setStatus({ code: SpanStatusCode.ERROR });
        } catch (error) {
          span.setStatus({ code: SpanStatusCode.ERROR });
          const errorType = error instanceof Error ? error.name : "unknown";
          if (allowedErrorTypes.has(errorType)) span.setAttribute("error.type", errorType);
          throw error;
        } finally {
          const route = c.req.routePath || "unmatched";
          span.updateName(routeName(c.req.method, route));
          span.setAttribute("http.route", route);
          span.end();
        }
      },
    );
  });
}
