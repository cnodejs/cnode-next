import { drizzle, type NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { parsePostgresConfig, type RuntimeEnv } from "@cnode/shared";
import * as schema from "./schema/index";

export function createDb(env: RuntimeEnv = process.env) {
  const pool = new Pool(parsePostgresConfig(env));

  return drizzle(pool, { schema });
}

/** Full database client, including the underlying pg Pool as `$client`. */
export type DB = ReturnType<typeof createDb>;

/**
 * Query surface shared by the client, transactions, and `drizzle.mock()`.
 * Accept this in helpers that only run queries, so they work inside
 * transactions and unit tests too.
 */
export type Database = PgDatabase<NodePgQueryResultHKT, typeof schema>;
