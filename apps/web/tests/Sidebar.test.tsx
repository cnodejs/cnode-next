import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "~/components/Sidebar";

vi.mock("~/lib/api-client", () => ({
  apiFetch: vi.fn().mockResolvedValue({
    success: true,
    data: {
      latest_replies: [{ id: "reply-1", topic_id: "topic-1", topic_title: "最近讨论" }],
      no_reply_topics: [{ id: "topic-2", title: "等待回复" }],
      top_users: [{ id: "user-1", loginname: "alice", score: 100 }],
      partners: [],
      resources: [],
    },
  }),
}));

describe("home Sidebar", () => {
  it("uses a cooperation entry and places the leaderboard after latest replies", async () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "了解合作方式" })).toHaveAttribute("href", "/about#cooperation");

    const latestReplies = await screen.findByText("最新回复");
    const leaderboard = screen.getByText("积分榜");
    const unanswered = screen.getByText("无人回复的话题");

    expect(latestReplies.compareDocumentPosition(leaderboard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(leaderboard.compareDocumentPosition(unanswered) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
