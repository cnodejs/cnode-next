import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { parsePostgresConfig } from "@cnode/shared";
import * as schema from "./schema/index";
import { loadRootEnv } from "./load-env";

loadRootEnv();

const pool = new Pool(parsePostgresConfig());
const db = drizzle(pool, { schema });

await migrate(db, { migrationsFolder: "./migrations/pg" });
await pool.end();

console.log("migration: done");
