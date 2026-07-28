import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  reporterId: integer("reporter_id").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  status: text("status").default("pending"),
  handlerId: integer("handler_id"),
  handleAt: timestamp("handle_at"),
  createAt: timestamp("create_at").defaultNow(),
});
