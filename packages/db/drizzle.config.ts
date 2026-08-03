import { defineConfig } from "drizzle-kit";
import { parsePostgresConfig } from "@cnode/shared";
import { loadRootEnv } from "../../scripts/env";

loadRootEnv({ cwd: import.meta.dirname });
const postgres = parsePostgresConfig();

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./migrations/pg",
  dialect: "postgresql",
  dbCredentials: { ...postgres, ssl: false },
});
