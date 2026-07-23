import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import {
  pgTable,
  serial,
  text as pgText,
  integer as pgInteger,
  timestamp,
} from "drizzle-orm/pg-core";

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  operatorId: integer("operator_id"),
  operatorName: text("operator_name"),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  targetName: text("target_name"),
  result: text("result"),
  detail: text("detail"),
  createAt: text("create_at").default(sql`(datetime('now'))`),
});

export const auditLogsPg = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  operatorId: pgInteger("operator_id"),
  operatorName: pgText("operator_name"),
  action: pgText("action").notNull(),
  targetType: pgText("target_type"),
  targetId: pgText("target_id"),
  targetName: pgText("target_name"),
  result: pgText("result"),
  detail: pgText("detail"),
  createAt: timestamp("create_at").defaultNow(),
});
