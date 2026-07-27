import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { githubUnbindSchema } from "../packages/shared/src/schemas/index";
import {
  decideGithubBind,
  executeGithubUnbind,
  isGithubIdUniqueViolation,
  revokeGithubToken,
} from "../apps/api/src/lib/github-account-linking";

assert.equal(decideGithubBind(null, "github-a", null, 1), "bind");
assert.equal(decideGithubBind("github-a", "github-a", 1, 1), "refresh");
assert.equal(decideGithubBind("github-a", "github-b", null, 1), "reject-different");
assert.equal(decideGithubBind(null, "github-a", 2, 1), "reject-occupied");
assert.equal(
  isGithubIdUniqueViolation({ code: "23505", constraint: "users_github_id_unique" }),
  true,
);
assert.equal(isGithubIdUniqueViolation({ code: "23505", constraint: "users_email_unique" }), false);
assert.equal(
  isGithubIdUniqueViolation(new Error("UNIQUE constraint failed: users.github_id")),
  true,
);

assert.deepEqual(githubUnbindSchema.parse({ password: "known-password" }), {
  password: "known-password",
});
assert.equal(githubUnbindSchema.safeParse({ password: "", token: "secret" }).success, false);
assert.equal(
  githubUnbindSchema.safeParse({ password: "known-password", extra: true }).success,
  false,
);

const oldClientId = process.env.AUTH_GITHUB_CLIENT_ID;
const oldClientSecret = process.env.AUTH_GITHUB_CLIENT_SECRET;
process.env.AUTH_GITHUB_CLIENT_ID = "test-client";
process.env.AUTH_GITHUB_CLIENT_SECRET = "test-secret";

const requestedBodies: string[] = [];
const fetchStatus = (status: number): typeof fetch =>
  (async (_input: string | URL | Request, init?: RequestInit) => {
    requestedBodies.push(String(init?.body || ""));
    return new Response(null, { status });
  }) as typeof fetch;

assert.deepEqual(await revokeGithubToken(null, fetchStatus(500)), {
  revoked: true,
  reason: "missing",
});
assert.deepEqual(await revokeGithubToken("token-204", fetchStatus(204)), {
  revoked: true,
  reason: "revoked",
});
assert.deepEqual(await revokeGithubToken("token-404", fetchStatus(404)), {
  revoked: true,
  reason: "missing",
});
assert.deepEqual(await revokeGithubToken("token-500", fetchStatus(500)), {
  revoked: false,
  reason: "temporary",
});
assert.deepEqual(
  await revokeGithubToken("token-network", (async () => {
    throw new Error("network unavailable");
  }) as typeof fetch),
  { revoked: false, reason: "temporary" },
);
assert(requestedBodies.some((body) => body.includes("token-204")));

const linkedUser = {
  id: 1,
  pass: "password-hash",
  githubId: "github-a",
  githubAccessToken: "github-token",
};
const dependencies = {
  verifyPassword: async (password: string) => password === "correct-password",
  revokeToken: async () => ({ revoked: true as const, reason: "revoked" as const }),
  clearGithubInfo: async () => true,
};
assert.deepEqual(
  await executeGithubUnbind({ ...linkedUser, githubId: null }, "correct-password", dependencies),
  { success: false, reason: "not-bound" },
);
assert.deepEqual(
  await executeGithubUnbind({ ...linkedUser, pass: null }, "correct-password", dependencies),
  { success: false, reason: "invalid-password" },
);
assert.deepEqual(await executeGithubUnbind(linkedUser, "wrong-password", dependencies), {
  success: false,
  reason: "invalid-password",
});
assert.deepEqual(
  await executeGithubUnbind(linkedUser, "correct-password", {
    ...dependencies,
    revokeToken: async () => ({ revoked: false, reason: "temporary" }),
  }),
  { success: false, reason: "revoke-failed" },
);
assert.deepEqual(
  await executeGithubUnbind(linkedUser, "correct-password", {
    ...dependencies,
    revokeToken: async () => ({ revoked: true, reason: "missing" }),
  }),
  { success: true, tokenRevoke: "missing" },
);
assert.deepEqual(
  await executeGithubUnbind(linkedUser, "correct-password", {
    ...dependencies,
    clearGithubInfo: async () => false,
  }),
  { success: false, reason: "binding-changed" },
);
await assert.rejects(() =>
  executeGithubUnbind(linkedUser, "correct-password", {
    ...dependencies,
    clearGithubInfo: async () => {
      throw new Error("transaction failed");
    },
  }),
);

