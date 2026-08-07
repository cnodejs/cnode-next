import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { apiRoutes } from "../src/routes/index";

const doc = apiRoutes.getOpenAPIDocument({
  openapi: "3.1.0",
  info: {
    title: "CNode Next API",
    version: "1.0.0",
    description:
      "Machine-readable API reference for cnode-next. The `/api/v1/*` paths preserve the public nodeclub API v1 response envelope and legacy field names where practical. This document is auto-generated from route-level zod-openapi declarations — do not hand-edit.",
  },
  servers: [
    { url: "https://api.cnodejs.org", description: "Production API" },
    { url: "http://localhost:3001", description: "Local API development server" },
  ],
});

const webPath = resolve(process.cwd(), "../../apps/web/public/openapi.json");
writeFileSync(webPath, JSON.stringify(doc, null, 2) + "\n", "utf8");
console.log(`✓ Wrote ${webPath}`);
