import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { userQueries, topicQueries, replyQueries, roleQueries, getDb } from "../lib/db";
import { replies, topicCollects, topics, users } from "@cnode/db";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { boolEq } from "../lib/db-compat";
import type { AuthVars } from "../middleware/auth";
import { resolveUserAccess } from "../lib/user-access";
import {
  publicUserSchema,
  userDetailSchema,
  loginNameParamSchema,
  topicDTOSchema,
  paginationQuerySchema,
  errorResponseSchema,
  type PublicUserDTO,
} from "@cnode/shared";

const user = new OpenAPIHono<{ Variables: AuthVars }>();

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

function formatPublicUser(userData: any): PublicUserDTO {
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

// GET /users/stars
const starsRoute = createRoute({
  method: "get", path: "/users/stars", tags: ["users"], summary: "获取星标用户",
  responses: { 200: { description: "星标用户列表", content: { "application/json": { schema: z.object({ success: z.literal(true), data: z.array(publicUserSchema) }) } } } },
});
user.openapi(starsRoute, async (c) => {
  const db = getDb();
  const stars = await db.select().from(users).where(boolEq(users.isStar, true)).orderBy(desc(users.score));
  return c.json({ success: true as const, data: stars.map(formatPublicUser) }, 200);
});

// GET /users/top100
const top100Route = createRoute({
  method: "get", path: "/users/top100", tags: ["users"], summary: "获取积分前 100 用户",
  responses: { 200: { description: "Top 100 用户", content: { "application/json": { schema: z.object({ success: z.literal(true), data: z.array(publicUserSchema) }) } } } },
});
user.openapi(top100Route, async (c) => {
  const db = getDb();
  const tops = await db.select().from(users).where(boolEq(users.isBlock, false)).orderBy(desc(users.score)).limit(100);
  return c.json({ success: true as const, data: tops.map(formatPublicUser) }, 200);
});

// GET /user/:loginname/topics
const userTopicsRoute = createRoute({
  method: "get", path: "/user/{loginname}/topics", tags: ["users"], summary: "用户的话题列表",
  request: { params: loginNameParamSchema, query: paginationQuerySchema },
  responses: { 200: { description: "话题列表", content: { "application/json": { schema: z.object({ success: z.literal(true), data: z.array(topicDTOSchema), total: z.number(), user: publicUserSchema }) } } }, 404: { description: "用户不存在", content: { "application/json": { schema: errorResponseSchema } } } },
});
user.openapi(userTopicsRoute, async (c) => {
  const { loginname } = c.req.valid("param");
  const { page, limit } = c.req.valid("query");
  const userData = await userQueries.getByLoginName(loginname);
  if (!userData) return c.json({ success: false as const, error_msg: "用户不存在" }, 404);
  const db = getDb();
  const where = publicTopicWhere(eq(topics.authorId, userData.id));
  const [list, totalResult] = await Promise.all([
    db.select().from(topics).where(where).orderBy(desc(topics.createAt)).limit(limit).offset((page - 1) * limit),
    db.select({ c: count() }).from(topics).where(where),
  ]);
  return c.json({ success: true as const, data: await Promise.all(list.map(formatTopic)), total: Number(totalResult[0]?.c || 0), user: formatPublicUser(userData) }, 200);
});

// GET /user/:loginname/replies
const userRepliesRoute = createRoute({
  method: "get", path: "/user/{loginname}/replies", tags: ["users"], summary: "用户的回复列表",
  request: { params: loginNameParamSchema, query: paginationQuerySchema },
  responses: { 200: { description: "回复列表", content: { "application/json": { schema: z.object({ success: z.literal(true), data: z.array(topicDTOSchema), total: z.number(), user: publicUserSchema }) } } }, 404: { description: "用户不存在", content: { "application/json": { schema: errorResponseSchema } } } },
});
user.openapi(userRepliesRoute, async (c) => {
  const { loginname } = c.req.valid("param");
  const { page, limit } = c.req.valid("query");
  const userData = await userQueries.getByLoginName(loginname);
  if (!userData) return c.json({ success: false as const, error_msg: "用户不存在" }, 404);
  const db = getDb();
  const visibleTopicExists = publicTopicExists(replies.topicId);
  const topicRows = await db.select({ topicId: replies.topicId, lastReplyAt: sql`max(${replies.createAt})` }).from(replies).where(and(eq(replies.authorId, userData.id), boolEq(replies.deleted, false), visibleTopicExists)).groupBy(replies.topicId).orderBy(desc(sql`max(${replies.createAt})`)).limit(limit).offset((page - 1) * limit);
  const totalRows = await db.select({ c: sql<number>`count(distinct ${replies.topicId})` }).from(replies).where(and(eq(replies.authorId, userData.id), boolEq(replies.deleted, false)));
  const ids = topicRows.map((row: any) => row.topicId).filter(Boolean);
  const topicList = ids.length > 0 ? await db.select().from(topics).where(publicTopicWhere(inArray(topics.id, ids))) : [];
  const byId = new Map(topicList.map((topic: any) => [topic.id, topic]));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
  return c.json({ success: true as const, data: await Promise.all(ordered.map(formatTopic)), total: Number(totalRows[0]?.c || 0), user: formatPublicUser(userData) }, 200);
});

// GET /user/:loginname/collections
const userCollectionsRoute = createRoute({
  method: "get", path: "/user/{loginname}/collections", tags: ["users"], summary: "用户的收藏列表",
  request: { params: loginNameParamSchema, query: paginationQuerySchema },
  responses: { 200: { description: "收藏列表", content: { "application/json": { schema: z.object({ success: z.literal(true), data: z.array(topicDTOSchema), total: z.number(), user: publicUserSchema }) } } }, 404: { description: "用户不存在", content: { "application/json": { schema: errorResponseSchema } } } },
});
user.openapi(userCollectionsRoute, async (c) => {
  const { loginname } = c.req.valid("param");
  const { page, limit } = c.req.valid("query");
  const userData = await userQueries.getByLoginName(loginname);
  if (!userData) return c.json({ success: false as const, error_msg: "用户不存在" }, 404);
  const db = getDb();
  const visibleCollectWhere = and(eq(topicCollects.userId, userData.id), publicTopicExists(topicCollects.topicId));
  const [collects, totalResult] = await Promise.all([
    db.select().from(topicCollects).where(visibleCollectWhere).orderBy(desc(topicCollects.createAt)).limit(limit).offset((page - 1) * limit),
    db.select({ c: count() }).from(topicCollects).where(visibleCollectWhere),
  ]);
  const ids = collects.map((doc) => doc.topicId);
  const topicList = ids.length > 0 ? await db.select().from(topics).where(publicTopicWhere(inArray(topics.id, ids))) : [];
  const byId = new Map(topicList.map((topic: any) => [topic.id, topic]));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
  return c.json({ success: true as const, data: await Promise.all(ordered.map(formatTopic)), total: Number(totalResult[0]?.c || 0), user: formatPublicUser(userData) }, 200);
});

// GET /user/:loginname
const userDetailRoute = createRoute({
  method: "get", path: "/user/{loginname}", tags: ["users"], summary: "获取用户详情",
  request: { params: loginNameParamSchema },
  responses: { 200: { description: "用户详情", content: { "application/json": { schema: z.object({ success: z.literal(true), data: userDetailSchema }) } } }, 404: { description: "用户不存在", content: { "application/json": { schema: errorResponseSchema } } } },
});
user.openapi(userDetailRoute, async (c) => {
  const { loginname } = c.req.valid("param");
  const userData = await userQueries.getByLoginName(loginname);
  if (!userData) return c.json({ success: false as const, error_msg: "用户不存在" }, 404);
  const [recentTopics, userReplies, roles] = await Promise.all([
    topicQueries.getByQuery({ authorId: userData.id, publicVisible: true }, { limit: 15, orderBy: undefined }),
    replyQueries.getByAuthorId(userData.id, { limit: 20 }),
    roleQueries.listByUserId(userData.id),
  ]);
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
  const fmtTopic = (t: any) => ({ id: String(t.id), author: { loginname: userData.loginname, avatar_url: userData.avatar }, title: t.title, last_reply_at: t.lastReplyAt });
  const { identities } = resolveUserAccess(userData.loginname, roles);
  return c.json({ success: true as const, data: { loginname: userData.loginname, avatar_url: userData.avatar, githubUsername: userData.githubUsername?.trim() || "", location: userData.location?.trim() || null, url: userData.url?.trim() || null, signature: userData.signature?.trim() || null, identities, create_at: userData.createAt, score: userData.score || 0, topic_count: userData.topicCount || 0, reply_count: userData.replyCount || 0, collect_topic_count: userData.collectTopicCount || 0, is_block: !!userData.isBlock, is_muted: !!userData.isMuted, recent_topics: recentTopics.map(fmtTopic), recent_replies: recentRepliesTopics.map(fmtTopic) } }, 200);
});

// POST /accesstoken
const accessTokenRoute = createRoute({
  method: "post", path: "/accesstoken", tags: ["auth"], summary: "验证 accessToken",
  request: { body: { content: { "application/json": { schema: z.object({ accesstoken: z.string() }) } } } },
  responses: { 200: { description: "验证成功", content: { "application/json": { schema: z.object({ success: z.literal(true), loginname: z.string(), avatar_url: z.string(), id: z.string(), is_block: z.boolean(), is_muted: z.boolean() }) } } }, 400: { description: "缺少 accesstoken", content: { "application/json": { schema: errorResponseSchema } } }, 403: { description: "accesstoken 无效", content: { "application/json": { schema: errorResponseSchema } } } },
});
user.openapi(accessTokenRoute, async (c) => {
  const { accesstoken } = c.req.valid("json");
  if (!accesstoken) return c.json({ success: false as const, error_msg: "accesstoken is required" }, 400);
  const userData = await userQueries.getByToken(accesstoken);
  if (!userData) return c.json({ success: false as const, error_msg: "accesstoken 无效" }, 403);
  return c.json({ success: true as const, loginname: userData.loginname, avatar_url: userData.avatar, id: String(userData.id), is_block: !!userData.isBlock, is_muted: !!userData.isMuted || !!userData.isBlock }, 200);
});

// POST /user/refresh_token
const refreshTokenRoute = createRoute({
  method: "post", path: "/user/refresh_token", tags: ["auth"], summary: "刷新 accessToken",
  responses: { 200: { description: "刷新成功", content: { "application/json": { schema: z.object({ success: z.literal(true), accessToken: z.string() }) } } }, 401: { description: "未登录", content: { "application/json": { schema: errorResponseSchema } } } },
});
user.openapi(refreshTokenRoute, async (c) => {
  const currentUser = c.get("user");
  if (!currentUser) return c.json({ success: false as const, error_msg: "未登录" }, 401);
  const newToken = uuidv4();
  await userQueries.updateAccessToken(currentUser.id, newToken);
  return c.json({ success: true as const, accessToken: newToken }, 200);
});

export { user as userRoutes };
