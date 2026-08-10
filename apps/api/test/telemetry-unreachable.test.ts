import { expect, test } from "vite-plus/test";
import { initializeTelemetry } from "../src/telemetry/index";

test(
  "does not couple health responses to an unreachable OTLP endpoint",
  async () => {
    const diagnostics: string[] = [];
    const runtime = await initializeTelemetry(
      "api",
      {
        CNODE_OTEL_ENABLED: "1",
        CNODE_OTEL_EXPORTER_OTLP_ENDPOINT: "http://127.0.0.1:1/v1/traces",
        CNODE_OTEL_TRACE_SAMPLE_RATIO: "1",
      },
      { diagnostic: (message) => diagnostics.push(message) },
    );
    const { default: app } = await import("../src/app");

    const response = await app.request("/health");
    expect(response.status).toBe(200);

    const started = Date.now();
    await runtime.shutdown();
    expect(Date.now() - started).toBeLessThan(3_500);
    expect(JSON.stringify(diagnostics)).not.toContain("127.0.0.1");
  },
  6_000,
);
