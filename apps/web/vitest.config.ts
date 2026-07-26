import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./app/test/setup.ts",
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "app"),
    },
  },
});
