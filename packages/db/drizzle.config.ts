import { defineConfig } from "drizzle-kit";
import { resolve } from "path";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./migrations/sqlite",
  dialect: "sqlite",
  dbCredentials: {
    url: resolve(process.cwd(), "../../.local/dev.db"),
  },
});
