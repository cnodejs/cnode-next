import { defineConfig } from "vite-plus";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "app"),
    },
  },
});
