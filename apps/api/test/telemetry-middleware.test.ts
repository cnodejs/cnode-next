import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { describe, expect, test, vi } from "vite-plus/test";
import { Hono } from "hono";
import { errorHandler } from "../src/middleware/error";
import { telemetryMiddleware } from "../src/middleware/telemetry";
import type { AppLogAttributes } from "../src/telemetry/logger";

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
    const logs: Array<{ event: string; attributes: AppLogAttributes }> = [];
    const starts = vi.fn();
    const completions = vi.fn();
    const app = new Hono();
    app.use(
      "*",
      telemetryMiddleware(tracer, {
        log: (event, attributes) => logs.push({ event, attributes }),
        now: vi.fn().mockReturnValueOnce(100).mockReturnValueOnce(125),
        recordStart: starts,
        recordCompletion: completions,
      }),
    );
    app.get("/items/:id", (c) => c.json({ requestId: c.get("requestId" as never) }));

    const response = await app.request("/items/42?token=not-exported", {
      headers: {
        "X-Request-ID": "caller-controlled",
        traceparent: "00-11111111111111111111111111111111-2222222222222222-01",
      },
    });
    await provider.forceFlush();

    const requestId = response.headers.get("X-Request-ID");
    expect(requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
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
    expect(logs).toEqual([
      {
        event: "http.request.completed",
        attributes: expect.objectContaining({
          "cnode.request.id": requestId,
          "http.request.method": "GET",
          "http.route": "/items/:id",
          "http.response.status_code": 200,
          duration_ms: 25,
        }),
      },
    ]);
    expect(starts).toHaveBeenCalledWith("GET");
    expect(completions).toHaveBeenCalledWith(25, {
      method: "GET",
      route: "/items/:id",
      status: 200,
      errorType: undefined,
    });
    await provider.shutdown();
  });

  test("returns request IDs and error status for handled failures", async () => {
    const { exporter, provider, tracer } = createTestTracer();
    const logs: Array<{ event: string; attributes: AppLogAttributes }> = [];
    const errors: Array<{ event: string; attributes: AppLogAttributes }> = [];
    const app = new Hono();
    app.use(
      "*",
      telemetryMiddleware(tracer, {
        log: (event, attributes) => logs.push({ event, attributes }),
        recordStart: vi.fn(),
        recordCompletion: vi.fn(),
      }),
    );
    app.onError(
      errorHandler((event, attributes) => errors.push({ event, attributes: attributes ?? {} })),
    );
    app.get("/failure", () => {
      throw new Error("private error detail");
    });
    const response = await app.request("/failure");
    await provider.forceFlush();

    expect(response.status).toBe(500);
    expect(response.headers.get("X-Request-ID")).toBeTruthy();
    const [span] = exporter.getFinishedSpans();
    expect(span.status.code).toBe(2);
    expect(JSON.stringify(span.attributes)).not.toContain("private error detail");
    expect(JSON.stringify(span.events)).not.toContain("private error detail");
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      event: "http.request.completed",
      attributes: { "http.response.status_code": 500 },
    });
    expect(errors).toEqual([
      {
        event: "http.request.error",
        attributes: expect.objectContaining({ "error.type": "Error" }),
      },
    ]);
    await provider.shutdown();
  });

  test.each([
    ["/health", 200, "/health"],
    ["/missing?token=private", 404, "unmatched"],
  ] as const)("logs one safe completion for %s", async (path, status, route) => {
    const { provider, tracer } = createTestTracer();
    const logs: Array<{ event: string; attributes: AppLogAttributes }> = [];
    const app = new Hono();
    app.use(
      "*",
      telemetryMiddleware(tracer, {
        log: (event, attributes) => logs.push({ event, attributes }),
        recordStart: vi.fn(),
        recordCompletion: vi.fn(),
      }),
    );
    app.get("/health", (c) => c.json({ ok: true }));

    const response = await app.request(path);
    expect(response.status).toBe(status);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      event: "http.request.completed",
      attributes: { "http.route": route, "http.response.status_code": status },
    });
    expect(JSON.stringify(logs)).not.toContain("private");
    await provider.shutdown();
  });
});
