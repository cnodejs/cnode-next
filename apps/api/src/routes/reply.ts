import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { replyQueries, topicQueries, userQueries } from "../lib/db";
import { sendMessageToMentionUsers } from "../lib/at";
import { sendReplyMessage, sendReply2Message } from "../lib/message";
import { checkContent } from "../lib/moderation";
import { perUserPerDaySetting } from "../middleware/rate-limit";
import type { AuthVars } from "../middleware/auth";
import { ensureMuteNotExpired } from "../lib/penalty";
import { requestIp, verifyTurnstile } from "../lib/turnstile";
import {
  createReplyBodySchema,
  editReplyBodySchema,
  deleteReplyBodySchema,
  upsBodySchema,
  replyDTOSchema,
  errorResponseSchema,
} from "@cnode/shared";

const reply = new OpenAPIHono<{
  Variables: AuthVars;
}>();

const CREATE_REPLY_PER_DAY = 1000;

async function requestUser(c: any, accesstoken?: string) {
  const user = c.get("user");
  if (user) return user;
  if (!accesstoken) return null;
  return userQueries.getByToken(accesstoken);
}

const createReplyRoute = createRoute({
  method: "post",
  path: "/topic/{topic_id}/replies",
  tags: ["replies"],
  summary: "创建回复",
  description: "创建线性回复，可传 reply_id 回复另一条回复。需要登录。",
  middleware: [perUserPerDaySetting("create_reply", "rate_reply", CREATE_REPLY_PER_DAY, true)],
  request: {
    params: z.object({ topic_id: z.string() }),
    body: { content: { "application/json": { schema: createReplyBodySchema } } },
  },
  responses: {
    200: {
      description: "创建成功",
      content: {
        "application/json": {
          schema: z.object({ success: z.literal(true), reply_id: z.string() }),
        },
      },
    },
    401: {
      description: "未登录",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "禁言或人机验证失败",
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

reply.openapi(createReplyRoute, async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ success: false as const, error_msg: "未登录" }, 401);
  }
  const user: NonNullable<AuthVars["user"]> = await ensureMuteNotExpired(sessionUser);
  if (user.isMuted || user.isBlock) {
    return c.json({ success: false as const, error_msg: "您已被禁言" }, 403);
  }

  const { topic_id } = c.req.valid("param");
  const topicId = Number(topic_id);
  const { content, reply_id, turnstileToken } = c.req.valid("json");

  if (!(await verifyTurnstile(turnstileToken, requestIp(c)))) {
    return c.json({ success: false as const, error_msg: "人机验证失败" }, 403);
  }

  const contentCheck = await checkContent(content);
  if (contentCheck.hit) {
    return c.json(
      {
        success: false as const,
        error_msg: `回复内容包含敏感词: ${contentCheck.words.join(", ")}`,
      },
      422,
    );
  }

  const topicData = await topicQueries.getById(topicId);
  if (!topicData) {
    return c.json({ success: false as const, error_msg: "话题不存在" }, 404);
  }
  if (topicData.lock) {
    return c.json({ success: false as const, error_msg: "该话题已被锁定" }, 403);
  }

  const replyId = reply_id ? Number(reply_id) : undefined;
  const createResult = await replyQueries.createWithAggregates(content, topicId, user.id, replyId);
  if (createResult.status === "not_found") {
    return c.json({ success: false as const, error_msg: "话题不存在" }, 404);
  }
  if (createResult.status === "locked") {
    return c.json({ success: false as const, error_msg: "话题已锁定" }, 403);
  }
  const newReply = createResult.reply;

  if (topicData.authorId !== user.id) {
    await sendReplyMessage(topicData.authorId, user.id, topicId, newReply.id);
  }

  const mentionExcludes = [topicData.authorId];
  if (replyId) {
    const parentReply = await replyQueries.getById(replyId);
    if (
      parentReply &&
      parentReply.authorId !== user.id &&
      parentReply.authorId !== topicData.authorId
    ) {
      await sendReply2Message(parentReply.authorId, user.id, topicId, newReply.id);
      mentionExcludes.push(parentReply.authorId);
    }
  }

  const topicAuthor = await userQueries.getById(topicData.authorId);
  const newContent = content.replace(`@${topicAuthor?.loginname} `, "");
  await sendMessageToMentionUsers(newContent, topicId, user.id, newReply.id, mentionExcludes);

  return c.json({ success: true as const, reply_id: String(newReply.id) }, 200);
});

