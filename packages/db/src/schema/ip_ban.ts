import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { pgTable, serial, text as pgText, timestamp } from "drizzle-orm/pg-core";

export const ipBans = sqliteTable("ip_bans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ip: text("ip").notNull(),
  reason: text("reason"),
  source: text("source").default("manual"), // manual | auto
  createAt: text("create_at").default(sql`(datetime('now'))`),
});

export const ipBansPg = pgTable("ip_bans", {
  id: serial("id").primaryKey(),
  ip: pgText("ip").notNull(),
  reason: pgText("reason"),
  source: pgText("source").default("manual"),
  createAt: timestamp("create_at").defaultNow(),
});
