import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import _ from "lodash";
import { settingQueries, topicQueries, userQueries, replyQueries } from "../lib/db";
import { incrementScoreAndTopicCount } from "../lib/score";
import { sendMessageToMentionUsers } from "../lib/at";
import { checkContent } from "../lib/moderation";
import { excerptMarkdown, userSummary } from "../lib/format";
import { renderMarkdown } from "../lib/markdown";
import { perUserPerDaySetting } from "../middleware/rate-limit";
import type { AuthVars } from "../middleware/auth";
import { ensureMuteNotExpired } from "../lib/penalty";
import { requestIp, verifyTurnstile } from "../lib/turnstile";
import {
  topicListQuerySchema,
  mdrenderQuerySchema,
  topicDTOSchema,
  fullTopicSchema,
  createTopicBodySchema,
  updateTopicBodySchema,
  errorResponseSchema,
  type TopicDTO,
} from "@cnode/shared";
import { z } from "zod";

const topic = new OpenAPIHono<{
  Variables: AuthVars;
}>();

const CREATE_TOPIC_SCORE = 5;
const CREATE_TOPIC_PER_DAY = 1000;
const INTERNAL_TABS = new Set(["dev", "test"]);

async function assertNewUserCanCreateTopic(user: any) {
  const minHours = Math.max(0, Number(await settingQueries.get("new_user_min_hours", "24")) || 24);
  const minReplies = Math.max(0, Number(await settingQueries.get("new_user_min_replies", "3")) || 3);
  const createdAt = user.createAt ? new Date(user.createAt).getTime() : Date.now();
  const accountAgeHours = Math.floor((Date.now() - createdAt) / 3600000);
  if (accountAgeHours < minHours || Number(user.replyCount || 0) < minReplies) {
    return `新用户需要注册满 ${minHours} 小时且回复数达到 ${minReplies} 条后才能发帖`;
  }
  return null;
}

async function isNewUserForTopicGate(user: any) {
  const minHours = Math.max(0, Number(await settingQueries.get("new_user_min_hours", "24")) || 24);
  const minReplies = Math.max(0, Number(await settingQueries.get("new_user_min_replies", "3")) || 3);
  const createdAt = user.createAt ? new Date(user.createAt).getTime() : Date.now();
  const accountAgeHours = Math.floor((Date.now() - createdAt) / 3600000);
  return accountAgeHours < minHours || Number(user.replyCount || 0) < minReplies;
}

const listTopicsRoute = createRoute({
  method: "get",
  path: "/topics",
  tags: ["topics"],
  summary: "获取话题列表",
  description: "支持 page、limit、tab、mdrender 参数。",
  request: {
    query: topicListQuerySchema.merge(mdrenderQuerySchema),
  },
  responses: {
    200: {
      description: "话题列表",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.array(topicDTOSchema),
            total: z.number(),
          }),
        },
      },
    },
  },
});

topic.openapi(listTopicsRoute, async (c) => {
  const { page, limit, tab, mdrender } = c.req.valid("query");

  const query: any = {};
  if (!tab || tab === "all") {
    query.excludeTabs = ["job"];
  } else if (tab === "good") {
    query.good = 1;
  } else {
    query.tab = tab;
  }
  query.publicVisible = true;

  const topicsList = await topicQueries.getByQuery(query, {
    limit,
    offset: (page - 1) * limit,
  });
  const total = await topicQueries.countByQuery(query);

  const data = await Promise.all(
    topicsList.map(async (t) => {
      const author = await userQueries.getById(t.authorId);
      return {
        id: String(t.id),
        author_id: String(t.authorId),
        tab: t.tab,
        content: renderMarkdown(t.content, mdrender),
        title: t.title,
        last_reply_at: t.lastReplyAt,
        good: !!t.good,
        top: !!t.top,
        reply_count: t.replyCount,
        visit_count: t.visitCount,
        create_at: t.createAt,
        author: userSummary(author),
      } as TopicDTO;
    }),
  );

  return c.json({ success: true as const, data, total }, 200);
});

