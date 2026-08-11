import type { SpanExporter } from "@opentelemetry/sdk-trace-base";
import { expect, test, vi } from "vite-plus/test";
import { initializeTelemetry } from "../src/telemetry/index";

test("keeps API responses available and shutdown bounded when export fails", async () => {
  const exportSpan = vi.fn<SpanExporter["export"]>((_spans, callback) => {
    callback({ code: 1, error: new Error("collector unavailable") });
  });
  const exporter: SpanExporter = {
    export: exportSpan,
    shutdown: () => new Promise<void>(() => undefined),
  };
  const diagnostics: string[] = [];
  const runtime = await initializeTelemetry(
    "api",
    {
      CNODE_OTEL_ENABLED: "1",
      CNODE_OTEL_EXPORTER_OTLP_BASE_ENDPOINT: "http://127.0.0.1:1",
      CNODE_OTEL_LOGS_ENABLED: "0",
      CNODE_OTEL_METRICS_ENABLED: "0",
      CNODE_OTEL_TRACE_SAMPLE_RATIO: "1",
    },
    { exporter, diagnostic: (message) => diagnostics.push(message) },
  );
  const { default: app } = await import("../src/app");

  const response = await app.request("/health");
  expect(response.status).toBe(200);
  expect(response.headers.get("X-Request-ID")).toBeTruthy();

  const shutdownStarted = Date.now();
  await runtime.shutdown();
  expect(Date.now() - shutdownStarted).toBeLessThan(3_500);
  expect(exportSpan).toHaveBeenCalled();
  expect(JSON.stringify(diagnostics)).not.toContain("127.0.0.1");
}, 6_000);
