import { describe, expect, test } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@cnode/db";
import { buildRepliesByTopicQuery, buildTopicsByQuery } from "../src/lib/db";
import {
  deleteReplyWithStore,
  type ReplyDeletionStore,
  type ReplyDeletionTransaction,
  type ReplyForDeletion,
  type TopicReplyAggregate,
} from "../src/lib/reply-deletion";
import {
  createReplyWithStore,
  type ReplyCreationStore,
  type ReplyCreationTransaction,
} from "../src/lib/reply-creation";

describe("reply query ordering", () => {
  test("uses create_at and stable id ascending for migrated and new replies", () => {
    const db = drizzle.mock({ schema });
    const { sql } = buildRepliesByTopicQuery(db, 42).toSQL();

    expect(sql).toContain('"replies"."topic_id" = $1');
    expect(sql).toContain('order by "replies"."create_at" asc, "replies"."id" asc');
  });

  test("sorts topic activity by last reply with create time fallback", () => {
    const db = drizzle.mock({ schema });
    const { sql } = buildTopicsByQuery(db, { deleted: false }).toSQL();

    expect(sql).toContain('coalesce("topics"."last_reply_at", "topics"."create_at") desc nulls last');
  });
});

interface TopicState extends TopicReplyAggregate {
  id: number;
}

class MemoryReplyDeletionStore implements ReplyDeletionStore {
  private queue = Promise.resolve();

  constructor(
    readonly replies: Array<ReplyForDeletion & { createAt: Date }>,
    readonly topic: TopicState,
    readonly author: { id: number; score: number; replyCount: number },
    readonly locked = false,
  ) {}

  async transaction<T>(callback: (tx: ReplyDeletionTransaction) => Promise<T>): Promise<T> {
    return this.runExclusive(() => callback(this.deletionTransaction()));
  }

  creationStore(): ReplyCreationStore {
    return {
      transaction: <T>(callback: (tx: ReplyCreationTransaction) => Promise<T>) =>
        this.runExclusive(() => callback(this.creationTransaction())),
    };
  }

  private async runExclusive<T>(callback: () => Promise<T>): Promise<T> {
    const previous = this.queue;
    let release!: () => void;
    this.queue = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      return await callback();
    } finally {
      release();
    }
  }

  private aggregate(topicId: number) {
    const active = this.replies
      .filter((reply) => reply.topicId === topicId && !reply.deleted)
      .sort((a, b) => a.createAt.getTime() - b.createAt.getTime() || a.id - b.id);
    const latest = active.at(-1);
    return {
      replyCount: active.length,
      lastReplyId: latest?.id ?? null,
      lastReplyAt: latest?.createAt ?? null,
    };
  }

  private deletionTransaction(): ReplyDeletionTransaction {
    return {
      lockReply: async (id) => this.replies.find((reply) => reply.id === id) || null,
      lockTopic: async (id) => id === this.topic.id,
      markDeleted: async (id) => {
        const reply = this.replies.find((candidate) => candidate.id === id && !candidate.deleted);
        if (!reply) return false;
        reply.deleted = true;
        return true;
      },
      decrementAuthor: async (id) => {
        if (id !== this.author.id) return;
        this.author.score = Math.max(0, this.author.score - 5);
        this.author.replyCount = Math.max(0, this.author.replyCount - 1);
      },
      readTopicAggregate: async (topicId) => this.aggregate(topicId),
      writeTopicAggregate: async (_id, aggregate) => { Object.assign(this.topic, aggregate); },
    };
  }

  private creationTransaction(): ReplyCreationTransaction {
    return {
      lockTopic: async (id) => id === this.topic.id ? (this.locked ? "locked" : "open") : null,
      insertReply: async (input) => {
        const reply = {
          id: Math.max(0, ...this.replies.map(({ id }) => id)) + 1,
          topicId: input.topicId,
          authorId: input.authorId,
          deleted: false,
          createAt: new Date("2026-02-01T00:00:00Z"),
        };
        this.replies.push(reply);
        return reply;
      },
      incrementAuthor: async (id) => {
        if (id !== this.author.id) return;
        this.author.score += 5;
        this.author.replyCount += 1;
      },
      readTopicAggregate: async (topicId) => this.aggregate(topicId),
      writeTopicAggregate: async (_id, aggregate) => { Object.assign(this.topic, aggregate); },
    };
  }
}

