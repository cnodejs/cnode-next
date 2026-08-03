import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { parsePostgresConfig, type RuntimeEnv } from "@cnode/shared";
import * as schema from "./schema/index";

export type DB = any;

export function createDb(env: RuntimeEnv = process.env): DB {
  const pool = new Pool(parsePostgresConfig(env));

  return drizzle(pool, { schema });
}
