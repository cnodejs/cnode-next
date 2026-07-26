import { Hono } from "hono";
import { userQueries, topicQueries, replyQueries, getDb } from "../lib/db";
import { replies, topicCollects, topics, users } from "@cnode/db";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { boolEq } from "../lib/db-compat";
import type { AuthVars } from "../middleware/auth";

const user = new Hono<{
  Variables: AuthVars;
}>();

function formatPublicUser(userData: any) {
  return {
    id: String(userData.id),
    loginname: userData.loginname,
    avatar_url: userData.avatar,
    githubUsername: userData.githubUsername || "",
    create_at: userData.createAt,
    score: userData.score || 0,
    topic_count: userData.topicCount || 0,
    reply_count: userData.replyCount || 0,
    is_star: !!userData.isStar,
  };
}

async function formatTopic(t: any) {
  const author = await userQueries.getById(t.authorId);
  return {
    id: String(t.id),
    author_id: String(t.authorId),
    tab: t.tab,
    content: t.content,
    title: t.title,
    last_reply_at: t.lastReplyAt,
    good: !!t.good,
    top: !!t.top,
    reply_count: t.replyCount,
    visit_count: t.visitCount,
    create_at: t.createAt,
    author: author ? { loginname: author.loginname, avatar_url: author.avatar } : { loginname: "", avatar_url: "" },
  };
}

user.get("/users/stars", async (c) => {
  const db = getDb();
  const stars = await db
    .select()
    .from(users)
    .where(boolEq(users.isStar, true))
    .orderBy(desc(users.score));

  return c.json({ success: true, data: stars.map(formatPublicUser) });
});

user.get("/users/top100", async (c) => {
  const db = getDb();
  const tops = await db
    .select()
    .from(users)
    .where(boolEq(users.isBlock, false))
    .orderBy(desc(users.score))
    .limit(100);

  return c.json({ success: true, data: tops.map(formatPublicUser) });
});

user.get("/user/:loginname/topics", async (c) => {
  const loginname = c.req.param("loginname");
  const page = Math.max(1, Number(c.req.query("page")) || 1);
  const limit = Math.min(100, Number(c.req.query("limit")) || 20);
  const userData = await userQueries.getByLoginName(loginname);
  if (!userData) return c.json({ success: false, error_msg: "用户不存在" }, 404);

  const db = getDb();
  const where = and(eq(topics.authorId, userData.id), boolEq(topics.deleted, false));
  const [list, totalResult] = await Promise.all([
    db
      .select()
      .from(topics)
      .where(where)
      .orderBy(desc(topics.createAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ c: count() }).from(topics).where(where),
  ]);

  return c.json({
    success: true,
    data: await Promise.all(list.map(formatTopic)),
    total: Number(totalResult[0]?.c || 0),
    user: formatPublicUser(userData),
  });
});

user.get("/user/:loginname/replies", async (c) => {
  const loginname = c.req.param("loginname");
  const page = Math.max(1, Number(c.req.query("page")) || 1);
  const limit = Math.min(100, Number(c.req.query("limit")) || 50);
  const userData = await userQueries.getByLoginName(loginname);
  if (!userData) return c.json({ success: false, error_msg: "用户不存在" }, 404);

  const db = getDb();
  const topicRows = await db
    .select({ topicId: replies.topicId, lastReplyAt: sql`max(${replies.createAt})` })
    .from(replies)
    .where(and(eq(replies.authorId, userData.id), boolEq(replies.deleted, false)))
    .groupBy(replies.topicId)
    .orderBy(desc(sql`max(${replies.createAt})`))
    .limit(limit)
    .offset((page - 1) * limit);
  const totalRows = await db
    .select({ c: sql<number>`count(distinct ${replies.topicId})` })
    .from(replies)
    .where(and(eq(replies.authorId, userData.id), boolEq(replies.deleted, false)));
  const ids = topicRows.map((row: any) => row.topicId).filter(Boolean);
  const topicList = ids.length > 0 ? await db.select().from(topics).where(inArray(topics.id, ids)) : [];
  const byId = new Map(topicList.map((topic: any) => [topic.id, topic]));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean);

  return c.json({
    success: true,
    data: await Promise.all(ordered.map(formatTopic)),
    total: Number(totalRows[0]?.c || 0),
    user: formatPublicUser(userData),
  });
});

user.get("/user/:loginname/collections", async (c) => {
  const loginname = c.req.param("loginname");
  const page = Math.max(1, Number(c.req.query("page")) || 1);
  const limit = Math.min(100, Number(c.req.query("limit")) || 20);
  const userData = await userQueries.getByLoginName(loginname);
  if (!userData) return c.json({ success: false, error_msg: "用户不存在" }, 404);

  const db = getDb();
  const [collects, totalResult] = await Promise.all([
    db
      .select()
      .from(topicCollects)
      .where(eq(topicCollects.userId, userData.id))
      .orderBy(desc(topicCollects.createAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ c: count() }).from(topicCollects).where(eq(topicCollects.userId, userData.id)),
  ]);
  const ids = collects.map((doc) => doc.topicId);
  const topicList = ids.length > 0 ? await db.select().from(topics).where(inArray(topics.id, ids)) : [];
  const byId = new Map(topicList.map((topic: any) => [topic.id, topic]));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean);

  return c.json({
    success: true,
    data: await Promise.all(ordered.map(formatTopic)),
    total: Number(totalResult[0]?.c || 0),
    user: formatPublicUser(userData),
  });
});

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
    topic_count: userData.topicCount || 0,
    reply_count: userData.replyCount || 0,
    collect_topic_count: userData.collectTopicCount || 0,
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
