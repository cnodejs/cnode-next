import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  operatorId: integer("operator_id"),
  operatorName: text("operator_name"),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  targetName: text("target_name"),
  result: text("result"),
  detail: text("detail"),
  createAt: timestamp("create_at").defaultNow(),
});
