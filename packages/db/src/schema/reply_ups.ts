import { integer, pgTable, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { replies } from "./reply";
import { users } from "./user";

export const replyUps = pgTable(
  "reply_ups",
  {
    replyId: integer("reply_id")
      .notNull()
      .references(() => replies.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    createAt: timestamp("create_at").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.replyId, table.userId] }),
  }),
);
