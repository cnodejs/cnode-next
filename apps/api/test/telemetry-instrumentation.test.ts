import { trace } from "@opentelemetry/api";
import type { ReadableSpan, SpanExporter } from "@opentelemetry/sdk-trace-base";
import { expect, test } from "vite-plus/test";
import { initializeTelemetry } from "../src/telemetry/index";

test(
  "associates Undici and PostgreSQL spans with the active local trace",
  async () => {
    const spans: ReadableSpan[] = [];
    const exporter: SpanExporter = {
      export(batch, callback) {
        spans.push(...batch);
        callback({ code: 0 });
      },
      shutdown: async () => undefined,
    };
    const runtime = await initializeTelemetry(
      "api",
      {
        CNODE_OTEL_ENABLED: "1",
        CNODE_OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector:4318/v1/traces",
        CNODE_OTEL_TRACE_SAMPLE_RATIO: "1",
        CNODE_ENV: "test",
      },
      { exporter },
    );
    const { createServer } = await import("node:http");
    const server = createServer((_request, response) => response.end("ok"));
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("test server did not bind");

    const sensitive = "fixture-private-query-value";
    let parentTraceId = "";
    try {
      await trace.getTracer("integration-test").startActiveSpan("integration-parent", async (span) => {
        parentTraceId = span.spanContext().traceId;
        const { request } = await import("undici");
        const response = await request(
          `http://127.0.0.1:${address.port}/dependency?token=${sensitive}`,
        );
        await response.body.text();

        const [{ createDb }, { sql }] = await Promise.all([
          import("@cnode/db"),
          import("drizzle-orm"),
        ]);
        const db = createDb({
          POSTGRES_HOST: "127.0.0.1",
          POSTGRES_PORT: "1",
          POSTGRES_DB: "cnode_test",
          POSTGRES_USER: "cnode_test",
          POSTGRES_PASSWORD: sensitive,
        });
        try {
          await db.execute(sql.raw(`select '${sensitive}'`));
        } catch {
          // The unreachable local port exercises instrumentation without a database dependency.
        } finally {
          await db.$client.end();
        }
        span.end();
      });
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await runtime.shutdown();
    }

    const postgresSpan = spans.find((span) => span.name.startsWith("pg."));
    const clientSpans = spans.filter(
      (span) =>
        span.name !== "integration-parent" &&
        span.spanContext().traceId === parentTraceId &&
        !span.name.startsWith("pg."),
    );
    expect(postgresSpan?.spanContext().traceId).toBe(parentTraceId);
    expect(clientSpans.length).toBeGreaterThan(0);

    const exportedData = JSON.stringify(
      spans.map((span) => ({ name: span.name, attributes: span.attributes, events: span.events })),
    );
    expect(exportedData).not.toContain(sensitive);
    expect(exportedData).not.toContain("db.statement");
  },
  15_000,
);