const getReplyRoute = createRoute({
  method: "get",
  path: "/reply/{reply_id}",
  tags: ["replies"],
  summary: "获取回复（编辑用）",
  description: "获取回复详情用于编辑。需要登录且为作者或管理员。",
  request: {
    params: z.object({ reply_id: z.string() }),
    query: z.object({ accesstoken: z.string().optional() }),
  },
  responses: {
    200: {
      description: "回复详情",
      content: {
        "application/json": {
          schema: z.object({ success: z.literal(true), data: replyDTOSchema }),
        },
      },
    },
    401: {
      description: "未登录",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "无权限",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "回复或话题不存在",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

reply.openapi(getReplyRoute, async (c) => {
  const user = await requestUser(c, c.req.valid("query").accesstoken);
  if (!user) {
    return c.json({ success: false as const, error_msg: "未登录" }, 401);
  }

  const { reply_id } = c.req.valid("param");
  const replyId = Number(reply_id);
  const replyData = await replyQueries.getById(replyId);
  if (!replyData || replyData.deleted) {
    return c.json({ success: false as const, error_msg: "评论不存在" }, 404);
  }
  const topicData = await topicQueries.getById(replyData.topicId);
  if (!topicData || topicData.deleted) {
    return c.json({ success: false as const, error_msg: "话题不存在" }, 404);
  }
  if (replyData.authorId !== user.id && !c.get("isAdmin")) {
    return c.json({ success: false as const, error_msg: "无权限编辑" }, 403);
  }

  return c.json(
    {
      success: true as const,
      data: {
        id: String(replyData.id),
        topic_id: String(replyData.topicId),
        content: replyData.content ?? "",
        create_at: replyData.createAt?.toISOString() ?? "",
        update_at: replyData.updateAt ? replyData.updateAt.toISOString() : null,
      },
    },
    200,
  );
});

const editReplyRoute = createRoute({
  method: "post",
  path: "/reply/{reply_id}/edit",
  tags: ["replies"],
  summary: "编辑回复",
  description: "作者或管理员可编辑。锁定的话题仅管理员可编辑。",
  request: {
    params: z.object({ reply_id: z.string() }),
    body: { content: { "application/json": { schema: editReplyBodySchema } } },
  },
  responses: {
    200: {
      description: "编辑成功",
      content: {
        "application/json": {
          schema: z.object({ success: z.literal(true), reply_id: z.string() }),
        },
      },
    },
    401: {
      description: "未登录",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "无权限或话题锁定",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "回复或话题不存在",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    422: {
      description: "包含敏感词",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

reply.openapi(editReplyRoute, async (c) => {
  const { reply_id } = c.req.valid("param");
  const body = c.req.valid("json");
  const user = await requestUser(c, body.accesstoken);
  if (!user) {
    return c.json({ success: false as const, error_msg: "未登录" }, 401);
  }

  const replyId = Number(reply_id);
  const replyData = await replyQueries.getById(replyId);
  if (!replyData || replyData.deleted) {
    return c.json({ success: false as const, error_msg: "评论不存在" }, 404);
  }
  const topicData = await topicQueries.getById(replyData.topicId);
  if (!topicData || topicData.deleted) {
    return c.json({ success: false as const, error_msg: "话题不存在" }, 404);
  }
  if (topicData.lock && !c.get("isAdmin")) {
    return c.json({ success: false as const, error_msg: "话题已锁定" }, 403);
  }
  if (replyData.authorId !== user.id && !c.get("isAdmin")) {
    return c.json({ success: false as const, error_msg: "无权限编辑" }, 403);
  }

  const contentCheck = await checkContent(body.content);
  if (contentCheck.hit) {
    return c.json(
      {
        success: false as const,
        error_msg: `回复内容包含敏感词: ${contentCheck.words.join(", ")}`,
      },
      422,
    );
  }

  await replyQueries.updateContent(replyId, body.content);
  await sendMessageToMentionUsers(body.content, topicData.id, user.id, replyId);

  return c.json({ success: true as const, reply_id: String(replyId) }, 200);
});

const deleteReplyRoute = createRoute({
  method: "post",
  path: "/reply/{reply_id}/delete",
  tags: ["replies"],
  summary: "删除回复",
  description: "作者或管理员可删除。软删除。",
  request: {
    params: z.object({ reply_id: z.string() }),
    body: { content: { "application/json": { schema: deleteReplyBodySchema } } },
  },
  responses: {
    200: {
      description: "删除成功",
      content: {
        "application/json": { schema: z.object({ success: z.literal(true), status: z.string() }) },
      },
    },
    401: {
      description: "未登录",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "无权限",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "回复不存在",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    422: {
      description: "回复已删除",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

reply.openapi(deleteReplyRoute, async (c) => {
  const { reply_id } = c.req.valid("param");
  const body = c.req.valid("json");
  const user = await requestUser(c, body.accesstoken || c.req.query("accesstoken"));
  if (!user) {
    return c.json({ success: false as const, error_msg: "未登录" }, 401);
  }

  const replyId = Number(reply_id);
  const result = await replyQueries.deleteWithAggregates(replyId, user.id, !!c.get("isAdmin"));
  if (result.status === "not_found") {
    return c.json({ success: false as const, error_msg: "评论不存在" }, 404);
  }
  if (result.status === "already_deleted") {
    return c.json({ success: false as const, error_msg: "评论已删除" }, 422);
  }
  if (result.status === "forbidden") {
    return c.json({ success: false as const, error_msg: "无权限删除" }, 403);
  }

  return c.json({ success: true as const, status: "success" }, 200);
});

const upsReplyRoute = createRoute({
  method: "post",
  path: "/reply/{reply_id}/ups",
  tags: ["replies"],
  summary: "回复点赞/取消点赞",
  description: "切换点赞状态。不能给自己的回复点赞（非 dev 模式）。",
  request: {
    params: z.object({ reply_id: z.string() }),
    body: { content: { "application/json": { schema: upsBodySchema } } },
  },
  responses: {
    200: {
      description: "操作成功",
      content: {
        "application/json": {
          schema: z.object({ success: z.literal(true), action: z.enum(["up", "down"]) }),
        },
      },
    },
    401: {
      description: "未登录",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "不能给自己点赞",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "回复不存在",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

reply.openapi(upsReplyRoute, async (c) => {
  const { reply_id } = c.req.valid("param");
  const body = c.req.valid("json");
  const user = await requestUser(c, body.accesstoken || c.req.query("accesstoken"));
  if (!user) {
    return c.json({ success: false as const, error_msg: "未登录" }, 401);
  }

  const replyId = Number(reply_id);
  const replyData = await replyQueries.getById(replyId);

  if (!replyData) {
    return c.json({ success: false as const, error_msg: "评论不存在" }, 404);
  }

  if (replyData.authorId === user.id && process.env.CNODE_ENV !== "development") {
    return c.json({ success: false as const, error_msg: "不能帮自己点赞" }, 403);
  }

  const action = await replyQueries.toggleUp(replyId, user.id);
  return c.json({ success: true as const, action }, 200);
});

export { reply as replyRoutes };
