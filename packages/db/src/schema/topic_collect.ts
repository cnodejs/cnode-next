import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { pgTable, integer as pgInteger, timestamp, primaryKey as pgPrimaryKey } from "drizzle-orm/pg-core";

export const topicCollects = sqliteTable(
  "topic_collects",
  {
    userId: integer("user_id").notNull(),
    topicId: integer("topic_id").notNull(),
    createAt: text("create_at").default(sql`(datetime('now'))`),
  },
  (table) => ({
    userTopicUnique: primaryKey({ columns: [table.userId, table.topicId] }),
  }),
);

export const topicCollectsPg = pgTable(
  "topic_collects",
  {
    userId: pgInteger("user_id").notNull(),
    topicId: pgInteger("topic_id").notNull(),
    createAt: timestamp("create_at").defaultNow(),
  },
  (table) => ({
    userTopicUnique: pgPrimaryKey({ columns: [table.userId, table.topicId] }),
  }),
);
