import { drizzle } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import Database from "better-sqlite3";
import { Pool } from "pg";
import * as schema from "./schema/index";
import { mkdirSync } from "fs";
import { dirname, resolve } from "path";

const dialect = process.env.DB_DIALECT || "sqlite";

export type DB = ReturnType<typeof createDb>;

export function createDb() {
  if (dialect === "pg") {
    const host = process.env.DB_HOST;
    if (!host) {
      throw new Error("DB_HOST is required when DB_DIALECT=pg");
    }

    const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${host}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

    const pool = new Pool({ connectionString });
    return drizzlePg(pool, { schema });
  }

  const dbPath = process.env.DB_SQLITE_PATH || resolve(process.cwd(), "../../.local/dev.db");
  const dir = dirname(dbPath);
  if (dir) {
    mkdirSync(dir, { recursive: true });
  }
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}
