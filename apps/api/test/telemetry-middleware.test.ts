import { BasicTracerProvider, InMemorySpanExporter, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { describe, expect, test, vi } from "vite-plus/test";
import { Hono } from "hono";
import { errorHandler } from "../src/middleware/error";
import { telemetryMiddleware } from "../src/middleware/telemetry";

function createTestTracer() {
  const exporter = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  return { exporter, provider, tracer: provider.getTracer("test") };
}

describe("Hono telemetry middleware", () => {
  test("generates a server-owned request ID and names spans with route templates", async () => {
    const { exporter, provider, tracer } = createTestTracer();
    const app = new Hono();
    app.use("*", telemetryMiddleware(tracer));
    app.get("/items/:id", (c) => c.json({ requestId: c.get("requestId" as never) }));

    const response = await app.request("/items/42?token=not-exported", {
      headers: {
        "X-Request-ID": "caller-controlled",
        traceparent: "00-11111111111111111111111111111111-2222222222222222-01",
      },
    });
    await provider.forceFlush();

    const requestId = response.headers.get("X-Request-ID");
    expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(requestId).not.toBe("caller-controlled");

    const [span] = exporter.getFinishedSpans();
    expect(span.name).toBe("GET /items/:id");
    expect(span.attributes).toMatchObject({
      "cnode.request.id": requestId,
      "http.request.method": "GET",
      "http.route": "/items/:id",
      "http.response.status_code": 200,
    });
    expect(span.spanContext().traceId).not.toBe("11111111111111111111111111111111");
    expect(JSON.stringify(span.attributes)).not.toContain("not-exported");
    await provider.shutdown();
  });

  test("returns request IDs and error status for handled failures", async () => {
    const { exporter, provider, tracer } = createTestTracer();
    const app = new Hono();
    app.use("*", telemetryMiddleware(tracer));
    app.use("*", errorHandler());
    app.get("/failure", () => {
      throw new Error("private error detail");
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await app.request("/failure");
    await provider.forceFlush();

    expect(response.status).toBe(500);
    expect(response.headers.get("X-Request-ID")).toBeTruthy();
    const [span] = exporter.getFinishedSpans();
    expect(span.status.code).toBe(2);
    expect(JSON.stringify(span.attributes)).not.toContain("private error detail");
    expect(JSON.stringify(span.events)).not.toContain("private error detail");
    consoleError.mockRestore();
    await provider.shutdown();
  });
});
