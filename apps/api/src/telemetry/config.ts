import packageJson from "../../package.json";

export type TelemetryRole = "api" | "moderation-worker";

export interface TelemetryConfig {
  enabled: boolean;
  endpoint?: string;
  sampleRatio: number;
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

function parseEnabled(value: string | undefined) {
  if (value === undefined || value === "" || value === "0" || value === "false") return false;
  if (value === "1" || value === "true") return true;
  throw new TelemetryConfigError("CNODE_OTEL_ENABLED", "must be a boolean");
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
    throw new TelemetryConfigError("CNODE_OTEL_EXPORTER_OTLP_ENDPOINT", "is required");
  }

  try {
    const endpoint = new URL(value);
    if (endpoint.protocol !== "http:" && endpoint.protocol !== "https:") throw new Error();
    if (endpoint.username || endpoint.password) throw new Error();
    return endpoint.toString();
  } catch {
    throw new TelemetryConfigError(
      "CNODE_OTEL_EXPORTER_OTLP_ENDPOINT",
      "must be an HTTP URL without credentials",
    );
  }
}

export function parseTelemetryConfig(
  role: TelemetryRole,
  env: NodeJS.ProcessEnv = process.env,
): TelemetryConfig {
  const enabled = parseEnabled(env.CNODE_OTEL_ENABLED);
  return {
    enabled,
    endpoint: enabled ? parseEndpoint(env.CNODE_OTEL_EXPORTER_OTLP_ENDPOINT) : undefined,
    sampleRatio: enabled ? parseSampleRatio(env.CNODE_OTEL_TRACE_SAMPLE_RATIO) : 0,
    serviceName: role === "api" ? "cnode-api" : "cnode-moderation-worker",
    serviceVersion: packageJson.version || "unknown",
    commitRevision: env.CNODE_GIT_SHA || env.GIT_SHA || env.COMMIT_SHA || "unknown",
    deploymentEnvironment: env.CNODE_ENV || env.NODE_ENV || "unknown",
  };
}
