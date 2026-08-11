import { describe, expect, test } from "vite-plus/test";
import { TelemetryConfigError, parseTelemetryConfig } from "../src/telemetry/config";

const baseEndpoint = "http://otel-collector:4318";

describe("telemetry config", () => {
  test("is disabled by default without requiring exporter config", () => {
    expect(parseTelemetryConfig("api", {} as NodeJS.ProcessEnv)).toMatchObject({
      enabled: false,
      tracesEnabled: false,
      logsEnabled: false,
      metricsEnabled: false,
      sampleRatio: 0,
      serviceName: "cnode-api",
    });
  });

  test.each([
    ["0", 0],
    ["0.25", 0.25],
    ["1", 1],
  ])("accepts sample ratio %s", (value, expected) => {
    expect(
      parseTelemetryConfig("moderation-worker", {
        CNODE_OTEL_ENABLED: "1",
        CNODE_OTEL_EXPORTER_OTLP_BASE_ENDPOINT: baseEndpoint,
        CNODE_OTEL_TRACE_SAMPLE_RATIO: value,
      }).sampleRatio,
    ).toBe(expected);
  });

  test.each(["NaN", "Infinity", "-0.1", "1.1"])(
    "disables only traces for unsafe ratio %s",
    (value) => {
      const config = parseTelemetryConfig("api", {
        CNODE_OTEL_ENABLED: "true",
        CNODE_OTEL_EXPORTER_OTLP_BASE_ENDPOINT: baseEndpoint,
        CNODE_OTEL_TRACE_SAMPLE_RATIO: value,
      });
      expect(config.tracesEnabled).toBe(false);
      expect(config.logsEnabled).toBe(true);
      expect(config.metricsEnabled).toBe(true);
      expect(config.signalErrors.traces).toContain("CNODE_OTEL_TRACE_SAMPLE_RATIO");
    },
  );

  test("isolates invalid signal toggles", () => {
    const config = parseTelemetryConfig("api", {
      CNODE_OTEL_ENABLED: "1",
      CNODE_OTEL_EXPORTER_OTLP_BASE_ENDPOINT: baseEndpoint,
      CNODE_OTEL_LOGS_ENABLED: "sometimes",
    });
    expect(config).toMatchObject({
      tracesEnabled: true,
      logsEnabled: false,
      metricsEnabled: true,
    });
    expect(config.signalErrors.logs).toContain("CNODE_OTEL_LOGS_ENABLED");
  });

  test("supports independent signal disabling", () => {
    expect(
      parseTelemetryConfig("api", {
        CNODE_OTEL_ENABLED: "1",
        CNODE_OTEL_EXPORTER_OTLP_BASE_ENDPOINT: baseEndpoint,
        CNODE_OTEL_LOGS_ENABLED: "0",
        CNODE_OTEL_METRICS_ENABLED: "false",
      }),
    ).toMatchObject({ tracesEnabled: true, logsEnabled: false, metricsEnabled: false });
  });

  test("requires a base endpoint without exposing other config values", () => {
    expect(() =>
      parseTelemetryConfig("api", {
        CNODE_OTEL_ENABLED: "1",
        CNODE_GIT_SHA: "sensitive-value",
      }),
    ).toThrow("CNODE_OTEL_EXPORTER_OTLP_BASE_ENDPOINT is required");
  });

  test("rejects invalid master toggles", () => {
    expect(() => parseTelemetryConfig("api", { CNODE_OTEL_ENABLED: "yes" })).toThrow(
      TelemetryConfigError,
    );
  });

  test("uses stable role and deployment resource values", () => {
    expect(
      parseTelemetryConfig("moderation-worker", {
        CNODE_OTEL_ENABLED: "1",
        CNODE_OTEL_EXPORTER_OTLP_BASE_ENDPOINT: baseEndpoint,
        CNODE_ENV: "staging",
        CNODE_GIT_SHA: "abc123",
      }),
    ).toMatchObject({
      baseEndpoint,
      serviceName: "cnode-moderation-worker",
      deploymentEnvironment: "staging",
      commitRevision: "abc123",
    });
  });
});
