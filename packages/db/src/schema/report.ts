import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import {
  pgTable,
  serial,
  text as pgText,
  integer as pgInteger,
  timestamp,
} from "drizzle-orm/pg-core";

export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  targetType: text("target_type").notNull(), // topic | reply
  targetId: integer("target_id").notNull(),
  reporterId: integer("reporter_id").notNull(),
  type: text("type").notNull(), // spam | attack | irrelevant | other
  description: text("description"),
  status: text("status").default("pending"), // pending | confirmed | dismissed
  handlerId: integer("handler_id"),
  handleAt: text("handle_at"),
  createAt: text("create_at").default(sql`(datetime('now'))`),
});

export const reportsPg = pgTable("reports", {
  id: serial("id").primaryKey(),
  targetType: pgText("target_type").notNull(),
  targetId: pgInteger("target_id").notNull(),
  reporterId: pgInteger("reporter_id").notNull(),
  type: pgText("type").notNull(),
  description: pgText("description"),
  status: pgText("status").default("pending"),
  handlerId: pgInteger("handler_id"),
  handleAt: timestamp("handle_at"),
  createAt: timestamp("create_at").defaultNow(),
});
