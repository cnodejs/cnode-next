import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./user";

export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  title: text("title"),
  content: text("content"),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id),
  tab: text("tab"),
  top: boolean("top").default(false),
  good: boolean("good").default(false),
  lock: boolean("lock").default(false),
  status: text("status").default("published"),
  replyCount: integer("reply_count").default(0),
  visitCount: integer("visit_count").default(0),
  collectCount: integer("collect_count").default(0),
  lastReplyId: integer("last_reply_id"),
  lastReplyAt: timestamp("last_reply_at"),
  archived: boolean("archived").default(false),
  deleted: boolean("deleted").default(false),
  createAt: timestamp("create_at").defaultNow(),
  updateAt: timestamp("update_at").defaultNow(),
});
