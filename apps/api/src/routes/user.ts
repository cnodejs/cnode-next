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

const INTERNAL_TABS = ["dev", "test"];

function publicTopicWhere(extra?: any) {
  return and(
    boolEq(topics.deleted, false),
    sql`coalesce(${topics.status}, 'published') <> 'deleted'`,
    sql`(${topics.tab} is null or ${topics.tab} not in (${sql.join(INTERNAL_TABS.map((tab) => sql`${tab}`), sql`, `)}))`,
    sql`exists (select 1 from ${users} where ${users.id} = ${topics.authorId} and ${boolEq(users.isBlock, false)})`,
    ...(extra ? [extra] : []),
  );
}

function publicTopicExists(topicId: any) {
  return sql`exists (select 1 from ${topics} where ${topics.id} = ${topicId} and ${boolEq(topics.deleted, false)} and coalesce(${topics.status}, 'published') <> 'deleted' and (${topics.tab} is null or ${topics.tab} not in (${sql.join(INTERNAL_TABS.map((tab) => sql`${tab}`), sql`, `)})) and exists (select 1 from ${users} where ${users.id} = ${topics.authorId} and ${boolEq(users.isBlock, false)}))`;
}

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
  const where = publicTopicWhere(eq(topics.authorId, userData.id));
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
  const visibleTopicExists = publicTopicExists(replies.topicId);
  const topicRows = await db
    .select({ topicId: replies.topicId, lastReplyAt: sql`max(${replies.createAt})` })
    .from(replies)
    .where(and(eq(replies.authorId, userData.id), boolEq(replies.deleted, false), visibleTopicExists))
    .groupBy(replies.topicId)
    .orderBy(desc(sql`max(${replies.createAt})`))
    .limit(limit)
    .offset((page - 1) * limit);
  const totalRows = await db
    .select({ c: sql<number>`count(distinct ${replies.topicId})` })
    .from(replies)
    .where(and(eq(replies.authorId, userData.id), boolEq(replies.deleted, false), visibleTopicExists));
  const ids = topicRows.map((row: any) => row.topicId).filter(Boolean);
  const topicList = ids.length > 0 ? await db.select().from(topics).where(publicTopicWhere(inArray(topics.id, ids))) : [];
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
  const visibleCollectWhere = and(
    eq(topicCollects.userId, userData.id),
    publicTopicExists(topicCollects.topicId),
  );
  const [collects, totalResult] = await Promise.all([
    db
      .select()
      .from(topicCollects)
      .where(visibleCollectWhere)
      .orderBy(desc(topicCollects.createAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ c: count() }).from(topicCollects).where(visibleCollectWhere),
  ]);
  const ids = collects.map((doc) => doc.topicId);
  const topicList = ids.length > 0 ? await db.select().from(topics).where(publicTopicWhere(inArray(topics.id, ids))) : [];
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
    { authorId: userData.id, publicVisible: true },
    { limit: 15, orderBy: undefined },
  );

  // Recent replies: get replies by author, deduplicate topics, limit 5
  const userReplies = await replyQueries.getByAuthorId(userData.id, { limit: 20 });
  const replyTopicIds = [...new Set<number>(userReplies.map((r) => r.topicId))];
  const replyTopics = await Promise.all(replyTopicIds.map((tid) => topicQueries.getById(tid)));
  const recentRepliesTopics: any[] = [];
  for (const topic of replyTopics) {
    if (!topic || topic.deleted || topic.status === "deleted" || INTERNAL_TABS.includes(topic.tab || "")) continue;
    const author = await userQueries.getById(topic.authorId);
    if (author?.isBlock) continue;
    recentRepliesTopics.push(topic);
    if (recentRepliesTopics.length >= 5) break;
  }

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
    is_block: !!userData.isBlock,
    is_muted: !!userData.isMuted || !!userData.isBlock,
    recent_topics: recentTopics.map(formatTopic),
    recent_replies: recentRepliesTopics.map((t: any) => formatTopic(t)),
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
    is_block: !!userData.isBlock,
    is_muted: !!userData.isMuted || !!userData.isBlock,
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
