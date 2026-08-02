import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { Footer, Header, Layout } from "~/components/Layout";
import { CommandPalette } from "~/components/CommandPalette";
import { AdminLayout } from "~/components/AdminLayout";
import { AuthShell } from "~/components/AuthShell";
import { CardHeader, CardTitle } from "~/components/ui/card";
import { UserTabs } from "~/routes/user.$name";

function renderWithRoot(element: React.ReactNode, initialEntry = "/", user: Record<string, boolean> | null = null) {
  const router = createMemoryRouter(
    [{ id: "root", path: "*", element }],
    {
      initialEntries: [initialEntry],
      hydrationData: { loaderData: { root: { zones: [], user } } },
    },
  );
  return { ...render(<RouterProvider router={router} />), router };
}

describe("公开导航收束", () => {
  it("puts a focusable skip link before the public shell main landmark", async () => {
    const user = userEvent.setup();
    renderWithRoot(<Layout><h1>测试页面</h1></Layout>);

    const skipLink = screen.getByRole("link", { name: "跳到主要内容" });
    const main = screen.getByRole("main");
    expect(skipLink).toHaveAttribute("href", "#main-content");
    expect(main).toHaveAttribute("id", "main-content");
    await user.click(skipLink);
    expect(main).toHaveFocus();
  });

  it("uses a direct desktop About link instead of an About dropdown", () => {
    renderWithRoot(<Header />);

    const header = screen.getByRole("banner");
    expect(header).toHaveClass("shadow-sm");
    expect(header).not.toHaveClass("border-b");
    expect(screen.getByRole("link", { name: "关于" })).toHaveAttribute("href", "/about");
    expect(screen.queryByRole("button", { name: "关于" })).not.toBeInTheDocument();
  });

  it("marks the current public destination independently of query parameters", () => {
    renderWithRoot(<Header />, "/about?from=footer");
    expect(screen.getByRole("link", { name: "关于" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "API" })).not.toHaveAttribute("aria-current");
  });

  it("keeps only About and API in the mobile information navigation", async () => {
    const user = userEvent.setup();
    renderWithRoot(<Header />);
    await user.click(screen.getByRole("button", { name: "打开导航" }));

    const dialog = screen.getByRole("dialog", { name: "导航" });
    expect(within(dialog).getByRole("link", { name: "关于" })).toHaveAttribute("href", "/about");
    expect(within(dialog).getByRole("link", { name: "API" })).toHaveAttribute("href", "/api");
    expect(within(dialog).queryByText("新手指南")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("常见问题")).not.toBeInTheDocument();
  });

  it("offers a single About action in CommandPalette", () => {
    renderWithRoot(<CommandPalette open onOpenChange={() => {}} />);

    expect(screen.getByRole("option", { name: "关于 CNode" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "管理后台" })).not.toBeInTheDocument();
    expect(screen.queryByText("新手指南")).not.toBeInTheDocument();
    expect(screen.queryByText("常见问题")).not.toBeInTheDocument();
  });

  it("routes each governance role only to an accessible admin destination", async () => {
    const user = userEvent.setup();
    const moderator = renderWithRoot(<CommandPalette open onOpenChange={() => {}} />, "/", { is_mod: true });
    await user.click(screen.getByRole("option", { name: "内容管理" }));
    await waitFor(() => expect(moderator.router.state.location.pathname).toBe("/admin/topics"));
    expect(screen.queryByRole("option", { name: "管理后台" })).not.toBeInTheDocument();
    moderator.unmount();

    renderWithRoot(<CommandPalette open onOpenChange={() => {}} />, "/", { is_admin: true });
    expect(screen.getByRole("option", { name: "管理后台" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "内容管理" })).not.toBeInTheDocument();
  });

  it("supports command keyboard selection and an announced empty state", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(
      [{ id: "root", path: "*", element: <CommandPalette open onOpenChange={() => {}} /> }],
      {
        initialEntries: ["/"],
        hydrationData: { loaderData: { root: { zones: [], user: null } } },
      },
    );
    render(<RouterProvider router={router} />);
    const input = screen.getByRole("combobox", { name: "搜索命令" });
    await user.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(router.state.location.pathname).toBe("/my/messages"));

    await user.type(input, "不存在的命令");
    expect(await screen.findByRole("status")).toHaveTextContent("没有匹配的快捷命令");
  });

  it("returns focus to the header trigger after Escape", async () => {
    const user = userEvent.setup();
    renderWithRoot(<Header />);
    const trigger = screen.getByRole("button", { name: "搜索话题和用户" });
    await user.click(trigger);
    expect(await screen.findByRole("combobox", { name: "搜索命令" })).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("renders the final non-duplicated Footer groups", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("link", { name: "了解社区" })[0]).toHaveAttribute("href", "/about");
    const community = screen.getByText("社区").parentElement!;
    expect(within(community).getByRole("link", { name: "用户排行" })).toHaveAttribute("href", "/users/top100");
    expect(within(community).getByRole("link", { name: "精华话题" })).toHaveAttribute("href", "/stars");
    const resources = screen.getByText("资源").parentElement!;
    expect(within(resources).getByRole("link", { name: "API" })).toHaveAttribute("href", "/api");
    expect(within(resources).getByRole("link", { name: "RSS" })).toHaveAttribute("href", "/rss");
    const developer = screen.getByText("开发者").parentElement!;
    expect(within(developer).getAllByRole("link")).toHaveLength(1);
    expect(within(developer).getByRole("link", { name: "GitHub" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.queryByText("RSS 订阅")).not.toBeInTheDocument();
    expect(screen.queryByText("新手指南")).not.toBeInTheDocument();
    expect(screen.queryByText("FAQ")).not.toBeInTheDocument();
    const footer = screen.getByRole("contentinfo");
    expect(footer).not.toHaveClass("border-t");
    expect(footer.querySelector(".divide-y")).not.toBeInTheDocument();
  });
});

