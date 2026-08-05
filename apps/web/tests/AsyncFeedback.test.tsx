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
});
