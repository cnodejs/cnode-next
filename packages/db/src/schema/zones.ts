import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const zones = pgTable("zones", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  visible: boolean("visible").default(false),
  sortOrder: integer("sort_order").default(0),
  createAt: timestamp("create_at").defaultNow(),
  updateAt: timestamp("update_at").defaultNow(),
});
