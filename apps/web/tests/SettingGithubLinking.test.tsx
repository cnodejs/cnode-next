import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import Setting from "~/routes/setting";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock("~/lib/api-client", () => ({ apiFetch }));
vi.mock("~/components/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => children,
}));

function renderSetting(githubBound: boolean) {
  const user = {
    email: "member@example.com",
    github_bound: githubBound,
    github_username: githubBound ? "octocat" : null,
    receive_reply_mail: false,
    receive_at_mail: false,
  };
  const router = createMemoryRouter(
    [
      {
        path: "/setting",
        element: <Setting {...({ loaderData: { user }, params: {}, matches: [] } as any)} />,
      },
      { path: "/search_pass", element: <div>重置密码</div> },
      { path: "/auth/github", element: <div>绑定 GitHub</div> },
    ],
    { initialEntries: ["/setting"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("设置页 GitHub 账号身份", () => {
  beforeEach(() => apiFetch.mockReset());

  it("uses the same identity rows for email and a connected GitHub account", () => {
    renderSetting(true);
    expect(screen.getByText("邮箱")).toBeInTheDocument();
    expect(screen.getByText("member@example.com")).toBeInTheDocument();
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("octocat")).toBeInTheDocument();
    expect(screen.getByText("已绑定")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "解除绑定" })).toBeInTheDocument();
    expect(
      screen
        .getByRole("checkbox", { name: "有人回复我的话题时邮件通知" })
        .closest('[data-slot="field"]'),
    ).toHaveAttribute("data-orientation", "horizontal");
  });

  it("shows the unbound state and bind action in the same GitHub row", () => {
    renderSetting(false);
    expect(screen.getByText("未绑定")).toBeInTheDocument();
    expect(screen.getByText("绑定后可使用 GitHub 快速登录")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "绑定 GitHub" })).toHaveAttribute(
      "href",
      "/auth/github?intent=bind",
    );
  });

  it("requires a password, exposes recovery, and prevents duplicate submission", async () => {
    let resolveRequest: (value: { success: boolean }) => void = () => {};
    apiFetch.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const user = userEvent.setup();
    renderSetting(true);

    await user.click(screen.getByRole("button", { name: "解除绑定" }));
    const dialog = screen.getByRole("dialog", { name: "解除 GitHub 绑定" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "忘记密码，先重置密码" })).toHaveAttribute(
      "href",
      "/search_pass",
    );

    await user.click(within(dialog).getByRole("button", { name: "确认解除绑定" }));
    expect(await within(dialog).findByText("请输入当前密码")).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();

    await user.type(within(dialog).getByLabelText("当前密码"), "correct-password");
    await user.click(within(dialog).getByRole("button", { name: "确认解除绑定" }));
    expect(within(dialog).getByRole("button", { name: "解除中..." })).toBeDisabled();
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(apiFetch).toHaveBeenCalledWith("/api/v1/auth/github/unbind", {
      method: "POST",
      body: JSON.stringify({ password: "correct-password" }),
    });
    resolveRequest({ success: true });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
