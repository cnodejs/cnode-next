export interface ReplyForDeletion {
  id: number;
  topicId: number;
  authorId: number;
  deleted: boolean | null;
}

export interface TopicReplyAggregate {
  replyCount: number;
  lastReplyId: number | null;
  lastReplyAt: Date | null;
}

export interface ReplyDeletionTransaction {
  lockReply(replyId: number): Promise<ReplyForDeletion | null>;
  lockTopic(topicId: number): Promise<boolean>;
  markDeleted(replyId: number): Promise<boolean>;
  decrementAuthor(authorId: number): Promise<void>;
  readTopicAggregate(topicId: number): Promise<TopicReplyAggregate>;
  writeTopicAggregate(topicId: number, aggregate: TopicReplyAggregate): Promise<void>;
}

export interface ReplyDeletionStore {
  transaction<T>(callback: (tx: ReplyDeletionTransaction) => Promise<T>): Promise<T>;
}

export type ReplyDeletionResult =
  | { status: "deleted"; reply: ReplyForDeletion }
  | { status: "not_found" | "already_deleted" | "forbidden" };

export function deleteReplyWithStore(
  store: ReplyDeletionStore,
  replyId: number,
  actorId: number,
  isAdmin: boolean,
): Promise<ReplyDeletionResult> {
  return store.transaction(async (tx) => {
    const reply = await tx.lockReply(replyId);
    if (!reply) return { status: "not_found" };
    if (reply.deleted) return { status: "already_deleted" };
    if (reply.authorId !== actorId && !isAdmin) return { status: "forbidden" };

    if (!(await tx.lockTopic(reply.topicId))) return { status: "not_found" };
    if (!(await tx.markDeleted(reply.id))) return { status: "already_deleted" };

    await tx.decrementAuthor(reply.authorId);
    const aggregate = await tx.readTopicAggregate(reply.topicId);
    await tx.writeTopicAggregate(reply.topicId, aggregate);
    return { status: "deleted", reply };
  });
}
