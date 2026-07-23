import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { pgTable, serial, text as pgText, timestamp } from "drizzle-orm/pg-core";

export const siteSettings = sqliteTable("site_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value"),
  updateAt: text("update_at").default(sql`(datetime('now'))`),
});

export const siteSettingsPg = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: pgText("key").notNull().unique(),
  value: pgText("value"),
  updateAt: timestamp("update_at").defaultNow(),
});
