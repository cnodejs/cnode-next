import "./load-env";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { errorHandler } from "./middleware/error";
import { authMiddleware, type AuthVars } from "./middleware/auth";
import { apiRoutes } from "./routes/index";

const app = new Hono<{
  Variables: AuthVars;
}>();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => origin || "*",
    credentials: true,
  }),
);
app.use("*", errorHandler());
app.use("*", authMiddleware());

app.route("/api/v1", apiRoutes);

const port = Number(process.env.APP_PORT) || 3001;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`cnode-api running on http://localhost:${info.port}`);
});

export default app;
