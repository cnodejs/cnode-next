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
  });
});
