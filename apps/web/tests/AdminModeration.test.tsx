import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminMod from "~/routes/admin/mod";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock("~/lib/api-client", () => ({ apiFetch }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("~/components/AdminLayout", () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => children,
}));

const loaderData = {
  jobs: [{
    id: 12,
    scope: "all",
    mode: "historical",
    reason: "manual",
    status: "running",
    scannedCount: 40,
    hitCount: 3,
    pendingHitCount: 1,
    cursorTopicId: 30,
    cursorReplyId: 10,
  }],
  results: [{
    id: 8,
    scan_job_id: 12,
    type: "topic",
    target_id: 42,
    topic_id: 42,
    author_id: 5,
    field: "content",
    scanned_at: "2026-08-03",
    keywords: ["spam"],
    preview: "matched content preview",
  }],
  total: 1,
  summary: { by_type: { topic: 1, reply: 0 }, by_keyword: { spam: 1 } },
  page: 1,
  limit: 50,
  status: "pending",
  type: "",
  jobId: 0,
};

function renderRoute() {
  const router = createMemoryRouter(
    [{ path: "/admin/moderation", element: <AdminMod loaderData={loaderData} /> }],
    { initialEntries: ["/admin/moderation"] },
  );
  const view = render(<RouterProvider router={router} />);
  return { ...view, router };
}

describe("后台巡检工作流", () => {
  beforeEach(() => apiFetch.mockReset());

  it("renders scan jobs, queue summary, and hits with workflow primitives", () => {
    const { container } = renderRoute();

    expect(container.querySelector('[data-page-archetype="workflow"]')).toBeInTheDocument();
    expect(screen.getByText("任务 #12")).toBeInTheDocument();
    expect(screen.getByText("队列摘要")).toBeInTheDocument();
    expect(screen.getByRole("alert", { name: "" })).toHaveTextContent("matched content preview");
    expect(container.querySelectorAll('[data-slot="item"]')).toHaveLength(3);
  });

  it("requires confirmation before cancelling a running scan job", async () => {
    const user = userEvent.setup();
    renderRoute();

    await user.click(screen.getByRole("button", { name: "取消" }));
    expect(screen.getByRole("alertdialog", { name: "确认取消巡检任务" })).toHaveTextContent("任务 #12");
    expect(apiFetch).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "确认取消任务" }));
    expect(apiFetch).toHaveBeenCalledWith("/api/v1/admin/moderation/jobs/12/cancel", { method: "POST" });
  });

  it("requires confirmation before deleting a moderation hit", async () => {
    const user = userEvent.setup();
    renderRoute();

    await user.click(screen.getByRole("button", { name: "确认删除" }));
    expect(screen.getByRole("alertdialog", { name: "确认违规并删除命中内容" })).toHaveTextContent("话题 #42");
    expect(apiFetch).not.toHaveBeenCalled();
  });
});
