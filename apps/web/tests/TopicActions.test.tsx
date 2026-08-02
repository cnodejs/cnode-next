import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TopicActions } from "~/routes/topic.$tid";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock("~/lib/api-client", () => ({
  apiFetch,
  getCurrentUser: vi.fn(),
}));

const topic = {
  id: "42",
  title: "Base UI 迁移",
  author: { loginname: "alice" },
  is_collect: false,
  top: false,
  good: false,
};

function renderActions(currentUser: any) {
  const router = createMemoryRouter(
    [{ path: "/topic/42", element: <TopicActions topic={topic} currentUser={currentUser} /> }],
    { initialEntries: ["/topic/42"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("话题动作层级", () => {
  beforeEach(() => apiFetch.mockReset());

  it("keeps common actions visible for anonymous visitors", () => {
    renderActions(null);
    expect(screen.getByRole("button", { name: "收藏话题" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看回复" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "管理" })).not.toBeInTheDocument();
  });

  it("keeps author edit direct without exposing governance", () => {
    renderActions({ loginname: "alice" });
    expect(screen.getByRole("link", { name: "编辑话题" })).toHaveAttribute("href", "/topic/42/edit");
    expect(screen.queryByRole("button", { name: "管理" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /举报/ })).not.toBeInTheDocument();
  });

  it("keeps report as a normal user action", () => {
    renderActions({ loginname: "bob" });
    expect(screen.getByRole("button", { name: /举报/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "管理" })).not.toBeInTheDocument();
  });

  it("puts admin edit and governance actions in one management menu", async () => {
    const user = userEvent.setup();
    renderActions({ loginname: "admin", is_admin: true });
    expect(screen.queryByRole("link", { name: "编辑话题" })).not.toBeInTheDocument();
    screen.getByRole("button", { name: "管理" }).focus();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("menuitem", { name: "编辑话题" })).toBeInTheDocument();
    expect(screen.getByRole("menu")).toHaveClass("overscroll-contain", "pb-[max(0.25rem,env(safe-area-inset-bottom))]");
    expect(screen.getByLabelText("更多话题操作").parentElement).toHaveClass("flex-col", "sm:flex-row");
    expect(screen.getByRole("menuitem", { name: "置顶帖子" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "高亮帖子" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "删除帖子" })).toBeInTheDocument();
  });

  it("confirms deletion, keeps pending dialogs open, and restores management focus on cancel", async () => {
    const user = userEvent.setup();
    renderActions({ loginname: "admin", is_admin: true });
    const trigger = screen.getByRole("button", { name: "管理" });
    trigger.focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "删除帖子" }));
    const dialog = await screen.findByRole("alertdialog", { name: "确认删除帖子" });
    expect(dialog).toHaveTextContent("目标帖子：Base UI 迁移");
    await user.click(screen.getByRole("button", { name: "取消" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();

    trigger.focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "删除帖子" }));
    let resolveRequest: (value: unknown) => void = () => {};
    apiFetch.mockReturnValueOnce(new Promise((resolve) => { resolveRequest = resolve; }));
    await user.click(screen.getByRole("button", { name: "确认删除帖子" }));
    expect(screen.getByRole("button", { name: "删除中" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("alertdialog", { name: "确认删除帖子" })).toBeInTheDocument();
    resolveRequest({ success: false, error_msg: "没有权限" });
    expect(await screen.findByRole("alertdialog", { name: "确认删除帖子" })).toBeInTheDocument();
  });

  it("prevents duplicate governance actions while reporting pending state", async () => {
    const user = userEvent.setup();
    let resolveRequest: (value: unknown) => void = () => {};
    apiFetch.mockReturnValueOnce(new Promise((resolve) => { resolveRequest = resolve; }));
    renderActions({ loginname: "moderator", is_mod: true });
    const trigger = screen.getByRole("button", { name: "管理" });
    trigger.focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "置顶帖子" }));

    expect(trigger).toBeDisabled();
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(apiFetch).toHaveBeenCalledWith("/api/v1/topic/42/top", {
      method: "POST",
      body: JSON.stringify({}),
    });
    resolveRequest({ success: true, message: "置顶成功" });
    await waitFor(() => expect(trigger).toBeEnabled());
  });
});
