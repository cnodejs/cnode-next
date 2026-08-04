import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { and, eq } from "drizzle-orm";
import { replies, topics, users } from "@cnode/db";
import { getDb, replyQueries } from "../src/lib/db";

const runPostgresIntegration = process.env.CNODE_TEST_POSTGRES === "1" ? describe : describe.skip;

runPostgresIntegration("PostgreSQL reply transactions", () => {
  let db: ReturnType<typeof getDb>;
  let userId = 0;
  let topicId = 0;

  beforeAll(async () => {
    if (
      process.env.POSTGRES_HOST !== "127.0.0.1"
      || process.env.POSTGRES_PORT !== "65433"
      || process.env.POSTGRES_DB !== "cnode_validation"
      || process.env.POSTGRES_USER !== "cnode_validation"
    ) {
      throw new Error("PostgreSQL integration tests require the isolated validation database");
    }

    db = getDb();
    const suffix = `${process.pid}-${Date.now()}`;
    const [user] = await db
      .insert(users)
      .values({ loginname: `reply-validation-${suffix}`, email: `reply-validation-${suffix}@invalid.test` })
      .returning({ id: users.id });
    userId = user.id;

    const [topic] = await db
      .insert(topics)
      .values({ title: "Reply transaction validation", content: "isolated fixture", authorId: userId })
      .returning({ id: topics.id });
    topicId = topic.id;
  });

  afterAll(async () => {
    if (!userId || !topicId) return;
    await db.delete(replies).where(eq(replies.topicId, topicId));
    await db.delete(topics).where(eq(topics.id, topicId));
    await db.delete(users).where(eq(users.id, userId));
    await db.$client.end();
  });

  test("serializes concurrent creation and deletion into exact aggregates", async () => {
    const initial = await replyQueries.createWithAggregates("initial", topicId, userId);
    expect(initial.status).toBe("created");
    if (initial.status !== "created") throw new Error("initial reply was not created");

    const [deletion, creation] = await Promise.all([
      replyQueries.deleteWithAggregates(initial.reply.id, userId, false),
      replyQueries.createWithAggregates("replacement", topicId, userId),
    ]);

    expect(deletion.status).toBe("deleted");
    expect(creation.status).toBe("created");
    if (creation.status !== "created") throw new Error("replacement reply was not created");

    const [topic] = await db.select().from(topics).where(eq(topics.id, topicId));
    const activeReplies = await db
      .select()
      .from(replies)
      .where(and(eq(replies.topicId, topicId), eq(replies.deleted, false)));
    const [author] = await db.select().from(users).where(eq(users.id, userId));

    expect(activeReplies).toHaveLength(1);
    expect(topic).toMatchObject({
      replyCount: 1,
      lastReplyId: creation.reply.id,
      lastReplyAt: creation.reply.createAt,
    });
    expect(author).toMatchObject({ score: 5, replyCount: 1 });
  }, 30_000);

  test("applies repeated concurrent deletion side effects once", async () => {
    const [reply] = await db
      .select()
      .from(replies)
      .where(and(eq(replies.topicId, topicId), eq(replies.deleted, false)));
    const results = await Promise.all([
      replyQueries.deleteWithAggregates(reply.id, userId, false),
      replyQueries.deleteWithAggregates(reply.id, userId, false),
    ]);

    expect(results.map(({ status }) => status).sort()).toEqual(["already_deleted", "deleted"]);
    const [topic] = await db.select().from(topics).where(eq(topics.id, topicId));
    const [author] = await db.select().from(users).where(eq(users.id, userId));
    expect(topic).toMatchObject({ replyCount: 0, lastReplyId: null, lastReplyAt: null });
    expect(author).toMatchObject({ score: 0, replyCount: 0 });
  }, 30_000);

  test("rejects creation when the locked topic row is rechecked", async () => {
    await db.update(topics).set({ lock: true }).where(eq(topics.id, topicId));

    await expect(replyQueries.createWithAggregates("blocked", topicId, userId))
      .resolves.toEqual({ status: "locked" });

    const activeReplies = await db
      .select({ id: replies.id })
      .from(replies)
      .where(and(eq(replies.topicId, topicId), eq(replies.deleted, false)));
    expect(activeReplies).toHaveLength(0);
  }, 30_000);
});
