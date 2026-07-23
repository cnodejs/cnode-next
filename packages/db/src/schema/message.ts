import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import {
  pgTable,
  serial,
  text as pgText,
  boolean as pgBoolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type"), // reply | reply2 | at
  masterId: integer("master_id").notNull(),
  authorId: integer("author_id").notNull(),
  topicId: integer("topic_id"),
  replyId: integer("reply_id"),
  hasRead: integer("has_read").default(0),
  createAt: text("create_at").default(sql`(datetime('now'))`),
});

export const messagesPg = pgTable("messages", {
  id: serial("id").primaryKey(),
  type: pgText("type"),
  masterId: serial("master_id").notNull(),
  authorId: serial("author_id").notNull(),
  topicId: serial("topic_id"),
  replyId: serial("reply_id"),
  hasRead: pgBoolean("has_read").default(false),
  createAt: timestamp("create_at").defaultNow(),
});
