import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  type: text("type"),
  masterId: integer("master_id").notNull(),
  authorId: integer("author_id").notNull(),
  topicId: integer("topic_id"),
  replyId: integer("reply_id"),
  hasRead: boolean("has_read").default(false),
  createAt: timestamp("create_at").defaultNow(),
});
