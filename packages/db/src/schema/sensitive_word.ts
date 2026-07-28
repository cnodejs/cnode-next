import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const sensitiveWords = pgTable("sensitive_words", {
  id: serial("id").primaryKey(),
  word: text("word").notNull().unique(),
  category: text("category"),
  hitCount: integer("hit_count").default(0),
  createAt: timestamp("create_at").defaultNow(),
});
