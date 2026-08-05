import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vite-plus/test";
import ZoneJobs, { loader } from "~/routes/zone.jobs";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock("~/lib/api-client", () => ({ apiFetch }));
vi.mock("~/components/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => children,
}));

describe("招聘页 SSR 状态", () => {
  it("returns filter state from the request URL for deterministic rendering", async () => {
    apiFetch
      .mockResolvedValueOnce({ success: true, data: [], total: 60 })
      .mockResolvedValueOnce({ success: true, data: { locations: ["上海"], remote_options: [] } });
    const data = await loader({
      request: new Request(
        "https://cnodejs.org/zone/jobs?location=%E4%B8%8A%E6%B5%B7&remote=hybrid&page=2",
      ),
    });

    expect(data.searchParams).toEqual({ location: "上海", remote: "hybrid" });
    expect(data.page).toBe(2);
  });

  it("does not change first-render HTML with browser location", () => {
    const loaderData = {
      jobs: [],
      total: 60,
      page: 2,
      limit: 20,
      locations: ["上海"],
      searchParams: { location: "上海", remote: "hybrid" },
    };
    const renderPage = () =>
      renderToString(
        <MemoryRouter
          initialEntries={["/zone/jobs?location=%E4%B8%8A%E6%B5%B7&remote=hybrid&page=2"]}
        >
          <ZoneJobs loaderData={loaderData} />
        </MemoryRouter>,
      );

    window.history.replaceState({}, "", "/unrelated?remote=remote");
    const first = renderPage();
    window.history.replaceState({}, "", "/another?location=Beijing");
    expect(renderPage()).toBe(first);
    expect(first).toContain("location=%E4%B8%8A%E6%B5%B7");
  });
});
