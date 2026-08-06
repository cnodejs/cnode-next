import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { parsePostgresConfig, type RuntimeEnv } from "@cnode/shared";
import * as schema from "./schema/index";

// TODO: switch to `export type DB = ReturnType<typeof createDb>`; doing so
// surfaces ~40 type errors in @cnode/api (see PR notes) that need their own pass.
export type DB = any;

export function createDb(env: RuntimeEnv = process.env) {
  const pool = new Pool(parsePostgresConfig(env));

  return drizzle(pool, { schema });
}
