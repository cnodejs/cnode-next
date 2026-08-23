import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import {
  consumeCspReportRateLimit,
  resetCspReportRateLimitsForTest,
  sanitizeCspReport,
} from "~/lib/csp-report";
import { action } from "~/routes/csp-report";

function reportRequest(body: string, contentType = "application/csp-report") {
  return new Request("https://cnodejs.org/__csp-report", {
    method: "POST",
    headers: {
      "Content-Type": contentType,
      "X-Real-IP": "192.0.2.1",
    },
    body,
  });
}

describe("CSP report resource route", () => {
  beforeEach(() => resetCspReportRateLimitsForTest());
  afterEach(() => vi.restoreAllMocks());

  it("accepts and logs a field-limited legacy report", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const response = await action({
      request: reportRequest(
        JSON.stringify({
          "csp-report": {
            "document-uri": "https://cnodejs.org/topic/1?token=secret#reply",
            "blocked-uri": "https://cdn.example.com/file.js?signature=secret#fragment",
            "source-file": "https://cnodejs.org/assets/root.js?build=secret",
            "effective-directive": "script-src-elem",
            "violated-directive": "script-src 'self'",
            "script-sample": "private page text",
          },
        }),
      ),
    });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    const event = JSON.parse(String(log.mock.calls[0]?.[0]));
    expect(event).toMatchObject({
      event: "csp_violation",
      effectiveDirective: "script-src-elem",
      documentPath: "/topic/1",
      blockedUrl: "https://cdn.example.com/file.js",
      sourceFile: "https://cnodejs.org/assets/root.js",
    });
    expect(JSON.stringify(event)).not.toContain("secret");
    expect(JSON.stringify(event)).not.toContain("private page text");
  });

  it("accepts Reporting API arrays", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const response = await action({
      request: reportRequest(
        JSON.stringify([
          {
            type: "csp-violation",
            body: {
              documentURL: "https://cnodejs.org/signup",
              blockedURL: "inline",
              effectiveDirective: "script-src-elem",
            },
          },
        ]),
        "application/reports+json; charset=utf-8",
      ),
    });
    expect(response.status).toBe(204);
    expect(JSON.parse(String(log.mock.calls[0]?.[0]))).toMatchObject({
      documentPath: "/signup",
      blockedUrl: "inline",
    });
  });

  it("drops cross-origin document paths", () => {
    const report = sanitizeCspReport(
      {
        "document-uri": "https://attacker.example/private?value=secret",
        "effective-directive": "img-src",
      },
      reportRequest("{}"),
    );
    expect(report?.documentPath).toBeUndefined();
    expect(JSON.stringify(report)).not.toContain("attacker.example");
    expect(JSON.stringify(report)).not.toContain("secret");
  });

  it("rejects unsupported, malformed, and oversized input without logging it", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => undefined);
    expect(
      (await action({ request: reportRequest("{}", "application/json") })).status,
    ).toBe(415);
    expect((await action({ request: reportRequest("not-json") })).status).toBe(400);
    expect(
      (
        await action({
          request: reportRequest(JSON.stringify({ value: "x".repeat(17 * 1024) })),
        })
      ).status,
    ).toBe(413);
    expect(log).not.toHaveBeenCalled();
  });

  it("bounds anonymous report rates", () => {
    const request = reportRequest("{}");
    expect(
      consumeCspReportRateLimit(request, { CNODE_CSP_REPORT_LIMIT_PER_MINUTE: "1" }, 1_000),
    ).toBe(true);
    expect(
      consumeCspReportRateLimit(request, { CNODE_CSP_REPORT_LIMIT_PER_MINUTE: "1" }, 1_001),
    ).toBe(false);
    expect(
      consumeCspReportRateLimit(request, { CNODE_CSP_REPORT_LIMIT_PER_MINUTE: "1" }, 61_001),
    ).toBe(true);
  });
});
