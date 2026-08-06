import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { Footer, Header, Layout } from "~/components/Layout";
import { CommandPalette } from "~/components/CommandPalette";
import { AdminLayout } from "~/components/AdminLayout";
import { AuthShell } from "~/components/AuthShell";
import { CardHeader, CardTitle } from "~/components/ui/card";
import { UserTabs } from "~/routes/user.$name";

function renderWithRoot(
  element: React.ReactNode,
  initialEntry = "/",
  user: Record<string, boolean> | null = null,
) {
  const router = createMemoryRouter([{ id: "root", path: "*", element }], {
    initialEntries: [initialEntry],
    hydrationData: { loaderData: { root: { zones: [], user } } },
  });
  return { ...render(<RouterProvider router={router} />), router };
}

describe("公开导航收束", () => {
  it("puts a focusable skip link before the public shell main landmark", async () => {
    const user = userEvent.setup();
    renderWithRoot(
      <Layout>
        <h1>测试页面</h1>
      </Layout>,
    );

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
    const moderator = renderWithRoot(<CommandPalette open onOpenChange={() => {}} />, "/", {
      is_mod: true,
    });
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

  it.each([375, 1280])(
    "allocates a non-overlapping search row and touch-safe close control at %ipx",
    (width) => {
      window.innerWidth = width;
      window.dispatchEvent(new Event("resize"));
      const { container } = renderWithRoot(<CommandPalette open onOpenChange={() => {}} />);

      const row = container.ownerDocument.querySelector('[data-slot="command-search-row"]')!;
      const input = screen.getByRole("combobox", { name: "搜索命令" });
      const close = screen.getByRole("button", { name: "关闭搜索面板" });
      expect(row).toHaveClass("flex", "min-w-0");
      expect(input.closest("form")).toHaveClass("min-w-0", "flex-1");
      expect(close).toHaveClass("size-11", "shrink-0", "sm:size-8");
      expect(close).not.toHaveClass("absolute");
      expect(row.children).toContain(input.closest("form"));
      expect(row.children).toContain(close);
    },
  );

  it("returns focus to the header trigger after Escape", async () => {
    const user = userEvent.setup();
    renderWithRoot(<Header />);
    const trigger = screen.getByRole("button", { name: "搜索话题和用户" });
    await user.click(trigger);
    expect(await screen.findByRole("combobox", { name: "搜索命令" })).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("returns focus to the header trigger after using the explicit close control", async () => {
    const user = userEvent.setup();
    renderWithRoot(<Header />);
    const trigger = screen.getByRole("button", { name: "搜索话题和用户" });
    await user.click(trigger);
    const close = await screen.findByRole("button", { name: "关闭搜索面板" });

    await user.click(close);

    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole("combobox", { name: "搜索命令" })).not.toBeInTheDocument();
  });

  it("renders the final non-duplicated Footer groups", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("link", { name: "了解社区" })[0]).toHaveAttribute("href", "/about");
    const community = screen.getByText("社区").parentElement!;
    expect(within(community).getByRole("link", { name: "用户排行" })).toHaveAttribute(
      "href",
      "/users/top100",
    );
    expect(within(community).getByRole("link", { name: "精华话题" })).toHaveAttribute(
      "href",
      "/stars",
    );
    const resources = screen.getByText("资源").parentElement!;
    expect(within(resources).getByRole("link", { name: "API" })).toHaveAttribute("href", "/api");
    expect(within(resources).getByRole("link", { name: "RSS" })).toHaveAttribute("href", "/rss");
    const developer = screen.getByText("开发者").parentElement!;
    expect(within(developer).getAllByRole("link")).toHaveLength(1);
    expect(within(developer).getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
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
      [
        {
          id: "root",
          path: "/admin",
          element: (
            <AdminLayout>
              <h1>后台页面</h1>
            </AdminLayout>
          ),
        },
      ],
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

  it("server-renders the contained admin navigation shell", () => {
    const router = createMemoryRouter(
      [
        {
          id: "root",
          path: "*",
          element: (
            <AdminLayout>
              <h1>话题管理</h1>
            </AdminLayout>
          ),
        },
      ],
      {
        initialEntries: ["/admin/topics"],
        hydrationData: { loaderData: { root: { zones: [], user: null } } },
      },
    );
    const html = renderToString(<RouterProvider router={router} />);

    expect(html).toContain('data-admin-shell="true"');
    expect(html).toMatch(/<main[^>]*class="[^"]*min-w-0/);
    expect(html).toContain('aria-label="后台导航"');
    expect(html).toContain("打开后台导航");
    expect(html).toContain('aria-current="page"');
  });

  it("keeps one auth page h1 and uses card titles as section headings", () => {
    render(
      <MemoryRouter>
        <AuthShell eyebrow="WELCOME" title="回到社区" description="登录说明">
          <CardHeader>
            <CardTitle>
              <h2>登录</h2>
            </CardTitle>
          </CardHeader>
        </AuthShell>
      </MemoryRouter>,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("回到社区");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("登录");
  });
});

describe("导航当前项", () => {
  it("uses the contained navigation structure and keeps one destination current with a query string", () => {
    const router = createMemoryRouter(
      [
        {
          id: "root",
          path: "*",
          element: (
            <AdminLayout>
              <h1>话题管理</h1>
            </AdminLayout>
          ),
        },
      ],
      {
        initialEntries: ["/admin/topics?status=open&page=2"],
        hydrationData: { loaderData: { root: { zones: [], user: null } } },
      },
    );
    const { container } = render(<RouterProvider router={router} />);
    const navigation = screen.getByRole("navigation", { name: "后台导航" });
    expect(within(navigation).getByRole("link", { name: "话题管理" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(navigation).getAllByRole("link")).toHaveLength(3);
    expect(within(navigation).queryByRole("link", { name: "概览" })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: "用户管理" })).not.toBeInTheDocument();
    expect(container.querySelector("[data-admin-shell]")).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="card"] nav[aria-label="后台导航"]'),
    ).toBeInTheDocument();
  });

  it("opens the shared navigation in the mobile Sheet", async () => {
    const user = userEvent.setup();
    const desktopWidth = window.innerWidth;
    window.innerWidth = 375;
    const router = createMemoryRouter(
      [
        {
          id: "root",
          path: "*",
          element: (
            <AdminLayout>
              <h1>话题管理</h1>
            </AdminLayout>
          ),
        },
      ],
      {
        initialEntries: ["/admin/topics?status=open"],
        hydrationData: { loaderData: { root: { zones: [], user: null } } },
      },
    );
    const view = render(<RouterProvider router={router} />);

    await user.click(screen.getByRole("button", { name: "打开后台导航" }));
    const dialog = await screen.findByRole("dialog", { name: "后台导航" });
    const navigation = within(dialog).getByRole("navigation", { name: "后台导航" });
    expect(within(navigation).getByRole("link", { name: "话题管理" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    view.unmount();
    window.innerWidth = desktopWidth;
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
