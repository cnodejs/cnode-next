import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthVars } from "../src/middleware/auth";

const message = {
  id: 1,
  type: "reply",
  hasRead: false,
  createAt: new Date("2026-08-05T00:00:00.000Z"),
  author: { loginname: "alice", avatar: "" },
  topic: {
    id: 2,
    title: "Markdown",
    lastReplyAt: null,
    author: { loginname: "bob", avatar: "" },
  },
  reply: {
    id: 3,
    content: "**不错哦**",
    createAt: new Date("2026-08-05T00:00:00.000Z"),
  },
};

const mocks = vi.hoisted(() => ({
  getMessageRelations: vi.fn(),
  getReadMessagesByUserId: vi.fn(),
  getUnreadMessagesByUserId: vi.fn(),
}));

vi.mock("../src/lib/message", () => ({
  getMessagesCount: vi.fn(),
  getMessageRelations: mocks.getMessageRelations,
  getReadMessagesByUserId: mocks.getReadMessagesByUserId,
  getUnreadMessagesByUserId: mocks.getUnreadMessagesByUserId,
  updateMessagesToRead: vi.fn(),
  updateOneMessageToRead: vi.fn(),
}));

import { messageRoutes } from "../src/routes/message";

function createApp() {
  const app = new Hono<{ Variables: AuthVars }>();
  app.use("*", async (c, next) => {
    c.set("user", { id: 10 } as AuthVars["user"]);
    await next();
  });
  app.route("/api/v1", messageRoutes);
  return app;
}

describe("message mdrender compatibility", () => {
  beforeEach(() => {
    mocks.getReadMessagesByUserId.mockResolvedValue([]);
    mocks.getUnreadMessagesByUserId.mockResolvedValue([message]);
    mocks.getMessageRelations.mockResolvedValue(message);
  });

  it.each(["/api/v1/messages", "/api/v1/messages?mdrender=true"])(
    "keeps rendered content for %s",
    async (path) => {
      const response = await createApp().request(path);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.hasnot_read_messages[0].reply.content).toBe("<p><strong>不错哦</strong></p>");
    },
  );

  it("returns raw content for explicit mdrender=false", async () => {
    const response = await createApp().request("/api/v1/messages?mdrender=false");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.hasnot_read_messages[0].reply.content).toBe("**不错哦**");
  });
});
