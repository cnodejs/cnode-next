import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index";

export type DB = any;

export function createDb(): DB {
  const host = process.env.DB_HOST;
  if (!host) {
    throw new Error("DB_HOST is required");
  }

  const port = process.env.DB_PORT || "5432";
  const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${host}:${port}/${process.env.DB_NAME}`;
  const pool = new Pool({ connectionString });

  return drizzle(pool, { schema });
}