if (oldClientId === undefined) delete process.env.AUTH_GITHUB_CLIENT_ID;
else process.env.AUTH_GITHUB_CLIENT_ID = oldClientId;
if (oldClientSecret === undefined) delete process.env.AUTH_GITHUB_CLIENT_SECRET;
else process.env.AUTH_GITHUB_CLIENT_SECRET = oldClientSecret;

const requireFromDb = createRequire(new URL("../packages/db/package.json", import.meta.url));
const Database = requireFromDb("better-sqlite3") as typeof import("better-sqlite3");
const tempDir = await mkdtemp(join(tmpdir(), "cnode-github-linking-"));
const sqlite = new Database(join(tempDir, "linking.db"));

try {
  sqlite.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      email TEXT NOT NULL,
      avatar TEXT,
      access_token TEXT,
      github_id TEXT,
      github_username TEXT,
      github_access_token TEXT
    );
    CREATE UNIQUE INDEX users_github_id_unique ON users (github_id);
  `);
  const insert = sqlite.prepare(
    "INSERT INTO users (id, email, avatar, access_token, github_id, github_username, github_access_token) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );
  insert.run(1, "one@example.com", "avatar-1", "api-1", null, null, null);
  insert.run(2, "two@example.com", "avatar-2", "api-2", null, null, null);
  sqlite
    .prepare(
      "UPDATE users SET github_id = ?, github_username = ?, github_access_token = ? WHERE id = ?",
    )
    .run("github-a", "octocat", "github-token", 1);
  assert.throws(() =>
    sqlite
      .prepare(
        "UPDATE users SET github_id = ?, github_username = ?, github_access_token = ? WHERE id = ?",
      )
      .run("github-a", "other", "other-token", 2),
  );
  sqlite
    .prepare(
      "UPDATE users SET github_id = NULL, github_username = NULL, github_access_token = NULL WHERE id = ? AND github_id = ?",
    )
    .run(1, "github-a");
  const row = sqlite.prepare("SELECT * FROM users WHERE id = 1").get() as Record<string, unknown>;
  assert.equal(row.github_id, null);
  assert.equal(row.github_username, null);
  assert.equal(row.github_access_token, null);
  assert.equal(row.email, "one@example.com");
  assert.equal(row.avatar, "avatar-1");
  assert.equal(row.access_token, "api-1");
} finally {
  sqlite.close();
  await rm(tempDir, { recursive: true, force: true });
}

const root = new URL("../", import.meta.url);
const auth = await readFile(new URL("apps/api/src/routes/auth.ts", root), "utf8");
const db = await readFile(new URL("apps/api/src/lib/db.ts", root), "utf8");
const setting = await readFile(new URL("apps/web/app/routes/setting.tsx", root), "utf8");
const migration = await readFile(
  new URL("packages/db/migrations/pg/0000_github_id_unique.sql", root),
  "utf8",
);

assert.match(auth, /decideGithubBind/);
assert.match(auth, /isGithubIdUniqueViolation/);
assert.match(auth, /revokeGithubToken\(profile\.accessToken\)/);
assert.match(auth, /perUserPerDay\("github_unbind", 10/);
assert.match(auth, /githubUnbindSchema/);
assert.match(auth, /clearGithubInfo: userQueries\.clearGithubInfo/);
assert.doesNotMatch(
  auth,
  /console\.(?:log|error)\([^\n]*(?:ghAccessToken|profile\.accessToken|password|clientSecret)/,
);
assert.match(db, /githubId: null, githubUsername: null, githubAccessToken: null/);
assert.match(setting, /divide-y divide-border\/70/);
assert.match(setting, /解除 GitHub 绑定/);
assert.match(setting, /忘记密码，先重置密码/);
assert.match(setting, /isSubmitting \? "解除中\.\.\."/);
assert.match(migration, /HAVING COUNT\(\*\) > 1/);
assert.match(migration, /CREATE UNIQUE INDEX IF NOT EXISTS "users_github_id_unique"/);

const sensitiveValues = ["known-password", "token-204", "test-secret"];
const responseAndAuditTemplates = [
  "当前密码错误；如果你从未设置过密码，请先重置密码",
  "GitHub 授权暂时无法撤销，请稍后重试",
  JSON.stringify({ githubId: "github-a", reason: "invalid-password" }),
];
for (const value of sensitiveValues) {
  for (const output of responseAndAuditTemplates) assert.equal(output.includes(value), false);
}

console.log("GitHub account linking checks passed");
