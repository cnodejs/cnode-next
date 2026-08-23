import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vite-plus/test";

const root = resolve(import.meta.dirname, "../../..");
const envExample = readFileSync(resolve(root, "docs/deployment/env.production.example"), "utf8");
const deployment = readFileSync(resolve(root, "docs/deployment/deployment.md"), "utf8");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const smoke = readFileSync(
  resolve(root, "docs/deployment/scripts/smoke-web-security.ts"),
  "utf8",
);

describe("Web security deployment contract", () => {
  it("publishes safe staged runtime defaults", () => {
    expect(envExample).toContain("CNODE_WEB_CSP_MODE=report-only");
    expect(envExample).toContain("CNODE_WEB_HSTS_MAX_AGE=300");
    expect(envExample).toContain("CNODE_CSP_REPORT_LIMIT_PER_MINUTE=60");
    expect(envExample).not.toContain("includeSubDomains");
    expect(envExample).not.toContain("preload");
  });

  it("documents ownership, enforcement gates, and runtime rollback", () => {
    expect(deployment).toContain("sole owner of CSP");
    expect(deployment).toContain("CNODE_WEB_CSP_MODE=report-only");
    expect(deployment).toContain("off`, `report-only`, and `enforce");
    expect(deployment).toContain("CNODE_WEB_HSTS_MAX_AGE=0");
    expect(deployment).toContain("no unexplained first-party violation remains");
  });

  it("provides a redacted Web response smoke command", () => {
    expect(packageJson.scripts["smoke:web-security"]).toContain("smoke-web-security.ts");
    expect(smoke).not.toMatch(/authorization|cookie/i);
    expect(smoke).not.toContain("response.headers.entries");
    expect(smoke).not.toContain("console.log(html)");
    expect(smoke).toContain('"permissions-policy"');
    expect(smoke).toContain('"strict-transport-security"');
  });
});
