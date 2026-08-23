import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  applyDocumentSecurityHeaders,
  buildContentSecurityPolicy,
  createCspNonce,
  resolveWebSecurityConfig,
} from "~/lib/security-headers";

describe("Web document security headers", () => {
  it("defaults production to report-only CSP and short HTTPS HSTS", () => {
    const headers = new Headers({ "X-Route-Header": "preserved" });
    const request = new Request("https://cnodejs.org/topic/1");
    applyDocumentSecurityHeaders(headers, request, "test-nonce", {
      CNODE_ENV: "production",
      CNODE_API_BASE_URL: "https://api.cnodejs.org/path",
    });

    expect(headers.get("X-Route-Header")).toBe("preserved");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
    expect(headers.get("Strict-Transport-Security")).toBe("max-age=300");
    expect(headers.get("Content-Security-Policy")).toBeNull();
    expect(headers.get("Content-Security-Policy-Report-Only")).toContain(
      "script-src 'self' 'nonce-test-nonce' https://challenges.cloudflare.com",
    );
  });

  it("uses the same policy in enforce mode without unsafe inline scripts", () => {
    const headers = new Headers();
    applyDocumentSecurityHeaders(headers, new Request("https://cnodejs.org/"), "nonce", {
      CNODE_ENV: "production",
      CNODE_WEB_CSP_MODE: "enforce",
    });

    const policy = headers.get("Content-Security-Policy") || "";
    const scriptDirective = policy.split("; ").find((value) => value.startsWith("script-src "));
    expect(scriptDirective).toBe("script-src 'self' 'nonce-nonce' https://challenges.cloudflare.com");
    expect(scriptDirective).not.toContain("'unsafe-inline'");
    expect(headers.get("Content-Security-Policy-Report-Only")).toBeNull();
  });

  it("keeps local HTTP development free of production CSP and HSTS", () => {
    const headers = new Headers();
    applyDocumentSecurityHeaders(headers, new Request("http://localhost:5173/"), "nonce", {
      CNODE_ENV: "development",
    });

    expect(headers.get("Content-Security-Policy")).toBeNull();
    expect(headers.get("Content-Security-Policy-Report-Only")).toBeNull();
    expect(headers.get("Strict-Transport-Security")).toBeNull();
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("recognizes forwarded HTTPS and supports runtime HSTS rollback", () => {
    const request = new Request("http://web:3000/", {
      headers: { "X-Forwarded-Proto": "https, http" },
    });
    const enabled = new Headers();
    applyDocumentSecurityHeaders(enabled, request, "nonce", {
      CNODE_ENV: "production",
      CNODE_WEB_HSTS_MAX_AGE: "900",
    });
    expect(enabled.get("Strict-Transport-Security")).toBe("max-age=900");

    const disabled = new Headers();
    applyDocumentSecurityHeaders(disabled, request, "nonce", {
      CNODE_ENV: "production",
      CNODE_WEB_HSTS_MAX_AGE: "0",
    });
    expect(disabled.get("Strict-Transport-Security")).toBeNull();
  });

  it("falls back safely for invalid runtime configuration", () => {
    expect(
      resolveWebSecurityConfig({
        CNODE_ENV: "production",
        CNODE_WEB_CSP_MODE: "broken",
        CNODE_WEB_HSTS_MAX_AGE: "forever",
      }),
    ).toEqual({
      cspMode: "report-only",
      hstsMaxAge: 300,
      isProduction: true,
      warnings: [
        "CNODE_WEB_CSP_MODE is invalid; using the environment default",
        "CNODE_WEB_HSTS_MAX_AGE is invalid; using the environment default",
      ],
    });
  });

  it("allows required API, Turnstile, and existing HTTPS user images", () => {
    const policy = buildContentSecurityPolicy("nonce", {
      CNODE_API_BASE_URL: "https://api.example.com/v1",
    });
    expect(policy).toContain("connect-src 'self' https://challenges.cloudflare.com https://api.example.com");
    expect(policy).toContain("frame-src https://challenges.cloudflare.com");
    expect(policy).toContain("img-src 'self' data: blob: https:");
    expect(policy).toContain("report-uri /__csp-report");
  });

  it("generates an independent nonce for each document response", () => {
    const first = createCspNonce();
    const second = createCspNonce();
    expect(first).toMatch(/^[A-Za-z0-9_-]{24}$/);
    expect(second).not.toBe(first);
  });

  it("passes the ServerRouter nonce to framework and application scripts", () => {
    const root = resolve(import.meta.dirname, "../app/root.tsx");
    const entry = resolve(import.meta.dirname, "../app/entry.server.tsx");
    const rootSource = readFileSync(root, "utf8");
    const entrySource = readFileSync(entry, "utf8");

    expect(entrySource).toContain("<ServerRouter context={routerContext} url={request.url} nonce={nonce} />");
    expect(entrySource).toMatch(/renderToPipeableStream\([\s\S]*\{\s*nonce,/);
    expect(rootSource).toContain("<ScrollRestoration nonce={nonce} />");
    expect(rootSource).toContain("<Scripts nonce={nonce} />");
    expect(rootSource.match(/<script\s+nonce=\{nonce\}/g)).toHaveLength(2);
  });
});
