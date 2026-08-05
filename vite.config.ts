import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {},
  lint: {
    categories: {
      correctness: "error",
      suspicious: "off",
      perf: "off",
      style: "off",
    },
    rules: {
      "no-unused-vars": "error",
      "unicorn/no-useless-fallback-in-spread": "off",
      "unicorn/no-useless-spread": "off",
      "no-console": "off",
      eqeqeq: "error",
      "no-var": "error",
      "prefer-const": "error",
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    ignorePatterns: ["node_modules", "dist", "build", ".vite", "pnpm-lock.yaml", "*.db"],
    // Type-aware linting (options.typeAware/typeCheck) currently reports ~70
    // pre-existing findings (mostly no-floating-promises) and requires rootDir
    // restructuring in package tsconfigs; enable it after those are addressed.
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
});
