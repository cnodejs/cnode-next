import { expect, test } from "vite-plus/test";
import app from "../src/app";

test("GET /health returns shallow build metadata without sensitive leakage", async () => {
  const oldEnv = { ...process.env };
  process.env.CNODE_GIT_SHA = "abc123";
  process.env.CNODE_BUILD_TIME = "2026-07-28T00:00:00.000Z";
  process.env.POSTGRES_PASSWORD = "secret-postgres-password";
  process.env.AUTH_SESSION_SECRET = "super-secret-session";
  process.env.TURNSTILE_SECRET_KEY = "turnstile-secret-token";

  try {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")?.includes("application/json")).toBe(true);

    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(["buildTime", "commit", "ok", "service", "version"]);
    expect(body.ok).toBe(true);
    expect(body.service).toBe("cnode-api");
    expect(body.commit).toBe("abc123");
    expect(body.buildTime).toBe("2026-07-28T00:00:00.000Z");
    expect(typeof body.version).toBe("string");

    const serialized = JSON.stringify(body);
    expect(serialized).not.toMatch(/POSTGRES_PASSWORD|AUTH_SESSION_SECRET|TURNSTILE_SECRET_KEY/);
    expect(serialized).not.toMatch(
      /secret-postgres-password|super-secret-session|turnstile-secret-token/,
    );
    expect(serialized).not.toMatch(/postgres:\/\//);
    expect(serialized).not.toMatch(/stack/i);
  } finally {
    process.env = oldEnv;
  }
});
