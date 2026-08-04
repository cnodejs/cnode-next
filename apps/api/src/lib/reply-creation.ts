import type { TopicReplyAggregate } from "./reply-deletion";

export interface ReplyForCreation {
  id: number;
  topicId: number;
  authorId: number;
  createAt: Date;
}

export interface ReplyCreationTransaction {
  lockTopic(topicId: number): Promise<"open" | "locked" | null>;
  insertReply(input: {
    content: string;
    topicId: number;
    authorId: number;
    replyId?: number;
  }): Promise<ReplyForCreation>;
  incrementAuthor(authorId: number): Promise<void>;
  readTopicAggregate(topicId: number): Promise<TopicReplyAggregate>;
  writeTopicAggregate(topicId: number, aggregate: TopicReplyAggregate): Promise<void>;
}

export interface ReplyCreationStore {
  transaction<T>(callback: (tx: ReplyCreationTransaction) => Promise<T>): Promise<T>;
}

export function createReplyWithStore(
  store: ReplyCreationStore,
  input: { content: string; topicId: number; authorId: number; replyId?: number },
) {
  return store.transaction(async (tx) => {
    const topicState = await tx.lockTopic(input.topicId);
    if (!topicState) return { status: "not_found" as const };
    if (topicState === "locked") return { status: "locked" as const };

    const reply = await tx.insertReply(input);
    await tx.incrementAuthor(input.authorId);
    const aggregate = await tx.readTopicAggregate(input.topicId);
    await tx.writeTopicAggregate(input.topicId, aggregate);
    return { status: "created" as const, reply };
  });
}
