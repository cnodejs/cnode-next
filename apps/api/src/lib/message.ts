import { getDb } from "./db";
import { messages } from "@cnode/db";
import { eq, and, desc, inArray } from "drizzle-orm";
import { userQueries, topicQueries, replyQueries } from "./db";
import { boolEq, boolValue } from "./db-compat";
import { excerptMarkdown } from "./format";
import { sendAtNotifyMail, sendReplyNotifyMail } from "./mail";

function topicUrl(topicId: number, replyId?: number) {
  const base = process.env.CNODE_WEB_BASE_URL || "https://cnodejs.org";
  return `${base.replace(/\/+$/g, "")}/topic/${topicId}${replyId ? `#${replyId}` : ""}`;
}

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
    createAt: new Date(),
  });
  const [master, topic, reply] = await Promise.all([
    userQueries.getById(masterId),
    topicQueries.getById(topicId),
    replyQueries.getById(replyId),
  ]);
  if (master?.receiveReplyMail && master.email && topic) {
    await sendReplyNotifyMail(
      master.email,
      topic.title || "CNode 话题",
      excerptMarkdown(reply?.content || "", 160),
      topicUrl(topicId, replyId),
    );
  }
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
    createAt: new Date(),
  });
}

export async function sendAtMessage(masterId: number, authorId: number, topicId: number, replyId: number, content = "") {
  if (masterId === authorId) return;

  const db = getDb();
  await db.insert(messages).values({
    type: "at",
    masterId,
    authorId,
    topicId,
    replyId,
    createAt: new Date(),
  });
  const [master, topic] = await Promise.all([userQueries.getById(masterId), topicQueries.getById(topicId)]);
  if (master?.receiveAtMail && master.email && topic) {
    await sendAtNotifyMail(
      master.email,
      topic.title || "CNode 话题",
      excerptMarkdown(content, 160),
      topicUrl(topicId, replyId || undefined),
    );
  }
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
    .where(and(eq(messages.masterId, userId), boolEq(messages.hasRead, false)));
  return result.length;
}

export async function getReadMessagesByUserId(userId: number) {
  const db = getDb();
  return db
    .select()
    .from(messages)
    .where(and(eq(messages.masterId, userId), boolEq(messages.hasRead, true)))
    .orderBy(desc(messages.createAt))
    .limit(20);
}

export async function getUnreadMessagesByUserId(userId: number) {
  const db = getDb();
  return db
    .select()
    .from(messages)
    .where(and(eq(messages.masterId, userId), boolEq(messages.hasRead, false)))
    .orderBy(desc(messages.createAt));
}

export async function updateMessagesToRead(userId: number, msgIds: number[]) {
  if (msgIds.length === 0) return;
  const db = getDb();
  await db
    .update(messages)
    .set({ hasRead: boolValue(true) } as any)
    .where(and(eq(messages.masterId, userId), inArray(messages.id, msgIds)));
}

export async function updateOneMessageToRead(msgId: number) {
  const db = getDb();
  await db.update(messages).set({ hasRead: boolValue(true) } as any).where(eq(messages.id, msgId));
}
