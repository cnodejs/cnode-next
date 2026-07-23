import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import {
  pgTable,
  serial,
  text as pgText,
  integer as pgInteger,
  timestamp,
} from "drizzle-orm/pg-core";

export const sensitiveWords = sqliteTable("sensitive_words", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  word: text("word").notNull().unique(),
  category: text("category"),
  hitCount: integer("hit_count").default(0),
  createAt: text("create_at").default(sql`(datetime('now'))`),
});

export const sensitiveWordsPg = pgTable("sensitive_words", {
  id: serial("id").primaryKey(),
  word: pgText("word").notNull().unique(),
  category: pgText("category"),
  hitCount: pgInteger("hit_count").default(0),
  createAt: timestamp("create_at").defaultNow(),
});