const getTopicRoute = createRoute({
  method: "get",
  path: "/topic/{topic_id}",
  tags: ["topics"],
  summary: "获取话题详情",
  description: "包含作者、回复和引用摘要。支持 mdrender 和 accesstoken 参数。",
  request: {
    params: z.object({ topic_id: z.string() }),
    query: mdrenderQuerySchema.extend({
      accesstoken: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "话题详情",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: fullTopicSchema,
          }),
        },
      },
    },
    400: {
      description: "无效的话题 ID",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "话题不存在",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

topic.openapi(getTopicRoute, async (c) => {
  const { topic_id } = c.req.valid("param");
  const id = Number(topic_id);
  if (!id || Number.isNaN(id)) {
    return c.json({ success: false as const, error_msg: "不是有效的话题id" }, 400);
  }

  const { mdrender, accesstoken } = c.req.valid("query");

  let currentUser: any = null;
  if (accesstoken) {
    currentUser = await userQueries.getByToken(accesstoken);
  } else {
    currentUser = c.get("user") || null;
  }

  const topicData = await topicQueries.getById(id);
  if (!topicData || topicData.deleted) {
    return c.json({ success: false as const, error_msg: "话题不存在" }, 404);
  }

  await topicQueries.incrementVisitCount(id);

  const author = await userQueries.getById(topicData.authorId);
  if (!c.get("isAdmin") && (topicData.status === "deleted" || INTERNAL_TABS.has(topicData.tab || "") || author?.isBlock)) {
    return c.json({ success: false as const, error_msg: "话题不存在" }, 404);
  }
  const repliesList = await replyQueries.getByTopicId(id);
  const replyUps = await replyQueries.getUpsByReplyIds(repliesList.map((reply) => reply.id));
  const upsByReplyId = new Map<number, string[]>();
  for (const up of replyUps) {
    const list = upsByReplyId.get(up.replyId) || [];
    list.push(String(up.userId));
    upsByReplyId.set(up.replyId, list);
  }

  const replyMap = new Map(repliesList.map((reply) => [reply.id, reply]));
  const repliesData = await Promise.all(
    repliesList.map(async (r) => {
      const replyAuthor = await userQueries.getById(r.authorId);
      const parentReply = r.replyId
        ? replyMap.get(r.replyId) || (await replyQueries.getById(r.replyId))
        : null;
      const visibleParentReply = parentReply && !parentReply.deleted ? parentReply : null;
      const parentAuthor = visibleParentReply ? await userQueries.getById(visibleParentReply.authorId) : null;
      const ups = upsByReplyId.get(r.id) || [];
      return {
        id: String(r.id),
        author: userSummary(replyAuthor),
        content: renderMarkdown(r.content, mdrender),
        ups,
        create_at: r.createAt,
        reply_id: r.replyId ? String(r.replyId) : null,
        reply_to: visibleParentReply
          ? {
              id: String(visibleParentReply.id),
              author: userSummary(parentAuthor),
              content_excerpt: excerptMarkdown(visibleParentReply.content),
              deleted: false,
            }
          : null,
        is_uped: currentUser ? ups.includes(String(currentUser.id)) : false,
      };
    }),
  );

  const isCollect = currentUser ? await topicQueries.isCollected(id, currentUser.id) : false;

  const result: any = {
    id: String(topicData.id),
    author_id: String(topicData.authorId),
    tab: topicData.tab,
    content: renderMarkdown(topicData.content, mdrender),
    title: topicData.title,
    last_reply_at: topicData.lastReplyAt,
    good: !!topicData.good,
    top: !!topicData.top,
    reply_count: topicData.replyCount,
    visit_count: topicData.visitCount,
    create_at: topicData.createAt,
    author: userSummary(author),
    replies: repliesData,
    is_collect: isCollect,
  };

  return c.json({ success: true as const, data: result }, 200);
});

const createTopicRoute = createRoute({
  method: "post",
  path: "/topics",
  tags: ["topics"],
  summary: "创建话题",
  description: "需要登录。新用户需通过 Turnstile 人机验证。",
  middleware: [
    perUserPerDaySetting("create_topic", "rate_topic", CREATE_TOPIC_PER_DAY, true),
  ],
  request: {
    body: {
      content: { "application/json": { schema: createTopicBodySchema } },
    },
  },
  responses: {
    200: {
      description: "创建成功",
      content: {
        "application/json": {
          schema: z.object({ success: z.literal(true), topic_id: z.string() }),
        },
      },
    },
    401: {
      description: "未登录",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "禁言或人机验证失败或新用户限制",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    422: {
      description: "包含敏感词",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

topic.openapi(createTopicRoute, async (c) => {
  let user = c.get("user");
  if (!user) {
    return c.json({ success: false as const, error_msg: "未登录" }, 401);
  }
  user = await ensureMuteNotExpired(user);
  if (user.isMuted || user.isBlock) {
    return c.json({ success: false as const, error_msg: "您已被禁言" }, 403);
  }
  const body = c.req.valid("json");
  if ((await isNewUserForTopicGate(user)) && !(await verifyTurnstile(body.turnstileToken, requestIp(c)))) {
    return c.json({ success: false as const, error_msg: "人机验证失败" }, 403);
  }
  const newUserError = await assertNewUserCanCreateTopic(user);
  if (newUserError) {
    return c.json({ success: false as const, error_msg: newUserError }, 403);
  }

  const { title, tab, content } = body;

  const titleCheck = await checkContent(title);
  if (titleCheck.hit) {
    return c.json(
      { success: false as const, error_msg: `标题包含敏感词: ${titleCheck.words.join(", ")}` },
      422,
    );
  }
  const contentCheck = await checkContent(content);
  if (contentCheck.hit) {
    return c.json(
      { success: false as const, error_msg: `内容包含敏感词: ${contentCheck.words.join(", ")}` },
      422,
    );
  }

  const newTopic = await topicQueries.newAndSave(title, content, tab, user.id);
  await incrementScoreAndTopicCount(user.id, CREATE_TOPIC_SCORE, 1);
  await sendMessageToMentionUsers(content, newTopic.id, user.id);

  return c.json({ success: true as const, topic_id: String(newTopic.id) }, 200);
});

const updateTopicRoute = createRoute({
  method: "post",
  path: "/topics/update",
  tags: ["topics"],
  summary: "编辑话题",
  description: "作者或管理员可编辑。锁定的话题仅管理员可编辑。",
  request: {
    body: {
      content: { "application/json": { schema: updateTopicBodySchema } },
    },
  },
  responses: {
    200: {
      description: "更新成功",
      content: {
        "application/json": {
          schema: z.object({ success: z.literal(true), topic_id: z.string() }),
        },
      },
    },
    401: {
      description: "未登录",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "无权限编辑",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "话题不存在",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    422: {
      description: "包含敏感词",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

topic.openapi(updateTopicRoute, async (c) => {
  const body = c.req.valid("json");
  let user = c.get("user");
  if (!user && body.accesstoken) {
    user = await userQueries.getByToken(body.accesstoken);
  }
  if (!user) {
    return c.json({ success: false as const, error_msg: "未登录" }, 401);
  }

  const { topic_id, title, tab, content } = body;
  const tid = Number(topic_id);

  const titleCheck = await checkContent(title);
  if (titleCheck.hit) {
    return c.json(
      { success: false as const, error_msg: `标题包含敏感词: ${titleCheck.words.join(", ")}` },
      422,
    );
  }
  const contentCheck = await checkContent(content);
  if (contentCheck.hit) {
    return c.json(
      { success: false as const, error_msg: `内容包含敏感词: ${contentCheck.words.join(", ")}` },
      422,
    );
  }

  const topicData = await topicQueries.getById(tid);
  if (!topicData || topicData.deleted) {
    return c.json({ success: false as const, error_msg: "话题不存在" }, 404);
  }

  if (topicData.authorId !== user.id && !c.get("isAdmin")) {
    return c.json({ success: false as const, error_msg: "无权限编辑" }, 403);
  }

  if (topicData.lock && !c.get("isAdmin")) {
    return c.json({ success: false as const, error_msg: "话题已锁定" }, 403);
  }

  await topicQueries.updateTopic(tid, { title, tab, content });
  await sendMessageToMentionUsers(content, tid, user.id);

  return c.json({ success: true as const, topic_id: String(tid) }, 200);
});

export { topic as topicRoutes };
