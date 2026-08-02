import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminKeywords from "~/routes/admin/keywords";
import AdminBans from "~/routes/admin/bans";
import AdminReports from "~/routes/admin/reports";
import AdminSettings from "~/routes/admin/settings";
import AdminTopics from "~/routes/admin/topics";
import AdminUsers from "~/routes/admin/users";

const { apiFetch, toastError, toastSuccess } = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("~/lib/api-client", () => ({ apiFetch }));
vi.mock("sonner", () => ({ toast: { error: toastError, success: toastSuccess } }));
vi.mock("~/components/AdminLayout", () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => children,
}));

function renderRoute(path: string, element: React.ReactNode) {
  const router = createMemoryRouter([{ path, element }], { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe("后台破坏性操作确认", () => {
  beforeEach(() => {
    apiFetch.mockReset();
    toastError.mockReset();
    toastSuccess.mockReset();
  });

  it("does not delete a keyword on cancel and blocks close while deletion is pending", async () => {
    const user = userEvent.setup();
    renderRoute("/admin/keywords", <AdminKeywords loaderData={{
      keywords: [{ id: 7, word: "spam", hit_count: 3 }],
      total: 1,
      page: 1,
      limit: 50,
      q: "",
    }} />);

    const trigger = screen.getByRole("button", { name: "删除" });
    await user.click(trigger);
    expect(screen.getByRole("alertdialog", { name: "删除敏感词规则" })).toHaveTextContent("spam");
    await user.click(screen.getByRole("button", { name: "取消" }));
    expect(apiFetch).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    let resolveRequest: (value: unknown) => void = () => {};
    apiFetch.mockReturnValueOnce(new Promise((resolve) => { resolveRequest = resolve; }));
    await user.click(screen.getByRole("button", { name: "确认删除规则" }));
    expect(screen.getByRole("button", { name: "删除中" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("删除中");
    await user.keyboard("{Escape}");
    expect(screen.getByRole("alertdialog", { name: "删除敏感词规则" })).toBeInTheDocument();
    resolveRequest({ success: true });
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("identifies the reported target before confirming violation deletion", async () => {
    const user = userEvent.setup();
    renderRoute("/admin/reports", <AdminReports loaderData={{
      reports: [{ id: 9, type: "spam", target_type: "reply", target_id: 22, topic_id: 10, topic_title: "问题标题", reporter_count: 2 }],
      total: 1,
      page: 1,
      limit: 50,
      status: "pending",
    }} />);

    await user.click(screen.getByRole("button", { name: "确认违规" }));
    const dialog = screen.getByRole("alertdialog", { name: "确认违规并删除内容" });
    expect(dialog).toHaveTextContent("回复 #22");
    expect(dialog).toHaveTextContent("问题标题");
    await user.click(screen.getByRole("button", { name: "取消" }));
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("uses distinct confirmations for block, mute, roles, credentials, and delete-all", async () => {
    const user = userEvent.setup();
    renderRoute("/admin/users", <AdminUsers loaderData={{
      users: [{ id: 2, loginname: "alice", email: "alice@example.com", is_block: false, is_muted: false, roles: [] }],
      total: 1,
      page: 1,
      limit: 50,
      q: "",
      currentUser: { id: 1, loginname: "admin", is_admin: true },
    }} />);
    const trigger = screen.getByRole("button", { name: "管理" });
    const openMenu = async () => {
      trigger.focus();
      await user.keyboard("{Enter}");
    };

    await openMenu();
    await user.click(await screen.findByRole("menuitem", { name: "屏蔽用户内容" }));
    expect(screen.getByRole("alertdialog", { name: "屏蔽用户内容" })).toHaveTextContent("不等同于禁言");
    await user.click(screen.getByRole("button", { name: "取消" }));

    await openMenu();
    await user.click(await screen.findByRole("menuitem", { name: "禁言" }));
    expect(screen.getByRole("alertdialog", { name: "禁言用户" })).toHaveTextContent("已有内容不会因此自动隐藏");
    await user.click(screen.getByRole("button", { name: "取消" }));

    await openMenu();
    await user.click(await screen.findByRole("menuitem", { name: "授予版主" }));
    const roleDialog = screen.getByRole("alertdialog", { name: "授予用户角色" });
    expect(roleDialog).toHaveTextContent("当前角色：无");
    expect(roleDialog).toHaveTextContent("版主内容治理权限");
    await user.click(screen.getByRole("button", { name: "取消" }));

    await openMenu();
    await user.click(await screen.findByRole("menuitem", { name: "重置密码" }));
    expect(screen.getByRole("alertdialog", { name: "重置用户密码" })).toHaveTextContent("现有密码将立即失效");
    await user.click(screen.getByRole("button", { name: "取消" }));

    await openMenu();
    await user.click(await screen.findByRole("menuitem", { name: "删除所有发言" }));
    expect(screen.getByRole("alertdialog", { name: "删除用户所有发言" })).toHaveTextContent("用户账号本身不会删除");
    await user.click(screen.getByRole("button", { name: "取消" }));
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("requires confirmation before hiding topics", async () => {
    const user = userEvent.setup();
    renderRoute("/admin/topics", <AdminTopics loaderData={{
      topics: [{ id: 4, title: "需要隐藏的话题", tab: "share", status: "published", deleted: 0, top: 0, good: 0, lock: 0, archived: 0, reply_count: 0, visit_count: 0, collect_count: 0, create_at: "2026-08-02" }],
      total: 1,
      page: 1,
      limit: 50,
      q: "",
      tab: "",
      visibility: "all",
      flag: "all",
      dateField: "create_at",
      dateFrom: "",
      dateTo: "",
      sort: "create_at_desc",
      user: { is_admin: true },
    }} />);

    await user.click(screen.getByRole("checkbox", { name: "选择话题 需要隐藏的话题" }));
    await user.click(screen.getByRole("button", { name: "隐藏" }));
    expect(screen.getByRole("alertdialog", { name: "确认切换话题可见性" })).toHaveTextContent("1 个话题");
    expect(apiFetch).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "取消" }));
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("keeps a failed IP rule confirmation and its input available for retry", async () => {
    const user = userEvent.setup();
    renderRoute("/admin/bans", <AdminBans loaderData={{
      bannedUsers: [],
      bannedUsersTotal: 0,
      bannedIps: [],
      bannedIpsTotal: 0,
      page: 1,
      limit: 50,
      tab: "ips",
      userStatus: "muted",
    }} />);

    await user.type(screen.getByPlaceholderText("IP 或 CIDR (如 1.2.3.4 或 1.2.3.0/24)"), "1.2.3.4");
    await user.click(screen.getByRole("button", { name: "添加" }));
    expect(screen.getByRole("alertdialog", { name: "确认添加 IP 封禁规则" })).toHaveTextContent("1.2.3.4");
    expect(apiFetch).not.toHaveBeenCalled();

    apiFetch.mockResolvedValueOnce({ success: false, error_msg: "规则冲突" });
    await user.click(screen.getByRole("button", { name: "确认添加 IP 规则" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "确认添加 IP 规则" })).toBeEnabled());
    expect(screen.getByRole("alertdialog", { name: "确认添加 IP 封禁规则" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("1.2.3.4")).toBeInTheDocument();
    expect(toastError).toHaveBeenCalledWith("规则冲突");
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("keeps skipped bulk governance targets selected for retry", async () => {
    const user = userEvent.setup();
    renderRoute("/admin/bans", <AdminBans loaderData={{
      bannedUsers: [
        { id: 1, loginname: "alice", is_muted: true, is_block: false },
        { id: 2, loginname: "bob", is_muted: true, is_block: false },
      ],
      bannedUsersTotal: 2,
      bannedIps: [],
      bannedIpsTotal: 0,
      page: 1,
      limit: 50,
      tab: "users",
      userStatus: "muted",
    }} />);

    await user.click(screen.getByRole("checkbox", { name: "选择当前页禁言用户" }));
    await user.click(screen.getByRole("button", { name: "批量解除禁言 (2)" }));
    apiFetch.mockResolvedValueOnce({ success: true, processed: 1, skipped_ids: [2] });
    await user.click(screen.getByRole("button", { name: "确认解除禁言 2 个用户" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByRole("checkbox", { name: "选择 alice" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "选择 bob" })).toBeChecked();
    expect(toastSuccess).toHaveBeenCalledWith(
      "解除禁言结果：成功 1 个，跳过 1 个，失败 0 个",
      { description: "可重试目标：2" },
    );
  });

  it("does not report a failed settings save as successful", async () => {
    const user = userEvent.setup();
    renderRoute("/admin/settings", <AdminSettings loaderData={{
      tab: "registration",
      config: {
        allow_signup: true,
        new_user_min_hours: 24,
        new_user_min_replies: 3,
        rate_topic: 1000,
        rate_reply: 1000,
      },
    }} />);
    apiFetch.mockResolvedValueOnce({ success: false, error_msg: "保存冲突" });
    await user.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "保存" })).toBeEnabled());
    expect(toastError).toHaveBeenCalledWith("保存冲突");
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("keeps password reset context open after a business failure", async () => {
    const user = userEvent.setup();
    renderRoute("/admin/users", <AdminUsers loaderData={{
      users: [{ id: 2, loginname: "alice", email: "alice@example.com", is_block: false, is_muted: false, roles: [] }],
      total: 1,
      page: 1,
      limit: 50,
      q: "",
      currentUser: { id: 1, loginname: "admin", is_admin: true },
    }} />);

    const trigger = screen.getByRole("button", { name: "管理" });
    trigger.focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "重置密码" }));
    apiFetch.mockResolvedValueOnce({ success: false, error_msg: "暂时无法重置" });
    await user.click(screen.getByRole("button", { name: "确认重置密码" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "确认重置密码" })).toBeEnabled());
    expect(screen.getByRole("alertdialog", { name: "重置用户密码" })).toHaveTextContent("alice");
  });
});
