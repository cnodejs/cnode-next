import { eq } from "drizzle-orm";

export function boolValue(value: boolean) {
  return value;
}

export function boolEq(column: any, value: boolean) {
  return eq(column, value);
}
