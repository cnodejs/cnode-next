import { getDb } from "./db";
import { users } from "@cnode/db";
import { eq, sql } from "drizzle-orm";

export async function incrementScoreAndTopicCount(
  userId: number,
  score: number,
  topicCount: number,
) {
  const db = getDb();
  await db
    .update(users)
    .set({
      score: sql`${users.score} + ${score}`,
      topicCount: sql`${users.topicCount} + ${topicCount}`,
    })
    .where(eq(users.id, userId));
}

export async function incrementScoreAndReplyCount(
  userId: number,
  score: number,
  replyCount: number,
) {
  const db = getDb();
  await db
    .update(users)
    .set({
      score: sql`${users.score} + ${score}`,
      replyCount: sql`${users.replyCount} + ${replyCount}`,
    })
    .where(eq(users.id, userId));
}

export async function decrementScoreAndTopicCount(
  userId: number,
  score: number,
  topicCount: number,
) {
  const db = getDb();
  await db
    .update(users)
    .set({
      score: sql`case when ${users.score} - ${score} < 0 then 0 else ${users.score} - ${score} end`,
      topicCount: sql`case when ${users.topicCount} - ${topicCount} < 0 then 0 else ${users.topicCount} - ${topicCount} end`,
    })
    .where(eq(users.id, userId));
}

export async function decrementScoreAndReplyCount(
  userId: number,
  score: number,
  replyCount: number,
) {
  const db = getDb();
  await db
    .update(users)
    .set({
      score: sql`case when ${users.score} - ${score} < 0 then 0 else ${users.score} - ${score} end`,
      replyCount: sql`case when ${users.replyCount} - ${replyCount} < 0 then 0 else ${users.replyCount} - ${replyCount} end`,
    })
    .where(eq(users.id, userId));
}

export async function incrementCollectTopicCount(userId: number) {
  const db = getDb();
  await db
    .update(users)
    .set({ collectTopicCount: sql`${users.collectTopicCount} + 1` })
    .where(eq(users.id, userId));
}

export async function decrementCollectTopicCount(userId: number) {
  const db = getDb();
  await db
    .update(users)
    .set({
      collectTopicCount: sql`case when ${users.collectTopicCount} - 1 < 0 then 0 else ${users.collectTopicCount} - 1 end`,
    })
    .where(eq(users.id, userId));
}
