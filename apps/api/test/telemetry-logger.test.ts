import { context, trace, TraceFlags } from "@opentelemetry/api";
import { SeverityNumber, type Logger } from "@opentelemetry/api-logs";
import { describe, expect, test, vi } from "vite-plus/test";
import { appLog, configureApplicationLogger, errorType } from "../src/telemetry/logger";

describe("application telemetry logger", () => {
  test("writes structured stdout and emits a correlated OTel log", () => {
    configureApplicationLogger("cnode-api");
    const emit = vi.fn();
    const logger = { enabled: () => true, emit } as unknown as Logger;
    const lines: string[] = [];
    const active = trace.setSpanContext(context.active(), {
      traceId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      spanId: "bbbbbbbbbbbbbbbb",
      traceFlags: TraceFlags.SAMPLED,
    });

    const getSpanContext = vi.spyOn(trace, "getSpanContext").mockReturnValue({
      traceId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      spanId: "bbbbbbbbbbbbbbbb",
      traceFlags: TraceFlags.SAMPLED,
    });
    context.with(active, () =>
      appLog(
        "http.request.completed",
        "INFO",
        { "http.route": "/items/:id", duration_ms: 12 },
        { logger, write: (line) => lines.push(line) },
      ),
    );
    getSpanContext.mockRestore();

    expect(JSON.parse(lines[0] || "{}")).toMatchObject({
      severity: "INFO",
      event_name: "http.request.completed",
      service_name: "cnode-api",
      "http.route": "/items/:id",
      duration_ms: 12,
      trace_id: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      span_id: "bbbbbbbbbbbbbbbb",
      trace_sampled: true,
    });
    expect(emit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: "http.request.completed",
        severityNumber: SeverityNumber.INFO,
        attributes: { "http.route": "/items/:id", duration_ms: 12 },
      }),
    );
  });

  test("keeps stdout when OTel logs are disabled and rejects unknown fields", () => {
    const emit = vi.fn();
    const logger = { enabled: () => false, emit } as unknown as Logger;
    const lines: string[] = [];
    appLog(
      "mail.send.failed",
      "ERROR",
      {
        attempt: 5,
        "error.type": "Error",
        ...({ recipient: "private@example.com", subject: "private" } as object),
      },
      { logger, write: (line) => lines.push(line) },
    );
    const output = lines[0] || "";
    expect(output).toContain("mail.send.failed");
    expect(output).not.toContain("private@example.com");
    expect(output).not.toContain("subject");
    expect(emit).not.toHaveBeenCalled();
  });

  test("uses an error type allowlist", () => {
    expect(errorType(new TypeError("private"))).toBe("TypeError");
    const custom = new Error("private");
    custom.name = "PrivateDatabaseError";
    expect(errorType(custom)).toBe("unknown");
  });
});
