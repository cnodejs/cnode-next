import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { Footer, Header } from "~/components/Layout";
import { CommandPalette } from "~/components/CommandPalette";

function renderWithRoot(element: React.ReactNode) {
  const router = createMemoryRouter(
    [{ id: "root", path: "/", element }],
    {
      initialEntries: ["/"],
      hydrationData: { loaderData: { root: { zones: [], user: null } } },
    },
  );
  return render(<RouterProvider router={router} />);
}

describe("公开导航收束", () => {
  it("uses a direct desktop About link instead of an About dropdown", () => {
    renderWithRoot(<Header />);

    expect(screen.getByRole("link", { name: "关于" })).toHaveAttribute("href", "/about");
    expect(screen.queryByRole("button", { name: "关于" })).not.toBeInTheDocument();
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

    expect(screen.getByRole("link", { name: "关于 CNode" })).toHaveAttribute("href", "/about");
    expect(screen.queryByText("新手指南")).not.toBeInTheDocument();
    expect(screen.queryByText("常见问题")).not.toBeInTheDocument();
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
  });
});
