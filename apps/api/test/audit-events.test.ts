import { expect, test } from "vitest";
import { auditEventMeta, sanitizeAuditDetail } from "../src/routes/admin";

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
});

test("audit detail sanitizer redacts sensitive JSON and text values", () => {
  expect(
    sanitizeAuditDetail(JSON.stringify({ role: "admin", token: "secret-token", nested: { password: "pw" } })),
  ).toBe(JSON.stringify({ role: "admin", token: "[redacted]", nested: { password: "[redacted]" } }));
  expect(sanitizeAuditDetail("token=abc123 action=ok")).toBe("token=[redacted] action=ok");
});
