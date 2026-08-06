import { afterEach, expect, test, vi } from "vite-plus/test";
import { userDetailSchema } from "@cnode/shared";
import app from "../src/app";
import { replyQueries, roleQueries, topicQueries, userQueries } from "../src/lib/db";

const originalAdmins = process.env.CNODE_ADMINS;

afterEach(() => {
  vi.restoreAllMocks();
  if (originalAdmins === undefined) delete process.env.CNODE_ADMINS;
  else process.env.CNODE_ADMINS = originalAdmins;
});

test("GET /api/v1/user/:loginname returns public profile and independent identities", async () => {
  process.env.CNODE_ADMINS = "alice";
  vi.spyOn(userQueries, "getByLoginName").mockResolvedValue({
    id: 1,
    loginname: "alice",
    avatar: "https://example.com/avatar.png",
    githubUsername: "alice-gh",
    location: "Hangzhou",
    url: "https://alice.example.com",
    signature: "Node.js developer",
    weibo: "should-not-leak",
    email: "alice@example.com",
    accessToken: "should-not-leak",
    createAt: new Date("2026-01-01T00:00:00.000Z"),
    score: 120,
    topicCount: 8,
    replyCount: 42,
    collectTopicCount: 5,
    isBlock: false,
    isMuted: false,
  } as any);
  vi.spyOn(topicQueries, "getByQuery").mockResolvedValue([]);
  vi.spyOn(replyQueries, "getByAuthorId").mockResolvedValue([]);
  vi.spyOn(roleQueries, "listByUserId").mockResolvedValue(["recruiter"]);

  const response = await app.request("/api/v1/user/alice");
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(userDetailSchema.safeParse(body.data).success).toBe(true);
  expect(body.data).toMatchObject({
    loginname: "alice",
    location: "Hangzhou",
    url: "https://alice.example.com",
    signature: "Node.js developer",
    identities: ["admin", "recruiter"],
    score: 120,
    topic_count: 8,
    reply_count: 42,
    collect_topic_count: 5,
  });
  expect(body.data).not.toHaveProperty("email");
  expect(body.data).not.toHaveProperty("weibo");
  expect(body.data).not.toHaveProperty("accessToken");
});

test("GET /api/v1/user/:loginname normalizes blank public fields and keeps governance states independent", async () => {
  vi.spyOn(userQueries, "getByLoginName").mockResolvedValue({
    id: 2,
    loginname: "bob",
    avatar: "",
    githubUsername: null,
    location: "   ",
    url: null,
    signature: "\t",
    createAt: new Date("2026-01-01T00:00:00.000Z"),
    score: 0,
    topicCount: 0,
    replyCount: 0,
    collectTopicCount: 0,
    isBlock: true,
    isMuted: false,
  } as any);
  vi.spyOn(topicQueries, "getByQuery").mockResolvedValue([]);
  vi.spyOn(replyQueries, "getByAuthorId").mockResolvedValue([]);
  vi.spyOn(roleQueries, "listByUserId").mockResolvedValue([]);

  const response = await app.request("/api/v1/user/bob");
  const body = await response.json();

  expect(body.data).toMatchObject({
    location: null,
    url: null,
    signature: null,
    identities: [],
    is_block: true,
    is_muted: false,
  });
  expect(userDetailSchema.safeParse(body.data).success).toBe(true);
});
