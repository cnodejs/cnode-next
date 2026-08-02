import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { TopicAuthorCard } from "~/routes/topic.$tid";
import { ReadingGrid } from "~/components/PageShell";

const author = { loginname: "alice", avatar_url: "" };
const profile = {
  loginname: "alice",
  avatar_url: "",
  identities: ["moderator", "recruiter"],
  signature: "Node.js developer",
  location: "Hangzhou",
  url: "https://alice.example.com",
  githubUsername: "alice-gh",
  score: 120,
  topic_count: 8,
  reply_count: 42,
  recent_topics: [{ id: "1", title: "不应显示的最近话题" }],
  recent_replies: [{ id: "2", title: "不应显示的最近参与" }],
};

function renderCard(value: any = profile) {
  return render(
    <MemoryRouter>
      <TopicAuthorCard author={author} profile={value} />
    </MemoryRouter>,
  );
}

describe("话题详情作者卡", () => {
  it("shows stable public profile data and totals without activity lists", () => {
    renderCard();

    expect(screen.getByLabelText("用户身份")).toHaveTextContent("版主");
    expect(screen.getByLabelText("用户身份")).toHaveTextContent("猎头");
    expect(screen.getByText("Node.js developer")).toBeInTheDocument();
    expect(screen.getByText("Hangzhou")).toBeInTheDocument();
    expect(screen.getByText("话题").parentElement).toHaveTextContent("8");
    expect(screen.getByText("回复").parentElement).toHaveTextContent("42");
    expect(screen.queryByText("不应显示的最近话题")).not.toBeInTheDocument();
    expect(screen.queryByText("不应显示的最近参与")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看用户主页" })).toHaveAttribute("href", "/user/alice");
  });

  it("falls back to the lightweight topic author", () => {
    renderCard(null);

    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.queryByLabelText("用户身份")).not.toBeInTheDocument();
    expect(screen.queryByText("积分")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看用户主页" })).toHaveAttribute("href", "/user/alice");
  });

  it("places author context between the topic body and replies in the mobile document order", () => {
    render(
      <ReadingGrid
        aside={<div data-testid="author-context">作者</div>}
        afterAside={<div data-testid="reply-flow">回复</div>}
      >
        <div data-testid="topic-body">正文</div>
      </ReadingGrid>,
    );

    const body = screen.getByTestId("topic-body");
    const context = screen.getByTestId("author-context");
    const replies = screen.getByTestId("reply-flow");
    expect(body.compareDocumentPosition(context) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(context.compareDocumentPosition(replies) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
