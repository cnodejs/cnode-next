import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vite-plus/test";

const root = resolve(import.meta.dirname, "../../..");
const compose = readFileSync(resolve(root, "docs/deployment/docker-compose.yml"), "utf8");
const collector = readFileSync(resolve(root, "docs/deployment/otel-collector.yaml"), "utf8");
const productionEnv = readFileSync(
  resolve(root, "docs/deployment/env.production.example"),
  "utf8",
);

describe("telemetry deployment configuration", () => {
  test("pins an internal-only Collector using the shared deployment env file", () => {
    const service = compose.split("\n  otel-collector:")[1]?.split("\n  postgres:")[0] || "";
    expect(service).toContain("otel/opentelemetry-collector-contrib:0.135.0");
    expect(service).toContain("CNODE_ENV_FILE");
    expect(compose).toContain("CNODE_ENV_FILE:-.env");
    expect(compose).not.toContain("CNODE_ENV_FILE:-../../.env");
    expect(service).toContain("cnode-internal");
    expect(service).not.toMatch(/^\s+ports:/m);
    expect(productionEnv).toContain("OPENOBSERVE_AUTH_TOKEN=");
    expect(productionEnv).toContain("ZO_ROOT_USER_PASSWORD=");
  });

  test("uses a bounded, sanitized traces pipeline", () => {
    expect(collector).toContain("processors: [memory_limiter, transform/sanitize, batch]");
    expect(collector).toContain("queue_size: 512");
    expect(collector).toContain("max_elapsed_time: 60s");
    expect(collector).toContain('delete_key(attributes, "db.statement")');
    expect(collector).toContain('delete_key(attributes, "exception.message")');
    expect(collector).toContain("endpoint: ${env:OPENOBSERVE_OTLP_ENDPOINT}");
    expect(collector).toContain("Authorization: Basic ${env:OPENOBSERVE_AUTH_TOKEN}");
    expect(collector).toContain("stream-name: default");
    expect(collector).toContain("level: warn");
  });

  test("routes applications only to the Collector", () => {
    expect(productionEnv).toContain(
      "CNODE_OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318/v1/traces",
    );
    expect(productionEnv).not.toContain("metrics.cnodejs.org");
  });
});