describe("Shell landmark 与标题", () => {
  it("provides the same skip target in the admin shell", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(
      [{ id: "root", path: "/admin", element: <AdminLayout><h1>后台页面</h1></AdminLayout> }],
      {
        initialEntries: ["/admin"],
        hydrationData: { loaderData: { root: { zones: [], user: null } } },
      },
    );
    render(<RouterProvider router={router} />);

    const skipLink = screen.getByRole("link", { name: "跳到主要内容" });
    const main = screen.getByRole("main");
    await user.click(skipLink);
    expect(main).toHaveFocus();
  });

  it("keeps one auth page h1 and uses card titles as section headings", () => {
    render(
      <MemoryRouter>
        <AuthShell eyebrow="WELCOME" title="回到社区" description="登录说明">
          <CardHeader><CardTitle>登录</CardTitle></CardHeader>
        </AuthShell>
      </MemoryRouter>,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("回到社区");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("登录");
  });
});

describe("导航当前项", () => {
  it("keeps admin top, side, and mobile navigation current with a query string", () => {
    const router = createMemoryRouter(
      [{ id: "root", path: "*", element: <AdminLayout><h1>话题管理</h1></AdminLayout> }],
      {
        initialEntries: ["/admin/topics?status=open&page=2"],
        hydrationData: { loaderData: { root: { zones: [], user: null } } },
      },
    );
    render(<RouterProvider router={router} />);
    expect(screen.getByRole("link", { name: "内容" })).toHaveAttribute("aria-current", "page");
    for (const link of screen.getAllByRole("link", { name: "话题管理" })) {
      expect(link).toHaveAttribute("aria-current", "page");
    }
  });

  it("marks the selected user tab as the current page", () => {
    render(
      <MemoryRouter initialEntries={["/user/alice/topics?page=2"]}>
        <UserTabs loginname="alice" active="topics" />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "话题" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "主页" })).not.toHaveAttribute("aria-current");
  });
});
