import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import path from "path";
import { loadRootEnv } from "../../scripts/env";

loadRootEnv({ cwd: import.meta.dirname });

export default defineConfig({
  plugins: [reactRouter(), tailwindcss()],
  resolve: {
    alias: {
      "~": path.resolve(import.meta.dirname, "app"),
    },
  },
});
