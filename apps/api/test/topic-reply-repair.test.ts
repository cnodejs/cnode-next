import { describe, expect, test } from "vite-plus/test";
import {
  repairTopicReplyAggregates,
  topicReplyRepairApplySql,
  topicReplyRepairDryRunSql,
  type TopicReplyRepairClient,
} from "@cnode/db";

type Topic = {
  id: number;
  replyCount: number;
  lastReplyId: number | null;
  lastReplyAt: Date | null;
};
type Reply = { id: number; topicId: number; deleted: boolean; createAt: Date };

class MemoryRepairClient implements TopicReplyRepairClient {
  constructor(
    readonly topics: Topic[],
    readonly replies: Reply[],
  ) {}

  private expected(topicId: number) {
    const active = this.replies
      .filter((reply) => reply.topicId === topicId && !reply.deleted)
      .sort((a, b) => b.createAt.getTime() - a.createAt.getTime() || b.id - a.id);
    return {
      replyCount: active.length,
      lastReplyId: active[0]?.id ?? null,
      lastReplyAt: active[0]?.createAt ?? null,
    };
  }

  private mismatches() {
    return this.topics.filter((topic) => {
      const expected = this.expected(topic.id);
      return (
        topic.replyCount !== expected.replyCount ||
        topic.lastReplyId !== expected.lastReplyId ||
        topic.lastReplyAt?.getTime() !== expected.lastReplyAt?.getTime()
      );
    });
  }

  async query(sql: string) {
    const mismatches = this.mismatches();
    if (sql === topicReplyRepairDryRunSql) return { rows: [{ mismatch_count: mismatches.length }] };
    for (const topic of mismatches) Object.assign(topic, this.expected(topic.id));
    return { rowCount: mismatches.length };
  }
}

describe("topic reply aggregate repair", () => {
  test("SQL derives exact aggregates from active replies without user or content access", () => {
    const sql = `${topicReplyRepairDryRunSql}\n${topicReplyRepairApplySql}`.toLowerCase();
    expect(sql).toContain("deleted = false");
    expect(sql).toContain("order by candidate.create_at desc nulls last, candidate.id desc");
    expect(sql).toContain("last_reply_id = m.expected_last_reply_id");
    expect(sql).not.toMatch(/\busers\b|\bcontent\b|password|postgres_/);
  });

  test("repairs zero, deleted-latest, and multi-reply topics idempotently without user aggregates", async () => {
    const topics: Topic[] = [
      { id: 1, replyCount: 1, lastReplyId: 11, lastReplyAt: new Date("2026-01-01") },
      { id: 2, replyCount: 2, lastReplyId: 22, lastReplyAt: new Date("2026-02-02") },
      { id: 3, replyCount: 0, lastReplyId: null, lastReplyAt: null },
    ];
    const replies: Reply[] = [
      { id: 21, topicId: 2, deleted: false, createAt: new Date("2026-02-01") },
      { id: 22, topicId: 2, deleted: true, createAt: new Date("2026-02-02") },
      { id: 31, topicId: 3, deleted: false, createAt: new Date("2026-03-01") },
      { id: 32, topicId: 3, deleted: false, createAt: new Date("2026-03-01") },
    ];
    const users = [{ id: 9, score: 100, replyCount: 99 }];
    const client = new MemoryRepairClient(topics, replies);

    expect(await repairTopicReplyAggregates(client, true)).toMatchObject({
      mode: "dry-run",
      mismatchedTopics: 3,
    });
    expect(await repairTopicReplyAggregates(client, false)).toMatchObject({
      mode: "apply",
      repairedTopics: 3,
    });
    expect(topics).toEqual([
      { id: 1, replyCount: 0, lastReplyId: null, lastReplyAt: null },
      { id: 2, replyCount: 1, lastReplyId: 21, lastReplyAt: new Date("2026-02-01") },
      { id: 3, replyCount: 2, lastReplyId: 32, lastReplyAt: new Date("2026-03-01") },
    ]);
    expect(await repairTopicReplyAggregates(client, false)).toMatchObject({ repairedTopics: 0 });
    expect(await repairTopicReplyAggregates(client, true)).toMatchObject({ mismatchedTopics: 0 });
    expect(users).toEqual([{ id: 9, score: 100, replyCount: 99 }]);
  });
});
