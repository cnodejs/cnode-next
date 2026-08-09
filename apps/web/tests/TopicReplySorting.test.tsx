import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryRouter,
  RouterProvider,
  useLoaderData,
  useLocation,
} from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock("~/lib/api-client", () => ({
  apiFetch: mocks.apiFetch,
  getCurrentUser: vi.fn(),
}));
vi.mock("~/components/TurnstileWidget", () => ({
  TurnstileWidget: () => null,
  getTurnstileToken: () => "test-token",
}));
vi.mock("~/components/MarkdownEditor", () => ({
  MarkdownEditor: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea
      aria-label="回复内容"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));
import {
  focusReplyElement,
  orderRepliesForDisplay,
  ReplySection,
  resolveReplySort,
} from "~/routes/topic.$tid";

const canonicalReplies = [
  {
    id: "101",
    content: "first",
    create_at: "2026-08-09T10:00:00.000Z",
    author: { loginname: "alice", avatar_url: "" },
    ups: [],
    reply_to: null,
  },
  {
    id: "102",
    content: "second",
    create_at: "2026-08-09T11:00:00.000Z",
    author: { loginname: "bob", avatar_url: "" },
    ups: [],
    reply_to: {
      id: "101",
      author: { loginname: "alice", avatar_url: "" },
      content_excerpt: "first",
    },
  },
];

function ReplyHarness() {
  const location = useLocation();
  const replySort = resolveReplySort(new URLSearchParams(location.search).get("reply_sort"));
  return (
    <ReplySection
      replies={orderRepliesForDisplay(canonicalReplies, replySort)}
      replySort={replySort}
      topicId="42"
      currentUser={null}
    />
  );
}

function LoadedReplyHarness() {
  const { replies, replySort } = useLoaderData<{
    replies: ReturnType<typeof orderRepliesForDisplay<(typeof canonicalReplies)[number]>>;
    replySort: "newest" | "oldest";
  }>();
  return (
    <ReplySection
      replies={replies}
      replySort={replySort}
      topicId="42"
      currentUser={{ loginname: "alice" }}
    />
  );
}

function renderReplies(initialEntry = "/topic/42") {
  const router = createMemoryRouter([{ path: "/topic/42", element: <ReplyHarness /> }], {
    initialEntries: [initialEntry],
  });
  const rendered = render(<RouterProvider router={router} />);
  return { ...rendered, router };
}

function renderedReplyIds(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-reply-id]")).map(
    (element) => element.dataset.replyId,
  );
}

describe("话题回复排序", () => {
  beforeEach(() => mocks.apiFetch.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("defaults invalid and missing values to newest while accepting oldest", () => {
    expect(resolveReplySort(null)).toBe("newest");
    expect(resolveReplySort("newest")).toBe("newest");
    expect(resolveReplySort("unexpected")).toBe("newest");
    expect(resolveReplySort("oldest")).toBe("oldest");
  });

  it("keeps canonical floors stable without mutating the source array", () => {
    const originalIds = canonicalReplies.map((reply) => reply.id);
    const newest = orderRepliesForDisplay(canonicalReplies, "newest");
    const oldest = orderRepliesForDisplay(canonicalReplies, "oldest");

    expect(newest.map(({ reply, floor }) => [reply.id, floor])).toEqual([
      ["102", 2],
      ["101", 1],
    ]);
    expect(oldest.map(({ reply, floor }) => [reply.id, floor])).toEqual([
      ["101", 1],
      ["102", 2],
    ]);
    expect(canonicalReplies.map((reply) => reply.id)).toEqual(originalIds);
  });

  it("renders newest first and switches URL, DOM order, floors, and anchors", async () => {
    const user = userEvent.setup();
    const { container, router } = renderReplies("/topic/42?view=compact#101");
    const sort = screen.getByRole("combobox", { name: "回复排序方式" });

    expect(sort).toHaveTextContent("最新优先");
    expect(renderedReplyIds(container)).toEqual(["102", "101"]);
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /引用 alice/ })).toHaveAttribute("href", "#101");

    sort.focus();
    expect(sort).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    await user.click(await screen.findByRole("option", { name: "最早优先" }));

    expect(router.state.location.search).toBe("?view=compact&reply_sort=oldest");
    expect(router.state.location.hash).toBe("#101");
    expect(renderedReplyIds(container)).toEqual(["101", "102"]);

    sort.focus();
    await user.keyboard("{ArrowDown}");
    await user.click(await screen.findByRole("option", { name: "最新优先" }));
    expect(router.state.location.search).toBe("?view=compact");
    expect(renderedReplyIds(container)).toEqual(["102", "101"]);
  });

  it("renders the empty state with an operable sort control", () => {
    const router = createMemoryRouter(
      [
        {
          path: "/topic/42",
          element: (
            <ReplySection
              replies={[]}
              replySort="newest"
              topicId="42"
              currentUser={null}
            />
          ),
        },
      ],
      { initialEntries: ["/topic/42"] },
    );
    render(<RouterProvider router={router} />);

    expect(screen.getByText("暂无回复，成为第一个参与讨论的人。")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "回复排序方式" })).toBeEnabled();
  });

  it("focuses a submitted reply with reduced-motion aware scrolling", () => {
    const target = document.createElement("div");
    target.id = "new-reply";
    target.tabIndex = -1;
    document.body.append(target);
    const scrollIntoView = vi.spyOn(target, "scrollIntoView");
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);

    expect(focusReplyElement("new-reply")).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
    expect(target).toHaveFocus();
    expect(focusReplyElement("missing-reply")).toBe(false);

    target.remove();
  });

  it.each([
    {
      label: "newest",
      initialEntry: "/topic/42",
      expectedSearch: "",
      expectedIds: ["103", "102", "101"],
    },
    {
      label: "oldest",
      initialEntry: "/topic/42?reply_sort=oldest",
      expectedSearch: "?reply_sort=oldest",
      expectedIds: ["101", "102", "103"],
    },
  ])(
    "revalidates and locates a newly submitted reply in $label order",
    async ({ initialEntry, expectedSearch, expectedIds }) => {
    const user = userEvent.setup();
    let replies = [...canonicalReplies];
    mocks.apiFetch.mockImplementation(async () => {
      replies = [
        ...replies,
        {
          id: "103",
          content: "new reply",
          create_at: "2026-08-09T12:00:00.000Z",
          author: { loginname: "alice", avatar_url: "" },
          ups: [],
          reply_to: null,
        },
      ];
      return { success: true, reply_id: "103" };
    });
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    const scrollIntoView = vi
      .spyOn(Element.prototype, "scrollIntoView")
      .mockImplementation(() => {});
    const router = createMemoryRouter(
      [
        {
          path: "/topic/42",
          loader: ({ request }) => {
            const replySort = resolveReplySort(
              new URL(request.url).searchParams.get("reply_sort"),
            );
            return { replies: orderRepliesForDisplay(replies, replySort), replySort };
          },
          element: <LoadedReplyHarness />,
        },
      ],
      { initialEntries: [initialEntry] },
    );
    const { container } = render(<RouterProvider router={router} />);

    fireEvent.change(await screen.findByRole("textbox", { name: "回复内容" }), {
      target: { value: "new reply" },
    });
    await user.click(container.querySelector<HTMLButtonElement>('button[type="submit"]')!);

    await waitFor(() => expect(router.state.location.hash).toBe("#103"));
    expect(router.state.location.search).toBe(expectedSearch);
    expect(renderedReplyIds(container)).toEqual(expectedIds);
    expect(document.getElementById("103")).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(screen.getByRole("textbox", { name: "回复内容" })).toHaveValue("");
    },
  );
});
