import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { topicQueries, userQueries } from "../lib/db";
import { getDb } from "../lib/db";
import { topicCollects } from "@cnode/db";
import { eq, and } from "drizzle-orm";
import { incrementCollectTopicCount, decrementCollectTopicCount } from "../lib/score";
import { linkUsers } from "../lib/at";
import type { AuthVars } from "../middleware/auth";
import {
  collectBodySchema,
  collectLoginNameParamSchema,
  topicDTOSchema,
  errorResponseSchema,
  nonPublicTopicTabKeys,
} from "@cnode/shared";

const collect = new OpenAPIHono<{ Variables: AuthVars }>();

const INTERNAL_TABS = new Set<string>(nonPublicTopicTabKeys);

async function isPublicTopic(topicData: any) {
  if (
    !topicData ||
    topicData.deleted ||
    topicData.status === "deleted" ||
    INTERNAL_TABS.has(topicData.tab || "")
  )
    return false;
  const author = await userQueries.getById(topicData.authorId);
  return !author?.isBlock;
}

// GET /topic_collect/:loginname
const listCollectRoute = createRoute({
  method: "get",
  path: "/topic_collect/{loginname}",
  tags: ["collections"],
  summary: "获取用户收藏列表",
  request: { params: collectLoginNameParamSchema },
  responses: {
    200: {
      description: "收藏列表",
      content: {
        "application/json": {
          schema: z.object({ success: z.literal(true), data: z.array(topicDTOSchema) }),
        },
      },
    },
    404: {
      description: "用户不存在",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});
collect.openapi(listCollectRoute, async (c) => {
  const { loginname } = c.req.valid("param");
  const userData = await userQueries.getByLoginName(loginname);
  if (!userData) return c.json({ success: false as const, error_msg: "用户不存在" }, 404);
  const db = getDb();
  const collects = await db
    .select()
    .from(topicCollects)
    .where(eq(topicCollects.userId, userData.id))
    .limit(100);
  const ids = collects.map((doc) => doc.topicId);
  if (ids.length === 0) return c.json({ success: true as const, data: [] }, 200);
  const topics = await Promise.all(ids.map((id) => topicQueries.getById(id)));
  const data = await Promise.all(
    (await Promise.all(topics.map(async (t: any) => ((await isPublicTopic(t)) ? t : null))))
      .filter(Boolean)
      .map(async (t: any) => {
        const author = await userQueries.getById(t.authorId);
        return {
          id: String(t.id),
          author_id: String(t.authorId),
          tab: t.tab,
          content: linkUsers(t.content),
          title: t.title,
          last_reply_at: t.lastReplyAt,
          good: !!t.good,
          top: !!t.top,
          reply_count: t.replyCount,
          visit_count: t.visitCount,
          create_at: t.createAt,
          author: author
            ? { loginname: author.loginname, avatar_url: author.avatar ?? "" }
            : { loginname: "", avatar_url: "" },
        };
      }),
  );
  return c.json({ success: true as const, data }, 200);
});

// POST /topic_collect/collect
const collectRoute = createRoute({
  method: "post",
  path: "/topic_collect/collect",
  tags: ["collections"],
  summary: "收藏话题",
  request: { body: { content: { "application/json": { schema: collectBodySchema } } } },
  responses: {
    200: {
      description: "收藏成功",
      content: { "application/json": { schema: z.object({ success: z.literal(true) }) } },
    },
    401: {
      description: "未登录",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "话题不存在",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    409: {
      description: "已收藏",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});
collect.openapi(collectRoute, async (c) => {
  const { topic_id, accesstoken } = c.req.valid("json");
  let user = c.get("user");
  if (!user && accesstoken) user = await userQueries.getByToken(accesstoken);
  if (!user) return c.json({ success: false as const, error_msg: "未登录" }, 401);
  const tid = Number(topic_id);
  const topicData = await topicQueries.getById(tid);
  if (!(await isPublicTopic(topicData)))
    return c.json({ success: false as const, error_msg: "话题不存在" }, 404);
  const db = getDb();
  const existing = await db
    .select()
    .from(topicCollects)
    .where(and(eq(topicCollects.userId, user.id), eq(topicCollects.topicId, tid)))
    .limit(1);
  if (existing.length > 0)
    return c.json({ success: false as const, error_msg: "已经收藏过该主题" }, 409);
  await db.insert(topicCollects).values({ userId: user.id, topicId: tid, createAt: new Date() });
  await incrementCollectTopicCount(user.id);
  await topicQueries.incrementCollectCount(tid);
  return c.json({ success: true as const }, 200);
});

// POST /topic_collect/de_collect
const deCollectRoute = createRoute({
  method: "post",
  path: "/topic_collect/de_collect",
  tags: ["collections"],
  summary: "取消收藏",
  request: { body: { content: { "application/json": { schema: collectBodySchema } } } },
  responses: {
    200: {
      description: "取消成功",
      content: { "application/json": { schema: z.object({ success: z.literal(true) }) } },
    },
    401: {
      description: "未登录",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "话题不存在或未收藏",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});
collect.openapi(deCollectRoute, async (c) => {
  const { topic_id, accesstoken } = c.req.valid("json");
  let user = c.get("user");
  if (!user && accesstoken) user = await userQueries.getByToken(accesstoken);
  if (!user) return c.json({ success: false as const, error_msg: "未登录" }, 401);
  const tid = Number(topic_id);
  const topicData = await topicQueries.getById(tid);
  if (!(await isPublicTopic(topicData)))
    return c.json({ success: false as const, error_msg: "话题不存在" }, 404);
  const db = getDb();
  const existing = await db
    .select()
    .from(topicCollects)
    .where(and(eq(topicCollects.userId, user.id), eq(topicCollects.topicId, tid)))
    .limit(1);
  if (existing.length === 0)
    return c.json({ success: false as const, error_msg: "尚未收藏该主题" }, 404);
  await db
    .delete(topicCollects)
    .where(and(eq(topicCollects.userId, user.id), eq(topicCollects.topicId, tid)));
  await decrementCollectTopicCount(user.id);
  await topicQueries.decrementCollectCount(tid);
  return c.json({ success: true as const }, 200);
});

export { collect as collectRoutes };
