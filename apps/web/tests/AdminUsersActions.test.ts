import { describe, expect, it } from "vitest";
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
});
