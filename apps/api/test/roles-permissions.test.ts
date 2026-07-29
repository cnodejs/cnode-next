import { expect, test } from "vitest";
import { userRoleSchema } from "@cnode/shared";
import { canRunJobBulkModerationAction, canRunPermanentTopicDelete, canRunTopicAction, normalizePermanentTopicDeleteIds } from "../src/lib/admin-governance";
import { canPostJobFromRoles } from "../src/routes/topic";

test("job posting requires admin or recruiter", () => {
  expect(canPostJobFromRoles(false, [])).toBe(false);
  expect(canPostJobFromRoles(false, ["moderator"])).toBe(false);
  expect(canPostJobFromRoles(false, ["recruiter"])).toBe(true);
  expect(canPostJobFromRoles(true, [])).toBe(true);
});

test("role schema rejects unknown roles", () => {
  expect(userRoleSchema.safeParse("moderator").success).toBe(true);
  expect(userRoleSchema.safeParse("recruiter").success).toBe(true);
  expect(userRoleSchema.safeParse("admin").success).toBe(false);
  expect(userRoleSchema.safeParse("owner").success).toBe(false);
});

test("moderators can run only known topic governance actions", () => {
  expect(canRunTopicAction("delete", false, true)).toBe(true);
  expect(canRunTopicAction("mute", false, true)).toBe(true);
  expect(canRunTopicAction("top", false, true)).toBe(true);
  expect(canRunTopicAction("unknown", false, true)).toBe(false);
  expect(canRunTopicAction("delete", false, false)).toBe(false);
});

test("only admins can permanently delete topics", () => {
  expect(canRunPermanentTopicDelete(true)).toBe(true);
  expect(canRunPermanentTopicDelete(false)).toBe(false);
});

test("only admins can run job-level moderation confirm", () => {
  expect(canRunJobBulkModerationAction("confirm", true)).toBe(true);
  expect(canRunJobBulkModerationAction("confirm", false)).toBe(false);
  expect(canRunJobBulkModerationAction("ignore", true)).toBe(false);
  expect(canRunJobBulkModerationAction("falsepositive", true)).toBe(false);
});

test("permanent topic delete ids are normalized and capped", () => {
  expect(normalizePermanentTopicDeleteIds({ id: "12" })).toEqual([12]);
  expect(normalizePermanentTopicDeleteIds({ topic_id: 13 })).toEqual([13]);
  expect(normalizePermanentTopicDeleteIds({ ids: ["1", 0, -1, "bad", 2] })).toEqual([1, 2]);
  expect(normalizePermanentTopicDeleteIds({ ids: Array.from({ length: 30 }, (_, index) => index + 1) }).length).toBe(20);
});
