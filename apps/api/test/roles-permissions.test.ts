import assert from "node:assert/strict";
import { test } from "node:test";
import { userRoleSchema } from "@cnode/shared";
import { canRunTopicAction } from "../src/routes/admin";
import { canPostJobFromRoles } from "../src/routes/topic";

test("job posting requires admin or recruiter", () => {
  assert.equal(canPostJobFromRoles(false, []), false);
  assert.equal(canPostJobFromRoles(false, ["moderator"]), false);
  assert.equal(canPostJobFromRoles(false, ["recruiter"]), true);
  assert.equal(canPostJobFromRoles(true, []), true);
});

test("role schema rejects unknown roles", () => {
  assert.equal(userRoleSchema.safeParse("moderator").success, true);
  assert.equal(userRoleSchema.safeParse("recruiter").success, true);
  assert.equal(userRoleSchema.safeParse("admin").success, false);
  assert.equal(userRoleSchema.safeParse("owner").success, false);
});

test("moderators can run only known topic governance actions", () => {
  assert.equal(canRunTopicAction("delete", false, true), true);
  assert.equal(canRunTopicAction("mute", false, true), true);
  assert.equal(canRunTopicAction("top", false, true), true);
  assert.equal(canRunTopicAction("unknown", false, true), false);
  assert.equal(canRunTopicAction("delete", false, false), false);
});
