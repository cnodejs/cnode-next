import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const tabs = pgTable("tabs", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  visible: boolean("visible").default(true),
  sortOrder: integer("sort_order").default(0),
  scope: text("scope").default("public"),
  createAt: timestamp("create_at").defaultNow(),
  updateAt: timestamp("update_at").defaultNow(),
});
