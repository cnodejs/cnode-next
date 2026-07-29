import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index";
import { loadRootEnv } from "./load-env";

loadRootEnv();

const host = process.env.DB_HOST;
if (!host) {
  throw new Error("DB_HOST is required");
}

const port = process.env.DB_PORT || "5432";
const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${host}:${port}/${process.env.DB_NAME}`;
const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });

await migrate(db, { migrationsFolder: "./migrations/pg" });
await pool.end();

console.log("migration: done");
