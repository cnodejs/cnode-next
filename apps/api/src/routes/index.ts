import { OpenAPIHono } from "@hono/zod-openapi";
import { topicRoutes } from "./topic";
import { replyRoutes } from "./reply";
import { userRoutes } from "./user";
import { messageRoutes } from "./message";
import { collectRoutes } from "./collect";
import { authRoutes } from "./auth";
import { adminRoutes } from "./admin";
import { communityRoutes } from "./community";
import { zoneRoutes } from "./zone";

const apiRoutes = new OpenAPIHono();

apiRoutes.route("/", topicRoutes);
apiRoutes.route("/", replyRoutes);
apiRoutes.route("/", userRoutes);
apiRoutes.route("/", messageRoutes);
apiRoutes.route("/", collectRoutes);
apiRoutes.route("/", authRoutes);
apiRoutes.route("/", adminRoutes);
apiRoutes.route("/", communityRoutes);
apiRoutes.route("/", zoneRoutes);

export { apiRoutes };
