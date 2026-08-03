import { describe, expect, it } from "vitest";
import { adminUserBulkGovernanceBodySchema, adminUsersQuerySchema } from "@cnode/shared";
import { bulkUserGovernanceFeedback, USER_GOVERNANCE_STATUS_LABELS, userGovernanceActionLabel } from "~/routes/admin/bans";
import { USER_MANAGEMENT_GROUP_LABELS, userBlockActionLabel } from "~/routes/admin/users";

describe("admin users action model", () => {
  it("groups user actions by operational risk", () => {
    expect(Object.values(USER_MANAGEMENT_GROUP_LABELS)).toEqual([
      "用户治理",
      "角色权限",
      "账号安全",
      "危险操作",
    ]);
  });

  it("uses explicit block/unblock labels", () => {
    expect(userBlockActionLabel(false)).toBe("屏蔽用户内容");
    expect(userBlockActionLabel(true)).toBe("恢复用户内容");
  });

  it("uses q as the admin users search query contract", () => {
    const parsed = adminUsersQuerySchema.parse({ q: "alice", page: "2", limit: "20" });
    expect(parsed).toMatchObject({ q: "alice", page: 2, limit: 20 });
    expect("search" in parsed).toBe(false);
  });

  it("validates bulk user governance input", () => {
    expect(adminUserBulkGovernanceBodySchema.safeParse({ action: "unmute", ids: [1, "2"] }).success).toBe(true);
    expect(adminUserBulkGovernanceBodySchema.safeParse({ action: "unblock", ids: [1] }).success).toBe(true);
    expect(adminUserBulkGovernanceBodySchema.safeParse({ action: "mute", ids: [1] }).success).toBe(false);
    expect(adminUserBulkGovernanceBodySchema.safeParse({ action: "unmute", ids: [] }).success).toBe(false);
  });

  it("separates mute and block labels in ban management", () => {
    expect(USER_GOVERNANCE_STATUS_LABELS).toEqual({
      muted: "禁言用户",
      blocked: "内容已屏蔽用户",
    });
    expect(userGovernanceActionLabel("muted")).toBe("解除禁言");
    expect(userGovernanceActionLabel("blocked")).toBe("恢复内容可见");
  });

  it("identifies partial-success retry scope", () => {
    expect(bulkUserGovernanceFeedback("解除禁言", {
      processed: 2,
      skipped_ids: [7, 9],
    })).toEqual({
      message: "解除禁言结果：成功 2 个，跳过 2 个，失败 0 个",
      description: "可重试目标：7、9",
    });
  });
});
