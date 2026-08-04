import { sql } from "drizzle-orm";
import { boolean, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { topics } from "./topic";
import { users } from "./user";

export const replies = pgTable(
  "replies",
  {
    id: serial("id").primaryKey(),
    content: text("content"),
    topicId: integer("topic_id")
      .notNull()
      .references(() => topics.id),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id),
    replyId: integer("reply_id"),
    deleted: boolean("deleted").default(false),
    createAt: timestamp("create_at").defaultNow(),
    updateAt: timestamp("update_at").defaultNow(),
  },
  (table) => ({
    activeTopicOrderIdx: index("replies_active_topic_order_idx")
      .on(table.topicId, table.createAt, table.id)
      .where(sql`${table.deleted} = false`),
  }),
);
