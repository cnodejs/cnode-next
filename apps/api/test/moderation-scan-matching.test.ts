import { moderationHits, moderationScanJobs, replies, topics } from "@cnode/db";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";

const mocks = vi.hoisted(() => ({
  inserts: [] as Array<Record<string, unknown>>,
  incrementHits: vi.fn(),
}));

function queryResult(rows: unknown[]) {
  const query = {
    from(table: unknown) {
      if (table === moderationScanJobs) return queryResult([currentJob]);
      if (table === topics) return queryResult([topicRow]);
      if (table === replies) return queryResult([replyRow]);
      if (table === moderationHits) return queryResult([]);
      return queryResult([]);
    },
    where() {
      return query;
    },
    orderBy() {
      return query;
    },
    async limit() {
      return rows;
    },
  };
  return query;
}

const currentJob = {
  id: 7,
  scope: "all",
  mode: "historical",
  status: "running",
  cursorTopicId: 0,
  cursorReplyId: 0,
  batchSize: 10,
  keywordIds: null,
};

const topicRow = {
  id: 101,
  title: "标题科 空格 学结尾",
  content: "正文科🙂学结尾",
  authorId: 5,
};

const replyRow = {
  id: 202,
  topicId: 101,
  content: "回复科测试学结尾",
  authorId: 6,
};

const fakeDb = {
  select() {
    return queryResult([]);
  },
  insert(table: unknown) {
    expect(table).toBe(moderationHits);
    return {
      values(value: Record<string, unknown>) {
        mocks.inserts.push(value);
        return {
          onConflictDoNothing() {
            return {
              returning: async () => [{ id: mocks.inserts.length }],
            };
          },
        };
      },
    };
  },
  update() {
    return {
      set() {
        return {
          where: async () => undefined,
        };
      },
    };
  },
};

vi.mock("../src/lib/db", () => ({ getDb: () => fakeDb }));
vi.mock("../src/lib/moderation", async (importActual) => {
  const actual = await importActual<typeof import("../src/lib/moderation")>();
  return {
    ...actual,
    loadWords: vi.fn(async () => [{ id: 1, word: "科学" }]),
    incrementSensitiveWordHits: mocks.incrementHits,
  };
});
vi.mock("../src/lib/redis", () => ({ getRedis: vi.fn() }));

import { processScanBatch } from "../src/lib/moderation-scan";

beforeEach(() => {
  mocks.inserts.length = 0;
  mocks.incrementHits.mockClear();
});

describe("moderation scan matching", () => {
  test("uses strict matching for topic fields and replies without changing source state", async () => {
    const result = await processScanBatch(currentJob);

    expect(result).toMatchObject({ scanned: 2, hits: 3 });
    expect(mocks.inserts).toHaveLength(3);
    expect(mocks.inserts.map((entry) => entry.field)).toEqual(["title", "content", "content"]);
    expect(mocks.inserts.every((entry) => entry.status === "pending")).toBe(true);
    expect(mocks.inserts.map((entry) => entry.preview)).toEqual([
      expect.stringContaining("科 空格 学"),
      expect.stringContaining("科🙂学"),
      expect.stringContaining("科测试学"),
    ]);
    expect(topicRow).not.toHaveProperty("status");
    expect(topicRow).not.toHaveProperty("deleted");
    expect(replyRow).not.toHaveProperty("deleted");
    expect(mocks.incrementHits).toHaveBeenCalledTimes(3);
  });
});
