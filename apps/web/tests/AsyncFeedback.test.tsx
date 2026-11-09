import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { TurnstileWidget } from "~/components/TurnstileWidget";
import Search from "~/routes/search";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock("~/lib/api-client", () => ({ apiFetch }));
vi.mock("~/components/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => children,
}));

afterEach(() => {
  apiFetch.mockReset();
  delete window.turnstile;
});

describe("异步反馈", () => {
  function renderSearch(initialEntry = "/search") {
    const router = createMemoryRouter([{ path: "*", element: <Search /> }], {
      initialEntries: [initialEntry],
    });
    return { ...render(<RouterProvider router={router} />), router };
  }

  it("announces Turnstile readiness and verification", async () => {
    let options: Record<string, unknown> = {};
    window.turnstile = {
      render: vi.fn((_element, nextOptions) => {
        options = nextOptions;
        return "widget-id";
      }),
      remove: vi.fn(),
      reset: vi.fn(),
    };
    const router = createMemoryRouter([{ id: "root", path: "/", element: <TurnstileWidget /> }], {
      hydrationData: {
        loaderData: { root: { publicConfig: { turnstileSiteKey: "site-key" } } },
      },
    });
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("status")).toHaveTextContent("请完成人机验证");
    act(() => (options.callback as (token: string) => void)("verified-token"));
    expect(screen.getByRole("status")).toHaveTextContent("人机验证已完成");
  });

  it("preserves the query and offers retry after search failure", async () => {
    apiFetch.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({
      success: true,
      data: [],
    });
    render(
      <MemoryRouter initialEntries={["/search?q=node"]}>
        <Search />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("搜索失败，请重试");
    expect(screen.getByLabelText("搜索话题")).toHaveValue("node");
    await userEvent.click(screen.getByRole("button", { name: "重试" }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('未找到与 "node" 相关的内容')).toBeInTheDocument();
  });

  it.each(["keyboard", "button"])(
    "normalizes and submits a search with the %s path",
    async (submission) => {
      const user = userEvent.setup();
      apiFetch.mockResolvedValue({ success: true, data: [] });
      const { router } = renderSearch();
      const input = screen.getByRole("textbox", { name: "搜索话题" });

      await user.type(input, "  node js  ");
      if (submission === "keyboard") {
        await user.keyboard("{Enter}");
      } else {
        await user.click(screen.getByRole("button", { name: "搜索" }));
      }

      await waitFor(() =>
        expect(new URLSearchParams(router.state.location.search).get("q")).toBe("node js"),
      );
      await waitFor(() =>
        expect(apiFetch).toHaveBeenCalledWith(
          "/api/v1/search?q=node%20js&engine=local",
          expect.objectContaining({ signal: expect.any(AbortSignal) }),
        ),
      );
    },
  );

  it.each(["", "   "])("ignores an empty search query %p", async (query) => {
    const user = userEvent.setup();
    const { router } = renderSearch();
    const input = screen.getByRole("textbox", { name: "搜索话题" });

    if (query) await user.type(input, query);
    await user.keyboard("{Enter}");

    expect(router.state.location.pathname).toBe("/search");
    expect(router.state.location.search).toBe("");
    expect(apiFetch).not.toHaveBeenCalled();
    expect(input).toHaveValue(query);
    expect(input).toBeEnabled();
  });
});
