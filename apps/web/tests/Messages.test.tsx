import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Messages, { loader } from "~/routes/my.messages";

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  fetchUnread: vi.fn(),
  requireUser: vi.fn(),
  setUnreadCount: vi.fn(),
}));

vi.mock("~/lib/api-client", () => ({ apiFetch: mocks.apiFetch }));
vi.mock("~/lib/auth", () => ({ requireUser: mocks.requireUser }));
vi.mock("~/components/Layout", () => ({ Layout: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("~/lib/stores/auth-store", () => ({
  useAuthStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ fetchUnread: mocks.fetchUnread, setUnreadCount: mocks.setUnreadCount }),
}));

function makeMessage(id: string, content: string, hasRead = false) {
  return {
    id,
    type: "reply",
    has_read: hasRead,
    create_at: "2026-08-05T00:00:00.000Z",
    author: { loginname: "alice", avatar_url: "" },
    topic: { id: "2", title: "Markdown 摘要" },
    reply: { id: "3", content },
  };
}

function renderMessages(readMsgs: unknown[], unreadMsgs: unknown[]) {
  const routeProps = { loaderData: { readMsgs, unreadMsgs }, params: {}, matches: [] } as any;
  const router = createMemoryRouter(
    [{ path: "/my/messages", element: <Messages {...routeProps} /> }],
    { initialEntries: ["/my/messages"] },
  );
  return render(<RouterProvider router={router} />);
}

function messageGroup(title: string) {
  const card = screen.getByText(title).closest('[data-slot="card"]');
  if (!card) throw new Error(`Missing ${title} message group`);
  return within(card as HTMLElement);
}

describe("messages page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ id: 1 });
  });

  it("requests raw message content from the loader", async () => {
    mocks.apiFetch.mockResolvedValue({
      success: true,
      data: { has_read_messages: [], hasnot_read_messages: [] },
    });

    await loader({ request: new Request("http://localhost/my/messages", { headers: { cookie: "session=1" } }) } as never);

    expect(mocks.apiFetch).toHaveBeenCalledWith("/api/v1/messages?mdrender=false", {
      headers: { cookie: "session=1" },
    });
  });

  it("shows compact plain-text summaries in unread and read groups", () => {
    renderMessages(
      [makeMessage("read", "[文档](https://example.com) 和 `pnpm test`", true)],
      [makeMessage("unread", "<p>不错哦</p>")],
    );

    expect(messageGroup("新消息").getByText("不错哦")).toBeInTheDocument();
    expect(messageGroup("过往消息").getByText("文档 和 pnpm test")).toBeInTheDocument();
    expect(screen.queryByText(/<p>|<\/p>/)).not.toBeInTheDocument();
  });

  it("keeps the mark-all action readable against the brand header", () => {
    renderMessages([], [makeMessage("unread", "新消息")]);

    expect(screen.getByRole("button", { name: "全部已读" })).toHaveClass(
      "bg-secondary",
      "text-secondary-foreground",
    );
  });

  it("omits empty summaries and limits long content", () => {
    renderMessages(
      [makeMessage("empty", "   ", true)],
      [makeMessage("long", "字".repeat(170))],
    );

    expect(document.querySelectorAll('[data-slot="item-description"]')).toHaveLength(1);
    expect(messageGroup("新消息").getByText(`${"字".repeat(160)}…`)).toBeInTheDocument();
  });

  it("preserves the summary when a message moves to the read group", async () => {
    mocks.apiFetch.mockResolvedValue({ success: true });
    renderMessages([], [makeMessage("moving", "<p>[不错哦](https://example.com)</p>")]);

    expect(messageGroup("新消息").getByText("不错哦")).toBeInTheDocument();
    await userEvent.click(messageGroup("新消息").getByRole("button", { name: "标记已读" }));

    await waitFor(() => expect(messageGroup("新消息").queryByText("不错哦")).not.toBeInTheDocument());
    expect(messageGroup("过往消息").getByText("不错哦")).toBeInTheDocument();
    expect(screen.queryByText(/<p>|<\/p>/)).not.toBeInTheDocument();
  });
});
