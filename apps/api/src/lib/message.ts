import { getDb } from "./db";
import { messages } from "@cnode/db";
import type { MessageDTO } from "@cnode/shared";
import { eq, and, desc, inArray } from "drizzle-orm";
import { userQueries, topicQueries, replyQueries } from "./db";

export async function sendReplyMessage(
  masterId: number,
  authorId: number,
  topicId: number,
  replyId: number,
) {
  if (masterId === authorId) return;

  const db = getDb();
  await db.insert(messages).values({
    type: "reply",
    masterId,
    authorId,
    topicId,
    replyId,
    createAt: new Date().toISOString(),
  });
}

export async function sendReply2Message(
  masterId: number,
  authorId: number,
  topicId: number,
  replyId: number,
) {
  if (masterId === authorId) return;

  const db = getDb();
  await db.insert(messages).values({
    type: "reply2",
    masterId,
    authorId,
    topicId,
    replyId,
    createAt: new Date().toISOString(),
  });
}

export async function sendAtMessage(
  masterId: number,
  authorId: number,
  topicId: number,
  replyId: number,
) {
  if (masterId === authorId) return;

  const db = getDb();
  await db.insert(messages).values({
    type: "at",
    masterId,
    authorId,
    topicId,
    replyId,
    createAt: new Date().toISOString(),
  });
}

export async function getMessageRelations(msg: typeof messages.$inferSelect) {
  const [author, topic, reply] = await Promise.all([
    userQueries.getById(msg.authorId),
    msg.topicId ? topicQueries.getById(msg.topicId) : null,
    msg.replyId ? replyQueries.getById(msg.replyId) : null,
  ]);

  return {
    ...msg,
    author,
    topic,
    reply,
    isInvalid: !author || !topic,
  };
}

export async function getMessagesCount(userId: number) {
  const db = getDb();
  const result = await db
    .select()
    .from(messages)
    .where(and(eq(messages.masterId, userId), eq(messages.hasRead, 0)));
  return result.length;
}

export async function getReadMessagesByUserId(userId: number) {
  const db = getDb();
  return db
    .select()
    .from(messages)
    .where(and(eq(messages.masterId, userId), eq(messages.hasRead, 1)))
    .orderBy(desc(messages.createAt))
    .limit(20);
}

export async function getUnreadMessagesByUserId(userId: number) {
  const db = getDb();
  return db
    .select()
    .from(messages)
    .where(and(eq(messages.masterId, userId), eq(messages.hasRead, 0)))
    .orderBy(desc(messages.createAt));
}

export async function updateMessagesToRead(userId: number, msgIds: number[]) {
  if (msgIds.length === 0) return;
  const db = getDb();
  await db
    .update(messages)
    .set({ hasRead: 1 })
    .where(and(eq(messages.masterId, userId), inArray(messages.id, msgIds)));
}

export async function updateOneMessageToRead(msgId: number) {
  const db = getDb();
  await db.update(messages).set({ hasRead: 1 }).where(eq(messages.id, msgId));
}
