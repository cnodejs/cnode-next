import { describe, expect, it } from "vitest";
import { getTopicActionPresentation } from "~/lib/topic-action-presentation";

const topic = { author: { loginname: "alice" } };

describe("话题动作呈现矩阵", () => {
  it.each([
    ["匿名", null, { report: false, directEdit: false, management: false, managementEdit: false }],
    ["普通用户", { loginname: "bob" }, { report: true, directEdit: false, management: false, managementEdit: false }],
    ["作者", { loginname: "alice" }, { report: false, directEdit: true, management: false, managementEdit: false }],
    ["版主", { loginname: "bob", is_mod: true }, { report: false, directEdit: false, management: true, managementEdit: false }],
    ["作者兼版主", { loginname: "alice", is_mod: true }, { report: false, directEdit: true, management: true, managementEdit: false }],
    ["管理员", { loginname: "bob", is_admin: true }, { report: false, directEdit: false, management: true, managementEdit: true }],
    ["作者兼管理员", { loginname: "alice", is_admin: true }, { report: false, directEdit: true, management: true, managementEdit: false }],
    ["管理员兼版主", { loginname: "bob", is_admin: true, is_mod: true }, { report: false, directEdit: false, management: true, managementEdit: true }],
  ])("presents actions for %s", (_label, user, expected) => {
    const result = getTopicActionPresentation(topic, user);
    expect(result).toMatchObject({
      showReport: expected.report,
      showDirectEdit: expected.directEdit,
      showManagement: expected.management,
      showManagementEdit: expected.managementEdit,
    });
    expect(result.showPin).toBe(expected.management);
    expect(result.showHighlight).toBe(expected.management);
    expect(result.showDelete).toBe(expected.management);
  });
});
