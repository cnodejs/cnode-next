import { integer, pgTable, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { topics } from "./topic";
import { users } from "./user";

export const topicCollects = pgTable(
  "topic_collects",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    topicId: integer("topic_id")
      .notNull()
      .references(() => topics.id),
    createAt: timestamp("create_at").defaultNow(),
  },
  (table) => ({
    userTopicUnique: primaryKey({ columns: [table.userId, table.topicId] }),
  }),
);
