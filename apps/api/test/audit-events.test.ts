import { expect, test } from "vite-plus/test";
import {
  auditEventMeta,
  buildBulkUserGovernancePlan,
  bulkUserGovernanceAuditAction,
  sanitizeAuditDetail,
} from "../src/routes/admin";

test("audit events classify sensitive actions by category and risk", () => {
  expect(auditEventMeta("delete_all_user_content")).toEqual({
    category: "user",
    risk: "critical",
    label: "删除用户所有发言",
  });
  expect(auditEventMeta("grant_role")).toEqual({
    category: "role",
    risk: "high",
    label: "授予角色",
  });
  expect(auditEventMeta("moderation_scan_create").category).toBe("moderation");
  expect(auditEventMeta("bulk_unmute_user")).toEqual({
    category: "user",
    risk: "medium",
    label: "批量解除禁言",
  });
  expect(auditEventMeta("bulk_unblock_user")).toEqual({
    category: "user",
    risk: "medium",
    label: "批量恢复内容可见",
  });
});

test("bulk user governance audit actions stay explicit", () => {
  expect(bulkUserGovernanceAuditAction("unmute")).toBe("bulk_unmute_user");
  expect(bulkUserGovernanceAuditAction("unblock")).toBe("bulk_unblock_user");
});

test("bulk user governance plan deduplicates and skips unsafe targets", () => {
  const plan = buildBulkUserGovernancePlan("unmute", [1, 2, 2, 3, 4], 1, [{ id: 2 }, { id: 4 }]);
  expect(plan.ids).toEqual([1, 2, 3, 4]);
  expect(plan.processedIds).toEqual([2, 4]);
  expect(plan.skippedIds).toEqual([1, 3]);
  expect(plan.update).toEqual({ isMuted: false });
});

test("bulk user governance plan maps unblock without changing mute", () => {
  const plan = buildBulkUserGovernancePlan("unblock", [2], 1, [{ id: 2 }]);
  expect(plan.processedIds).toEqual([2]);
  expect(plan.update).toEqual({ isBlock: false });
});

test("audit detail sanitizer redacts sensitive JSON and text values", () => {
  expect(
    sanitizeAuditDetail(
      JSON.stringify({ role: "admin", token: "secret-token", nested: { password: "pw" } }),
    ),
  ).toBe(
    JSON.stringify({ role: "admin", token: "[redacted]", nested: { password: "[redacted]" } }),
  );
  expect(sanitizeAuditDetail("token=abc123 action=ok")).toBe("token=[redacted] action=ok");
});
