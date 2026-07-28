import "./load-env";
import { serve } from "@hono/node-server";
import app from "./app";

const port = Number(process.env.APP_PORT) || 3001;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`cnode-api running on http://localhost:${info.port}`);
});

export default app;
