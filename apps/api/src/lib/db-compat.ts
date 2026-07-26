import { eq, sql } from "drizzle-orm";

export function isPgDialect() {
  return process.env.DB_DIALECT === "pg";
}

export function boolValue(value: boolean) {
  return isPgDialect() ? value : value ? 1 : 0;
}

export function boolEq(column: any, value: boolean) {
  return isPgDialect() ? sql`${column} = ${value}` : eq(column, value ? 1 : 0);
}
