import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import {
  pgTable,
  serial,
  text as pgText,
  integer as pgInteger,
  boolean as pgBoolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./user";

export const topics = sqliteTable("topics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title"),
  content: text("content"),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id),
  tab: text("tab"),
  top: integer("top").default(0),
  good: integer("good").default(0),
  lock: integer("lock").default(0),
  status: text("status").default("published"), // draft | published | muted | deleted
  replyCount: integer("reply_count").default(0),
  visitCount: integer("visit_count").default(0),
  collectCount: integer("collect_count").default(0),
  lastReplyId: integer("last_reply_id"),
  lastReplyAt: text("last_reply_at"),
  archived: integer("archived").default(0),
  deleted: integer("deleted").default(0),
  createAt: text("create_at").default(sql`(datetime('now'))`),
  updateAt: text("update_at").default(sql`(datetime('now'))`),
});

export const topicsPg = pgTable("topics", {
  id: serial("id").primaryKey(),
  title: pgText("title"),
  content: pgText("content"),
  authorId: pgInteger("author_id").notNull(),
  tab: pgText("tab"),
  top: pgBoolean("top").default(false),
  good: pgBoolean("good").default(false),
  lock: pgBoolean("lock").default(false),
  status: pgText("status").default("published"),
  replyCount: pgInteger("reply_count").default(0),
  visitCount: pgInteger("visit_count").default(0),
  collectCount: pgInteger("collect_count").default(0),
  lastReplyId: pgInteger("last_reply_id"),
  lastReplyAt: timestamp("last_reply_at"),
  archived: pgBoolean("archived").default(false),
  deleted: pgBoolean("deleted").default(false),
  createAt: timestamp("create_at").defaultNow(),
  updateAt: timestamp("update_at").defaultNow(),
});
