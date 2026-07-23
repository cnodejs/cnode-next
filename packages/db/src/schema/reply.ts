import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import {
  pgTable,
  serial,
  text as pgText,
  boolean as pgBoolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./user";
import { topics } from "./topic";

export const replies = sqliteTable("replies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  content: text("content"),
  topicId: integer("topic_id")
    .notNull()
    .references(() => topics.id),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id),
  replyId: integer("reply_id"),
  deleted: integer("deleted").default(0),
  createAt: text("create_at").default(sql`(datetime('now'))`),
  updateAt: text("update_at").default(sql`(datetime('now'))`),
});

export const repliesPg = pgTable("replies", {
  id: serial("id").primaryKey(),
  content: pgText("content"),
  topicId: serial("topic_id").notNull(),
  authorId: serial("author_id").notNull(),
  replyId: serial("reply_id"),
  deleted: pgBoolean("deleted").default(false),
  createAt: timestamp("create_at").defaultNow(),
  updateAt: timestamp("update_at").defaultNow(),
});
