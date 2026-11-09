import { Hono } from "hono";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
import type { AuthVars } from "../src/middleware/auth";

const mocks = vi.hoisted(() => ({
  incrementHitCount: vi.fn(),
  topicCreate: vi.fn(),
  topicUpdate: vi.fn(),
  replyCreate: vi.fn(),
  replyUpdate: vi.fn(),
}));

vi.mock("../src/lib/db", () => ({
  getDb: () => ({
    select: () => ({
      from: async () => [{ id: 1, word: "科学", category: "strict" }],
    }),
    update: () => ({
      set: () => ({ where: mocks.incrementHitCount }),
    }),
  }),
  settingQueries: { get: vi.fn(async (_key: string, fallback: string) => fallback) },
  topicQueries: {
    getById: vi.fn(async (id: number) => ({
      id,
      authorId: 1,
      tab: "share",
      lock: false,
      deleted: false,
    })),
    newAndSave: mocks.topicCreate,
    updateTopic: mocks.topicUpdate,
  },
  userQueries: {
    getById: vi.fn(),
    getByToken: vi.fn(),
  },
  replyQueries: {
    getById: vi.fn(async (id: number) => ({
      id,
      topicId: 42,
      authorId: 1,
      deleted: false,
    })),
    createWithAggregates: mocks.replyCreate,
    updateContent: mocks.replyUpdate,
  },
  jobMetaQueries: { upsert: vi.fn() },
  roleQueries: { listByUserId: vi.fn(async () => []) },
}));

vi.mock("../src/lib/score", () => ({ incrementScoreAndTopicCount: vi.fn() }));
vi.mock("../src/lib/at", () => ({ sendMessageToMentionUsers: vi.fn() }));
vi.mock("../src/lib/message", () => ({
  sendReplyMessage: vi.fn(),
  sendReply2Message: vi.fn(),
}));
vi.mock("../src/lib/penalty", () => ({ ensureMuteNotExpired: vi.fn(async (user) => user) }));
vi.mock("../src/lib/turnstile", () => ({
  requestIp: vi.fn(),
  verifyTurnstile: vi.fn(async () => true),
}));
vi.mock("../src/middleware/rate-limit", () => ({
  perUserPerDaySetting: vi.fn(() => async (_c: unknown, next: () => Promise<void>) => next()),
}));

import { replyRoutes } from "../src/routes/reply";
import { topicRoutes } from "../src/routes/topic";

const user = {
  id: 1,
  loginname: "moderation-route-user",
  createAt: new Date("2020-01-01"),
  replyCount: 10,
  isMuted: false,
  isBlock: false,
};

function createApp() {
  const app = new Hono<{ Variables: AuthVars }>();
  app.use("*", async (c, next) => {
    c.set("user", user as AuthVars["user"]);
    c.set("isLogin", true);
    c.set("isAdmin", false);
    c.set("isMod", false);
    c.set("roles", []);
    await next();
  });
  app.route("/", topicRoutes);
  app.route("/", replyRoutes);
  return app;
}

async function post(path: string, body: Record<string, unknown>) {
  return createApp().request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("moderation write boundaries", () => {
  test("topic creation returns the existing 422 shape before persistence", async () => {
    const response = await post("/topics", {
      title: "合法的话题标题",
      tab: "share",
      content: "科 测试 学",
    });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error_msg: "内容包含敏感词: 科学",
    });
    expect(mocks.topicCreate).not.toHaveBeenCalled();
    expect(mocks.incrementHitCount).toHaveBeenCalledTimes(1);
  });

  test("topic editing returns the existing 422 shape before persistence", async () => {
    const response = await post("/topics/update", {
      topic_id: "42",
      title: "合法的话题标题",
      tab: "share",
      content: "科1学",
    });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error_msg: "内容包含敏感词: 科学",
    });
    expect(mocks.topicUpdate).not.toHaveBeenCalled();
  });

  test("reply creation returns the existing 422 shape before persistence", async () => {
    const response = await post("/topic/42/replies", { content: "科🙂学" });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error_msg: "回复内容包含敏感词: 科学",
    });
    expect(mocks.replyCreate).not.toHaveBeenCalled();
  });

  test("reply editing returns the existing 422 shape before persistence", async () => {
    const response = await post("/reply/7/edit", { content: "科a学" });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error_msg: "回复内容包含敏感词: 科学",
    });
    expect(mocks.replyUpdate).not.toHaveBeenCalled();
  });
});
