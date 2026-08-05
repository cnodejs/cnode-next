import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { UserHero } from "~/routes/user.$name";

const { apiFetch, toastError, toastSuccess } = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("~/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("~/lib/api-client")>("~/lib/api-client");
  return { ...actual, apiFetch };
});
vi.mock("sonner", () => ({ toast: { error: toastError, success: toastSuccess } }));

const baseUser: any = {
  loginname: "alice",
  avatar_url: "",
  create_at: "2026-01-01T00:00:00.000Z",
  identities: ["admin", "recruiter"],
  location: "Hangzhou",
  url: "alice.example.com",
  githubUsername: "alice-gh",
  signature: "Node.js developer",
  score: 120,
  topic_count: 8,
  reply_count: 42,
  collect_topic_count: 5,
  recent_topics: [],
  recent_replies: [],
  is_block: false,
  is_muted: false,
};

function renderHero(user = baseUser, currentUser: any = null) {
  const router = createMemoryRouter(
    [{ path: "/user/alice", element: <UserHero user={user} currentUser={currentUser} /> }],
    { initialEntries: ["/user/alice"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("用户公开资料 Hero", () => {
  beforeEach(() => {
    apiFetch.mockReset();
    toastError.mockReset();
    toastSuccess.mockReset();
  });

  it("shows independent identities, public profile links, signature and total counts", () => {
    renderHero();

    expect(screen.getByLabelText("用户身份")).toHaveTextContent("管理员");
    expect(screen.getByLabelText("用户身份")).toHaveTextContent("猎头");
    expect(screen.queryByText("版主")).not.toBeInTheDocument();
    expect(screen.getByText("Hangzhou")).toBeInTheDocument();
    expect(screen.getByText("Node.js developer")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /alice\.example\.com/ })).toHaveAttribute(
      "href",
      "https://alice.example.com/",
    );
    expect(screen.getByRole("link", { name: /@alice-gh/ })).toHaveAttribute(
      "href",
      "https://github.com/alice-gh",
    );
    expect(screen.getByText("话题").parentElement).toHaveTextContent("8");
    expect(screen.getByText("回复").parentElement).toHaveTextContent("42");
    expect(screen.getByText("收藏").parentElement).toHaveTextContent("5");
  });

  it("hides empty and unsafe public profile fields", () => {
    renderHero({
      ...baseUser,
      identities: [],
      location: null,
      url: "javascript:alert(1)",
      githubUsername: "",
      signature: null,
    });

    expect(screen.queryByLabelText("用户身份")).not.toBeInTheDocument();
    expect(screen.queryByText("Hangzhou")).not.toBeInTheDocument();
    expect(screen.queryByText("Node.js developer")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /javascript/i })).not.toBeInTheDocument();
  });

  it("keeps governance actions in one menu and confirms destructive actions", async () => {
    apiFetch.mockResolvedValue({ success: true });
    const operator = userEvent.setup();
    renderHero(baseUser, { loginname: "admin", is_admin: true });

    expect(screen.queryByRole("button", { name: "删除所有发言" })).not.toBeInTheDocument();
    await operator.click(screen.getByRole("button", { name: "管理" }));
    await operator.click(await screen.findByRole("menuitem", { name: "删除所有发言" }));

    const dialog = screen.getByRole("alertdialog", { name: "删除用户所有发言" });
    await operator.click(within(dialog).getByRole("button", { name: "确认删除所有发言" }));
    expect(apiFetch).toHaveBeenCalledWith("/api/v1/user/alice/delete_all", {
      method: "POST",
      body: JSON.stringify({}),
    });
  });

  it("keeps block and mute actions independent", async () => {
    const operator = userEvent.setup();
    renderHero(
      { ...baseUser, is_block: true, is_muted: false },
      { loginname: "admin", is_admin: true },
    );

    expect(screen.getByText("内容已屏蔽")).toBeInTheDocument();
    expect(screen.queryByText("已禁言")).not.toBeInTheDocument();
    await operator.click(screen.getByRole("button", { name: "管理" }));
    expect(await screen.findByRole("menuitem", { name: "禁言用户" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "恢复用户内容" })).toBeInTheDocument();
  });

  it("does not expose governance controls on the admin's own profile", () => {
    renderHero(baseUser, { loginname: "alice", is_admin: true });
    expect(screen.queryByRole("button", { name: "管理" })).not.toBeInTheDocument();
  });

  it("keeps the confirmation context and reports a backend 403 failure", async () => {
    apiFetch.mockResolvedValue({ success: false, error_msg: "403 无权执行此操作" });
    const operator = userEvent.setup();
    renderHero(baseUser, { loginname: "admin", is_admin: true });

    await operator.click(screen.getByRole("button", { name: "管理" }));
    await operator.click(await screen.findByRole("menuitem", { name: "屏蔽用户内容" }));
    const dialog = screen.getByRole("alertdialog", { name: "屏蔽用户内容" });
    await operator.click(within(dialog).getByRole("button", { name: "确认隐藏内容" }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("403 无权执行此操作"));
    expect(screen.getByRole("alertdialog", { name: "屏蔽用户内容" })).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
  });
});
