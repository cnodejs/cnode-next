import assert from "node:assert/strict";
import { test } from "node:test";
import app from "../src/app";

test("GET /health returns shallow build metadata without sensitive leakage", async () => {
  const oldEnv = { ...process.env };
  process.env.APP_GIT_SHA = "abc123";
  process.env.APP_BUILD_TIME = "2026-07-28T00:00:00.000Z";
  process.env.DATABASE_URL = "postgres://user:secret-password@example.com/cnode";
  process.env.AUTH_SESSION_SECRET = "super-secret-session";
  process.env.TURNSTILE_SECRET_KEY = "turnstile-secret-token";

  try {
    const res = await app.request("/health");
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type")?.includes("application/json"), true);

    const body = await res.json();
    assert.deepEqual(Object.keys(body).sort(), ["buildTime", "commit", "ok", "service", "version"]);
    assert.equal(body.ok, true);
    assert.equal(body.service, "cnode-api");
    assert.equal(body.commit, "abc123");
    assert.equal(body.buildTime, "2026-07-28T00:00:00.000Z");
    assert.equal(typeof body.version, "string");

    const serialized = JSON.stringify(body);
    assert.doesNotMatch(serialized, /DATABASE_URL|AUTH_SESSION_SECRET|TURNSTILE_SECRET_KEY/);
    assert.doesNotMatch(serialized, /secret-password|super-secret-session|turnstile-secret-token/);
    assert.doesNotMatch(serialized, /postgres:\/\//);
    assert.doesNotMatch(serialized, /stack/i);
  } finally {
    process.env = oldEnv;
  }
});
