import { describe, expect, test } from "vite-plus/test";
import { TelemetryConfigError, parseTelemetryConfig } from "../src/telemetry/config";

const endpoint = "http://otel-collector:4318/v1/traces";

describe("telemetry config", () => {
  test("is disabled by default without requiring exporter config", () => {
    expect(parseTelemetryConfig("api", {} as NodeJS.ProcessEnv)).toMatchObject({
      enabled: false,
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
        CNODE_OTEL_EXPORTER_OTLP_ENDPOINT: endpoint,
        CNODE_OTEL_TRACE_SAMPLE_RATIO: value,
      }).sampleRatio,
    ).toBe(expected);
  });

  test.each(["NaN", "Infinity", "-0.1", "1.1"])("rejects unsafe ratio %s", (value) => {
    expect(() =>
      parseTelemetryConfig("api", {
        CNODE_OTEL_ENABLED: "true",
        CNODE_OTEL_EXPORTER_OTLP_ENDPOINT: endpoint,
        CNODE_OTEL_TRACE_SAMPLE_RATIO: value,
      }),
    ).toThrow(TelemetryConfigError);
  });

  test("requires an endpoint without exposing other config values", () => {
    expect(() =>
      parseTelemetryConfig("api", {
        CNODE_OTEL_ENABLED: "1",
        CNODE_GIT_SHA: "sensitive-value",
      }),
    ).toThrow("CNODE_OTEL_EXPORTER_OTLP_ENDPOINT is required");
  });

  test("uses stable role and deployment resource values", () => {
    expect(
      parseTelemetryConfig("moderation-worker", {
        CNODE_OTEL_ENABLED: "1",
        CNODE_OTEL_EXPORTER_OTLP_ENDPOINT: endpoint,
        CNODE_ENV: "staging",
        CNODE_GIT_SHA: "abc123",
      }),
    ).toMatchObject({
      serviceName: "cnode-moderation-worker",
      deploymentEnvironment: "staging",
      commitRevision: "abc123",
    });
  });
});
