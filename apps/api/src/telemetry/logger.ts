import { context, trace, TraceFlags } from "@opentelemetry/api";
import { logs, SeverityNumber, type Logger } from "@opentelemetry/api-logs";

export type LogSeverity = "INFO" | "WARN" | "ERROR";

export interface AppLogAttributes {
  "cnode.request.id"?: string;
  "error.type"?: string;
  "http.request.method"?: string;
  "http.response.status_code"?: number;
  "http.route"?: string;
  "moderation.scan.jobs_processed"?: number;
  "moderation.scan.outcome"?: "completed" | "failed" | "lock_unavailable";
  "server.port"?: number;
  "telemetry.detail"?: string;
  "telemetry.signal"?: "traces" | "logs" | "metrics" | "all";
  "worker.interval_ms"?: number;
  attempt?: number;
  duration_ms?: number;
  outcome?: "sent" | "failed" | "skipped";
}

interface LogDependencies {
  logger?: Logger;
  write?: (line: string) => void;
}

const severityNumbers: Record<LogSeverity, SeverityNumber> = {
  INFO: SeverityNumber.INFO,
  WARN: SeverityNumber.WARN,
  ERROR: SeverityNumber.ERROR,
};
const allowedAttributeKeys = new Set<keyof AppLogAttributes>([
  "cnode.request.id",
  "error.type",
  "http.request.method",
  "http.response.status_code",
  "http.route",
  "moderation.scan.jobs_processed",
  "moderation.scan.outcome",
  "server.port",
  "telemetry.detail",
  "telemetry.signal",
  "worker.interval_ms",
  "attempt",
  "duration_ms",
  "outcome",
]);

let serviceName = "cnode-api";
const allowedErrorTypes = new Set(["Error", "HTTPException", "TypeError"]);

export function errorType(error: unknown) {
  const name = error instanceof Error ? error.name : "unknown";
  return allowedErrorTypes.has(name) ? name : "unknown";
}

export function configureApplicationLogger(name: string) {
  serviceName = name;
}

export function appLog(
  eventName: string,
  severity: LogSeverity,
  attributes: AppLogAttributes = {},
  dependencies: LogDependencies = {},
) {
  const safeAttributes = Object.fromEntries(
    Object.entries(attributes).filter(
      ([key, value]) =>
        allowedAttributeKeys.has(key as keyof AppLogAttributes) &&
        (typeof value === "string" || typeof value === "number" || typeof value === "boolean"),
    ),
  ) as AppLogAttributes;
  const activeContext = context.active();
  const spanContext = trace.getSpanContext(activeContext);
  const correlation =
    spanContext?.traceId && spanContext.spanId
      ? {
          trace_id: spanContext.traceId,
          span_id: spanContext.spanId,
          trace_sampled: (spanContext.traceFlags & TraceFlags.SAMPLED) === TraceFlags.SAMPLED,
        }
      : {};
  const record = {
    timestamp: new Date().toISOString(),
    severity,
    event_name: eventName,
    service_name: serviceName,
    ...safeAttributes,
    ...correlation,
  };

  (dependencies.write ?? ((line) => process.stdout.write(`${line}\n`)))(JSON.stringify(record));
  const logger = dependencies.logger ?? logs.getLogger("cnode-application");
  if (
    logger.enabled({ context: activeContext, severityNumber: severityNumbers[severity], eventName })
  ) {
    logger.emit({
      context: activeContext,
      eventName,
      severityNumber: severityNumbers[severity],
      severityText: severity,
      body: eventName,
      attributes: safeAttributes as Record<string, string | number | boolean>,
    });
  }
}
