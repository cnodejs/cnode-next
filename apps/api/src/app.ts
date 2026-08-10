import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import packageJson from "../package.json";
import { errorHandler } from "./middleware/error";
import { authMiddleware, type AuthVars } from "./middleware/auth";
import { ipBanMiddleware } from "./middleware/ip-ban";
import { telemetryMiddleware, type TelemetryVariables } from "./middleware/telemetry";
import { apiRoutes } from "./routes/index";

const app = new Hono<{
  Variables: AuthVars & TelemetryVariables;
}>();

function allowedCorsOrigin(origin: string | undefined) {
  const webBaseUrl = process.env.CNODE_WEB_BASE_URL || "http://localhost:5173";
  const allowed = new Set([
    webBaseUrl.replace(/\/+$/g, ""),
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://next.cnodejs.org",
    "https://cnodejs.org",
    "https://www.cnodejs.org",
  ]);
  return origin && allowed.has(origin) ? origin : webBaseUrl;
}

app.use("*", telemetryMiddleware());
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: allowedCorsOrigin,
    credentials: true,
  }),
);
app.use("*", errorHandler());

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "cnode-api",
    version: packageJson.version,
    commit: process.env.CNODE_GIT_SHA || process.env.GIT_SHA || process.env.COMMIT_SHA || "unknown",
    buildTime: process.env.CNODE_BUILD_TIME || process.env.BUILD_TIME || "unknown",
  }),
);

app.use("*", authMiddleware());
app.use("*", ipBanMiddleware());

app.route("/api/v1", apiRoutes);

app.get("/openapi.json", (c) => {
  const doc = apiRoutes.getOpenAPIDocument({
    openapi: "3.1.0",
    info: {
      title: "CNode Next API",
      version: "1.0.0",
      description:
        "Machine-readable API reference for cnode-next. Auto-generated from route-level zod-openapi declarations.",
    },
    servers: [
      { url: "https://api.cnodejs.org", description: "Production API" },
      { url: "http://localhost:3001", description: "Local API development server" },
    ],
  });
  return c.json(doc);
});

export default app;
