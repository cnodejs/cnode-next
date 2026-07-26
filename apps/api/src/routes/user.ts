import { Hono } from "hono";
import { userQueries, topicQueries, replyQueries } from "../lib/db";
import { linkUsers } from "@cnode/shared";
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import type { AuthVars } from "../middleware/auth";

const user = new Hono<{
  Variables: AuthVars;
}>();

user.get("/user/:loginname", async (c) => {
  const loginname = c.req.param("loginname");
  const userData = await userQueries.getByLoginName(loginname);

  if (!userData) {
    return c.json({ success: false, error_msg: "用户不存在" }, 404);
  }

  // Recent topics (limit 15)
  const recentTopics = await topicQueries.getByQuery(
    { authorId: userData.id, deleted: 0 },
    { limit: 15, orderBy: undefined },
  );

  // Recent replies: get replies by author, deduplicate topics, limit 5
  const userReplies = await replyQueries.getByAuthorId(userData.id, { limit: 20 });
  const topicIds = [...new Set(userReplies.map((r) => r.topicId))].slice(0, 5);
  const recentRepliesTopics = await Promise.all(topicIds.map((tid) => topicQueries.getById(tid)));

  const formatTopic = (t: any) => ({
    id: String(t.id),
    author: { loginname: userData.loginname, avatar_url: userData.avatar },
    title: t.title,
    last_reply_at: t.lastReplyAt,
  });

  const data = {
    loginname: userData.loginname,
    avatar_url: userData.avatar,
    githubUsername: userData.githubUsername || "",
    create_at: userData.createAt,
    score: userData.score,
    recent_topics: recentTopics.map(formatTopic),
    recent_replies: recentRepliesTopics.filter(Boolean).map((t: any) => formatTopic(t)),
  };

  return c.json({ success: true, data });
});

user.post("/accesstoken", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const accesstoken = body.accesstoken || c.req.query("accesstoken");

  if (!accesstoken) {
    return c.json({ success: false, error_msg: "accesstoken is required" }, 400);
  }

  const userData = await userQueries.getByToken(accesstoken);
  if (!userData) {
    return c.json({ success: false, error_msg: "accesstoken 无效" }, 403);
  }

  return c.json({
    success: true,
    loginname: userData.loginname,
    avatar_url: userData.avatar,
    id: String(userData.id),
  });
});

user.post("/user/refresh_token", async (c) => {
  const currentUser = c.get("user");
  if (!currentUser) {
    return c.json({ success: false, error_msg: "未登录" }, 401);
  }

  const newToken = uuidv4();
  await userQueries.updateAccessToken(currentUser.id, newToken);

  return c.json({ success: true, accessToken: newToken });
});

export { user as userRoutes };
