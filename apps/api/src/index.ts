import { serve } from "@hono/node-server";
import app from "./app";
import { appLog } from "./telemetry/logger";

const port = Number(process.env.CNODE_PORT) || 3001;

serve({ fetch: app.fetch, port }, (info) => {
  appLog("application.started", "INFO", { "server.port": info.port });
});

export default app;
