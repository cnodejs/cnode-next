import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadRootEnv } from "./env";

function workspace() {
  const root = mkdtempSync(join(tmpdir(), "cnode-env-"));
  writeFileSync(join(root, "package.json"), JSON.stringify({ name: "cnode-next" }));
  return root;
}

test("loads root .env without overriding existing environment", () => {
  const root = workspace();
  writeFileSync(join(root, ".env"), "DB_HOST=127.0.0.1\nDB_PORT=5432\n");
  const env: Record<string, string | undefined> = { DB_HOST: "from-shell" };

  loadRootEnv({ cwd: root, env });

  assert.equal(env.DB_HOST, "from-shell");
  assert.equal(env.DB_PORT, "5432");
});

test("explicit CNODE_ENV_FILE overrides values loaded from root .env", () => {
  const root = workspace();
  writeFileSync(join(root, ".env"), "DB_HOST=127.0.0.1\nDB_PORT=5432\n");
  writeFileSync(join(root, ".env.remote.local"), "DB_HOST=127.0.0.1\nDB_PORT=15432\n");
  const env: Record<string, string | undefined> = { CNODE_ENV_FILE: ".env.remote.local" };

  loadRootEnv({ cwd: root, env });

  assert.equal(env.DB_HOST, "127.0.0.1");
  assert.equal(env.DB_PORT, "15432");
});

test("explicit CNODE_ENV_FILE does not override shell environment", () => {
  const root = workspace();
  writeFileSync(join(root, ".env"), "DB_HOST=127.0.0.1\nDB_PORT=5432\n");
  writeFileSync(join(root, ".env.remote.local"), "DB_HOST=remote\nDB_PORT=15432\n");
  const env: Record<string, string | undefined> = { CNODE_ENV_FILE: ".env.remote.local", DB_HOST: "from-shell" };

  loadRootEnv({ cwd: root, env });

  assert.equal(env.DB_HOST, "from-shell");
  assert.equal(env.DB_PORT, "15432");
});

test("does not load .env.local by default", () => {
  const root = workspace();
  writeFileSync(join(root, ".env"), "DB_HOST=from-env\n");
  writeFileSync(join(root, ".env.local"), "DB_HOST=from-local\nDB_PORT=15432\n");
  const env: Record<string, string | undefined> = {};

  loadRootEnv({ cwd: root, env });

  assert.equal(env.DB_HOST, "from-env");
  assert.equal(env.DB_PORT, undefined);
});

test("throws when explicit CNODE_ENV_FILE is missing", () => {
  const root = workspace();
  writeFileSync(join(root, ".env"), "DB_HOST=127.0.0.1\n");

  assert.throws(() => loadRootEnv({ cwd: root, env: { CNODE_ENV_FILE: ".env.missing.local" } }), /CNODE_ENV_FILE does not exist/);
});

test("finds workspace root from nested package directory", () => {
  const root = workspace();
  const nested = join(root, "apps", "web");
  mkdirSync(nested, { recursive: true });
  writeFileSync(join(root, ".env"), "APP_ENV=development\n");
  const env: Record<string, string | undefined> = {};

  const result = loadRootEnv({ cwd: nested, env });

  assert.equal(result.root, root);
  assert.equal(env.APP_ENV, "development");
});
