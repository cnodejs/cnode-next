import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const mocks = vi.hoisted(() => ({
  userGetById: vi.fn(),
  topicGetById: vi.fn(),
  replyGetById: vi.fn(),
}));

vi.mock("../src/lib/db", () => ({
  getDb: vi.fn(),
  userQueries: { getById: mocks.userGetById },
  topicQueries: { getById: mocks.topicGetById },
  replyQueries: { getById: mocks.replyGetById },
}));

vi.mock("../src/lib/mail", () => ({
  sendAtNotifyMail: vi.fn(),
  sendReplyNotifyMail: vi.fn(),
}));

import { getMessageRelations } from "../src/lib/message";

const messageRow = {
  id: 1,
  type: "reply",
  masterId: 10,
  authorId: 20,
  topicId: 2,
  replyId: null,
  hasRead: false,
  createAt: new Date("2026-08-05T00:00:00.000Z"),
};

const actor = { id: 20, loginname: "alice", avatar: "https://example.com/alice.png" };
const topicAuthor = { id: 30, loginname: "bob", avatar: "https://example.com/bob.png" };
const topic = { id: 2, title: "话题标题", authorId: 30, lastReplyAt: null };

describe("getMessageRelations", () => {
  beforeEach(() => {
    mocks.userGetById.mockReset();
    mocks.topicGetById.mockReset();
    mocks.replyGetById.mockReset();
    mocks.userGetById.mockImplementation(async (id: number) => {
      if (id === actor.id) return actor;
      if (id === topicAuthor.id) return topicAuthor;
      return null;
    });
    mocks.topicGetById.mockResolvedValue(topic);
    mocks.replyGetById.mockResolvedValue(null);
  });

  it("attaches the topic author so /messages can render it", async () => {
    const relations = await getMessageRelations(messageRow);

    expect(relations.author).toEqual(actor);
    expect(relations.topic?.author).toEqual(topicAuthor);
  });

  it("keeps topic null and flags invalid when the topic is missing", async () => {
    mocks.topicGetById.mockResolvedValue(null);

    const relations = await getMessageRelations({ ...messageRow, topicId: null });

    expect(relations.topic).toBeNull();
    expect(relations.isInvalid).toBe(true);
  });
});