function storeWithReplies(ids: number[]) {
  const replies = ids.map((id, index) => ({
    id,
    topicId: 10,
    authorId: 7,
    deleted: false,
    createAt: new Date(`2026-01-0${index + 1}T00:00:00Z`),
  }));
  return new MemoryReplyDeletionStore(
    replies,
    { id: 10, replyCount: ids.length, lastReplyId: ids.at(-1) ?? null, lastReplyAt: replies.at(-1)?.createAt ?? null },
    { id: 7, score: 20, replyCount: ids.length },
  );
}

describe("atomic reply deletion", () => {
  test("deleting a non-latest reply preserves the latest aggregate", async () => {
    const store = storeWithReplies([1, 2, 3]);
    expect((await deleteReplyWithStore(store, 2, 7, false)).status).toBe("deleted");
    expect(store.topic).toMatchObject({ replyCount: 2, lastReplyId: 3 });
  });

  test("concurrent creation and deletion serialize topic aggregates", async () => {
    const store = storeWithReplies([1]);
    const [, createResult] = await Promise.all([
      deleteReplyWithStore(store, 1, 7, false),
      createReplyWithStore(store.creationStore(), {
        content: "new reply",
        topicId: 10,
        authorId: 7,
      }),
    ]);

    expect(createResult.status).toBe("created");
    if (createResult.status !== "created") throw new Error("reply was not created");
    const { reply: created } = createResult;
    expect(store.topic).toMatchObject({
      replyCount: 1,
      lastReplyId: created.id,
      lastReplyAt: created.createAt,
    });
    expect(store.author).toEqual({ id: 7, score: 20, replyCount: 1 });
  });

  test("rechecks the locked topic state inside the creation transaction", async () => {
    const base = storeWithReplies([]);
    const store = new MemoryReplyDeletionStore(base.replies, base.topic, base.author, true);

    await expect(createReplyWithStore(store.creationStore(), {
      content: "blocked reply",
      topicId: 10,
      authorId: 7,
    })).resolves.toEqual({ status: "locked" });
    expect(store.replies).toHaveLength(0);
    expect(store.topic.replyCount).toBe(0);
  });

  test("deleting the latest reply falls back to the previous active reply", async () => {
    const store = storeWithReplies([1, 2, 3]);
    await deleteReplyWithStore(store, 3, 7, false);
    expect(store.topic).toMatchObject({ replyCount: 2, lastReplyId: 2, lastReplyAt: store.replies[1].createAt });
  });

  test("deleting the only reply clears last reply metadata", async () => {
    const store = storeWithReplies([1]);
    await deleteReplyWithStore(store, 1, 7, false);
    expect(store.topic).toMatchObject({ replyCount: 0, lastReplyId: null, lastReplyAt: null });
  });

  test("concurrent repeated deletion applies side effects exactly once", async () => {
    const store = storeWithReplies([1]);
    const results = await Promise.all([
      deleteReplyWithStore(store, 1, 7, false),
      deleteReplyWithStore(store, 1, 7, false),
    ]);
    expect(results.map((result) => result.status)).toEqual(["deleted", "already_deleted"]);
    expect(store.author).toEqual({ id: 7, score: 15, replyCount: 0 });
    expect(store.topic.replyCount).toBe(0);
  });

  test("an unauthorized deletion has no side effects", async () => {
    const store = storeWithReplies([1]);
    expect((await deleteReplyWithStore(store, 1, 99, false)).status).toBe("forbidden");
    expect(store.replies[0].deleted).toBe(false);
    expect(store.author).toEqual({ id: 7, score: 20, replyCount: 1 });
    expect(store.topic.replyCount).toBe(1);
  });
});
