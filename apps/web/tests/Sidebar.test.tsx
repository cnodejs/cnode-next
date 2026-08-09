import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { Sidebar } from "~/components/Sidebar";

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock("~/lib/api-client", () => ({
  apiFetch: mocks.apiFetch,
}));

const sidebarData = {
  latest_replies: [{ id: "reply-1", topic_id: "topic-1", topic_title: "最近讨论" }],
  no_reply_topics: [{ id: "topic-2", title: "等待回复" }],
  top_users: [{ id: "user-1", loginname: "alice", score: 100 }],
  partners: [],
  resources: [],
};

describe("home Sidebar", () => {
  beforeEach(() => {
    mocks.apiFetch.mockReset().mockResolvedValue({
      success: true,
      data: sidebarData,
    });
  });

  it("uses a cooperation entry and places the leaderboard after latest replies", async () => {
    const { container } = render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    const sidebar = container.querySelector("aside")!;
    expect(sidebar).toHaveClass("gap-5", "md:gap-6");
    expect(screen.getByRole("link", { name: "了解合作方式" })).toHaveAttribute(
      "href",
      "/about#cooperation",
    );

    const latestReplies = await screen.findByText("最新回复");
    const leaderboard = screen.getByText("积分榜");
    const unanswered = screen.getByText("无人回复的话题");

    expect(
      latestReplies.compareDocumentPosition(leaderboard) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      leaderboard.compareDocumentPosition(unanswered) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("uses the same top-level rhythm while skeleton cards are replaced", async () => {
    let resolveRequest!: (value: { success: boolean; data: typeof sidebarData }) => void;
    mocks.apiFetch.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const { container } = render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    const sidebar = container.querySelector("aside")!;
    expect(sidebar).toHaveClass("gap-5", "md:gap-6");
    expect(sidebar.querySelectorAll(":scope > [data-slot=card]")).toHaveLength(5);
    expect(sidebar.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(12);

    resolveRequest({ success: true, data: sidebarData });
    await screen.findByText("最新回复");

    await waitFor(() =>
      expect(sidebar.querySelector('[data-slot="skeleton"]')).not.toBeInTheDocument(),
    );
    expect(sidebar.querySelectorAll(":scope > [data-slot=card]")).toHaveLength(5);
    expect(
      Array.from(sidebar.querySelectorAll('[data-slot="card-title"]')).map((title) =>
        title.textContent?.trim(),
      ),
    ).toEqual(["社区合作", "最新回复", "积分榜", "无人回复的话题", "生态资源"]);
  });

  it("replaces cooperation with the selected topic explanation", async () => {
    render(
      <MemoryRouter>
        <Sidebar tab="tech" />
      </MemoryRouter>,
    );

    expect(screen.getByText("技术")).toBeInTheDocument();
    expect(screen.getByText(/讨论 Node.js、JavaScript 框架/)).toBeInTheDocument();
    expect(screen.queryByText("社区合作")).not.toBeInTheDocument();
    expect(await screen.findByText("最新回复")).toBeInTheDocument();
  });

  it("keeps cooperation on the good view", () => {
    render(
      <MemoryRouter>
        <Sidebar tab="good" />
      </MemoryRouter>,
    );

    expect(screen.getByText("社区合作")).toBeInTheDocument();
    expect(screen.queryByText(/由社区管理团队选出/)).not.toBeInTheDocument();
  });
});
