import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const ipBans = pgTable("ip_bans", {
  id: serial("id").primaryKey(),
  ip: text("ip").notNull(),
  reason: text("reason"),
  source: text("source").default("manual"),
  createAt: timestamp("create_at").defaultNow(),
});
