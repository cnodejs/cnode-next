import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, primaryKey as sqlitePrimaryKey } from "drizzle-orm/sqlite-core";
import { pgTable, integer as pgInteger, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { replies } from "./reply";
import { users } from "./user";

// 从 MongoDB 的 reply.ups[] 数组拆出的联表
export const replyUps = sqliteTable(
  "reply_ups",
  {
    replyId: integer("reply_id")
      .notNull()
      .references(() => replies.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    createAt: text("create_at").default(sql`(datetime('now'))`),
  },
  (table) => ({
    pk: sqlitePrimaryKey({ columns: [table.replyId, table.userId] }),
  }),
);

export const replyUpsPg = pgTable(
  "reply_ups",
  {
    replyId: pgInteger("reply_id").notNull(),
    userId: pgInteger("user_id").notNull(),
    createAt: timestamp("create_at").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.replyId, table.userId] }),
  }),
);
