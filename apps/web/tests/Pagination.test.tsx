import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { Pagination } from "~/components/Pagination";

describe("Pagination", () => {
  it("preserves search parameters when building page links", () => {
    render(
      <MemoryRouter>
        <Pagination
          page={2}
          total={100}
          limit={10}
          basePath="/admin/reports"
          searchParams={{ status: "pending", q: "node" }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "下一页 →" })).toHaveAttribute(
      "href",
      "/admin/reports?status=pending&q=node&page=3",
    );
    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("list")).toHaveClass("flex-wrap");
  });

  it("renders simple pagination without page numbers", () => {
    render(
      <MemoryRouter>
        <Pagination page={1} total={100} limit={10} basePath="/" variant="simple" />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link", { name: "1" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "下一页 →" })).toHaveAttribute("href", "/?page=2");
  });
});
