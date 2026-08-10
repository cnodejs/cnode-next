import { context, trace } from "@opentelemetry/api";
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { describe, expect, test } from "vite-plus/test";
import {
  isBlockedTelemetryAttribute,
  SanitizingSpanProcessor,
} from "../src/telemetry/sanitize";

describe("telemetry span sanitization", () => {
  test.each([
    "http.request.header.authorization",
    "http.request.header.cookie",
    "session.token",
    "url.full",
    "url.query",
    "http.url",
    "request.body",
    "mail.body",
    "user.content",
    "moderation.content.preview",
    "db.statement",
    "db.query.text",
    "db.query.parameters",
    "db.connection_string",
    "db.user",
    "exception.message",
    "exception.stacktrace",
  ])("blocks %s", (key) => {
    expect(isBlockedTelemetryAttribute(key)).toBe(true);
  });

  test.each([
    "http.request.method",
    "http.route",
    "http.response.status_code",
    "db.system.name",
    "db.operation.name",
    "error.type",
    "cnode.request.id",
  ])("allows %s", (key) => {
    expect(isBlockedTelemetryAttribute(key)).toBe(false);
  });

  test("removes sensitive span, event, and link values before export", async () => {
    const exporter = new InMemorySpanExporter();
    const provider = new BasicTracerProvider({
      spanProcessors: [
        new SanitizingSpanProcessor(new SimpleSpanProcessor(exporter)),
      ],
    });
    const tracer = provider.getTracer("sanitize-test");
    const sensitive = "fixture-private-value";
    const linkedContext = trace.setSpanContext(context.active(), {
      traceId: "11111111111111111111111111111111",
      spanId: "2222222222222222",
      traceFlags: 1,
    });

    tracer.startSpan("safe-operation", {
      attributes: {
        "http.request.method": "POST",
        "http.request.header.authorization": sensitive,
        "request.body": sensitive,
        "db.statement": `select '${sensitive}'`,
        "db.query.parameters": sensitive,
        "url.full": `https://example.com/path?token=${sensitive}`,
      },
      links: [
        {
          context: trace.getSpanContext(linkedContext)!,
          attributes: { "session.token": sensitive },
        },
      ],
    }).addEvent("failure", {
      "exception.type": "Error",
      "exception.message": sensitive,
      "exception.stacktrace": sensitive,
    }).end();
    await provider.forceFlush();

    const finishedSpan = exporter.getFinishedSpans()[0]!;
    const serialized = JSON.stringify({
      attributes: finishedSpan.attributes,
      events: finishedSpan.events,
      links: finishedSpan.links,
    });
    expect(serialized).not.toContain(sensitive);
    expect(finishedSpan.attributes["http.request.method"]).toBe("POST");
    expect(finishedSpan.events[0]?.attributes?.["exception.type"]).toBe("Error");
    await provider.shutdown();
  });
});
