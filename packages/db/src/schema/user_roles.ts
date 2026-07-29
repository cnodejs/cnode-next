import { sql } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./user";

export const userRoles = pgTable(
  "user_roles",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    grantedBy: integer("granted_by").references(() => users.id, { onDelete: "set null" }),
    reason: text("reason"),
    createAt: timestamp("create_at").defaultNow(),
    updateAt: timestamp("update_at").defaultNow(),
    revokedAt: timestamp("revoked_at"),
  },
  (table) => ({
    activeRoleUnique: uniqueIndex("user_roles_active_unique")
      .on(table.userId, table.role)
      .where(sql`${table.revokedAt} is null`),
  }),
);
