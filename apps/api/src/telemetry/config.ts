import packageJson from "../../package.json";

export type TelemetryRole = "api" | "moderation-worker";

export interface TelemetryConfig {
  enabled: boolean;
  baseEndpoint?: string;
  tracesEnabled: boolean;
  logsEnabled: boolean;
  metricsEnabled: boolean;
  sampleRatio: number;
  signalErrors: Partial<Record<"traces" | "logs" | "metrics", string>>;
  serviceName: "cnode-api" | "cnode-moderation-worker";
  serviceVersion: string;
  commitRevision: string;
  deploymentEnvironment: string;
}

export class TelemetryConfigError extends Error {
  constructor(variable: string, expectation: string) {
    super(`${variable} ${expectation}`);
    this.name = "TelemetryConfigError";
  }
}

function parseEnabled(variable: string, value: string | undefined, defaultValue = false) {
  if (value === undefined || value === "") return defaultValue;
  if (value === "0" || value === "false") return false;
  if (value === "1" || value === "true") return true;
  throw new TelemetryConfigError(variable, "must be a boolean");
}

function parseSampleRatio(value: string | undefined) {
  if (value === undefined || value === "") return 0.1;
  const ratio = Number(value);
  if (!Number.isFinite(ratio) || ratio < 0 || ratio > 1) {
    throw new TelemetryConfigError(
      "CNODE_OTEL_TRACE_SAMPLE_RATIO",
      "must be a finite number between 0 and 1",
    );
  }
  return ratio;
}

function parseEndpoint(value: string | undefined) {
  if (!value) {
    throw new TelemetryConfigError("CNODE_OTEL_EXPORTER_OTLP_BASE_ENDPOINT", "is required");
  }

  try {
    const endpoint = new URL(value);
    if (endpoint.protocol !== "http:" && endpoint.protocol !== "https:") throw new Error();
    if (endpoint.username || endpoint.password) throw new Error();
    endpoint.pathname = endpoint.pathname.replace(/\/$/, "");
    endpoint.search = "";
    endpoint.hash = "";
    return endpoint.toString().replace(/\/$/, "");
  } catch {
    throw new TelemetryConfigError(
      "CNODE_OTEL_EXPORTER_OTLP_BASE_ENDPOINT",
      "must be an HTTP URL without credentials",
    );
  }
}

export function parseTelemetryConfig(
  role: TelemetryRole,
  env: NodeJS.ProcessEnv = process.env,
): TelemetryConfig {
  const enabled = parseEnabled("CNODE_OTEL_ENABLED", env.CNODE_OTEL_ENABLED);
  const signalErrors: TelemetryConfig["signalErrors"] = {};
  const parseSignal = (
    signal: keyof TelemetryConfig["signalErrors"],
    variable: string,
    value: string | undefined,
  ) => {
    if (!enabled) return false;
    try {
      return parseEnabled(variable, value, true);
    } catch (error) {
      signalErrors[signal] = error instanceof Error ? error.message : `${variable} is invalid`;
      return false;
    }
  };

  let tracesEnabled = parseSignal(
    "traces",
    "CNODE_OTEL_TRACES_ENABLED",
    env.CNODE_OTEL_TRACES_ENABLED,
  );
  const logsEnabled = parseSignal("logs", "CNODE_OTEL_LOGS_ENABLED", env.CNODE_OTEL_LOGS_ENABLED);
  const metricsEnabled = parseSignal(
    "metrics",
    "CNODE_OTEL_METRICS_ENABLED",
    env.CNODE_OTEL_METRICS_ENABLED,
  );
  let sampleRatio = 0;
  if (tracesEnabled) {
    try {
      sampleRatio = parseSampleRatio(env.CNODE_OTEL_TRACE_SAMPLE_RATIO);
    } catch (error) {
      signalErrors.traces = error instanceof Error ? error.message : "trace sampling is invalid";
      tracesEnabled = false;
    }
  }
  const anySignalEnabled = tracesEnabled || logsEnabled || metricsEnabled;

  return {
    enabled,
    baseEndpoint:
      enabled && anySignalEnabled
        ? parseEndpoint(env.CNODE_OTEL_EXPORTER_OTLP_BASE_ENDPOINT)
        : undefined,
    tracesEnabled,
    logsEnabled,
    metricsEnabled,
    sampleRatio,
    signalErrors,
    serviceName: role === "api" ? "cnode-api" : "cnode-moderation-worker",
    serviceVersion: packageJson.version || "unknown",
    commitRevision: env.CNODE_GIT_SHA || env.GIT_SHA || env.COMMIT_SHA || "unknown",
    deploymentEnvironment: env.CNODE_ENV || env.NODE_ENV || "unknown",
  };
}
