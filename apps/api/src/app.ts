import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import packageJson from "../package.json";
import { errorHandler } from "./middleware/error";
import { authMiddleware, type AuthVars } from "./middleware/auth";
import { ipBanMiddleware } from "./middleware/ip-ban";
import { apiRoutes } from "./routes/index";

const app = new Hono<{
  Variables: AuthVars;
}>();

function allowedCorsOrigin(origin: string | undefined) {
  const webBaseUrl = process.env.APP_WEB_BASE_URL || "http://localhost:5173";
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
    commit: process.env.APP_GIT_SHA || process.env.GIT_SHA || process.env.COMMIT_SHA || "unknown",
    buildTime: process.env.APP_BUILD_TIME || process.env.BUILD_TIME || "unknown",
  }),
);

app.use("*", authMiddleware());
app.use("*", ipBanMiddleware());

app.route("/api/v1", apiRoutes);

export default app;
