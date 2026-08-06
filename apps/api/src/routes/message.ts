import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import {
  getMessagesCount,
  getReadMessagesByUserId,
  getUnreadMessagesByUserId,
  getMessageRelations,
  updateMessagesToRead,
  updateOneMessageToRead,
} from "../lib/message";
import { renderMarkdown } from "../lib/markdown";
import type { AuthVars } from "../middleware/auth";
import {
  errorResponseSchema,
  markAllBodySchema,
  markOneBodySchema,
  mdrenderQuerySchema,
  messageDTOSchema,
  msgIdParamSchema,
} from "@cnode/shared";

const message = new OpenAPIHono<{ Variables: AuthVars }>();

// GET /messages
const listMessagesRoute = createRoute({
  method: "get",
  path: "/messages",
  tags: ["messages"],
  summary: "获取消息列表",
  request: { query: mdrenderQuerySchema.extend({ accesstoken: z.string().optional() }) },
  responses: {
    200: {
      description: "消息列表",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              has_read_messages: z.array(messageDTOSchema),
              hasnot_read_messages: z.array(messageDTOSchema),
            }),
          }),
        },
      },
    },
    401: {
      description: "未登录",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});
message.openapi(listMessagesRoute, async (c) => {
  let currentUser = c.get("user");
  const { accesstoken, mdrender } = c.req.valid("query");
  if (accesstoken && !currentUser) {
    const { userQueries } = await import("../lib/db");
    currentUser = (await userQueries.getByToken(accesstoken)) || undefined;
  }
  if (!currentUser) return c.json({ success: false as const, error_msg: "未登录" }, 401);
  const [readMsgs, unreadMsgs] = await Promise.all([
    getReadMessagesByUserId(currentUser.id),
    getUnreadMessagesByUserId(currentUser.id),
  ]);
  const formatMessage = async (msg: (typeof readMsgs)[number]) => {
    const relations = await getMessageRelations(msg);
    if (!relations.author?.loginname || !relations.topic) return null;
    const { author, topic } = relations;
    return {
      id: String(relations.id),
      // Legacy rows migrated from Mongo may carry other type values; they pass
      // through on the wire unchanged, matching the previous behavior.
      type: relations.type as "at" | "reply" | "reply2",
      has_read: !!relations.hasRead,
      create_at: relations.createAt?.toISOString() ?? "",
      author: { loginname: author.loginname, avatar_url: author.avatar ?? "" },
      topic: {
        id: String(topic.id),
        author: topic.author
          ? { loginname: topic.author.loginname, avatar_url: topic.author.avatar ?? "" }
          : { loginname: "", avatar_url: "" },
        title: topic.title ?? "",
        last_reply_at: topic.lastReplyAt ? topic.lastReplyAt.toISOString() : null,
      },
      reply: relations.reply
        ? {
            id: String(relations.reply.id),
            content: renderMarkdown(relations.reply.content, mdrender),
            ups: [],
            create_at: relations.reply.createAt?.toISOString() ?? "",
          }
        : { id: "", content: "", ups: [], create_at: "" },
    };
  };
  const [hasReadRaw, hasUnreadRaw] = await Promise.all([
    Promise.all(readMsgs.map(formatMessage)),
    Promise.all(unreadMsgs.map(formatMessage)),
  ]);
  const hasRead = hasReadRaw.filter((msg) => msg !== null);
  const hasUnread = hasUnreadRaw.filter((msg) => msg !== null);
  return c.json(
    {
      success: true as const,
      data: { has_read_messages: hasRead, hasnot_read_messages: hasUnread },
    },
    200,
  );
});

// GET /message/count
const messageCountRoute = createRoute({
  method: "get",
  path: "/message/count",
  tags: ["messages"],
  summary: "获取未读消息数",
  request: { query: z.object({ accesstoken: z.string().optional() }) },
  responses: {
    200: {
      description: "未读数",
      content: {
        "application/json": { schema: z.object({ success: z.literal(true), data: z.number() }) },
      },
    },
    401: {
      description: "未登录",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});
message.openapi(messageCountRoute, async (c) => {
  let currentUser = c.get("user");
  const { accesstoken } = c.req.valid("query");
  if (accesstoken && !currentUser) {
    const { userQueries } = await import("../lib/db");
    currentUser = (await userQueries.getByToken(accesstoken)) || undefined;
  }
  if (!currentUser) return c.json({ success: false as const, error_msg: "未登录" }, 401);
  const count = await getMessagesCount(currentUser.id);
  return c.json({ success: true as const, data: count }, 200);
});

// POST /message/mark_all
const markAllRoute = createRoute({
  method: "post",
  path: "/message/mark_all",
  tags: ["messages"],
  summary: "标记全部已读",
  request: { body: { content: { "application/json": { schema: markAllBodySchema } } } },
  responses: {
    200: {
      description: "成功",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            marked_msgs: z.array(z.object({ id: z.string() })),
          }),
        },
      },
    },
    401: {
      description: "未登录",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});
message.openapi(markAllRoute, async (c) => {
  const body = c.req.valid("json");
  let currentUser = c.get("user");
  const accesstoken = body.accesstoken || c.req.query("accesstoken");
  if (accesstoken && !currentUser) {
    const { userQueries } = await import("../lib/db");
    currentUser = (await userQueries.getByToken(accesstoken)) || undefined;
  }
  if (!currentUser) return c.json({ success: false as const, error_msg: "未登录" }, 401);
  const unread = await getUnreadMessagesByUserId(currentUser.id);
  await updateMessagesToRead(
    currentUser.id,
    unread.map((m) => m.id),
  );
  return c.json(
    { success: true as const, marked_msgs: unread.map((m) => ({ id: String(m.id) })) },
    200,
  );
});

// POST /message/mark_one/:msg_id
const markOneRoute = createRoute({
  method: "post",
  path: "/message/mark_one/{msg_id}",
  tags: ["messages"],
  summary: "标记单条已读",
  request: {
    params: msgIdParamSchema,
    body: { content: { "application/json": { schema: markOneBodySchema } } },
  },
  responses: {
    200: {
      description: "成功",
      content: {
        "application/json": {
          schema: z.object({ success: z.literal(true), marked_msg_id: z.string() }),
        },
      },
    },
    401: {
      description: "未登录",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});
message.openapi(markOneRoute, async (c) => {
  const { msg_id } = c.req.valid("param");
  const body = c.req.valid("json");
  let currentUser = c.get("user");
  const accesstoken = body.accesstoken || c.req.query("accesstoken");
  if (accesstoken && !currentUser) {
    const { userQueries } = await import("../lib/db");
    currentUser = (await userQueries.getByToken(accesstoken)) || undefined;
  }
  if (!currentUser) return c.json({ success: false as const, error_msg: "未登录" }, 401);
  const msgId = Number(msg_id);
  await updateOneMessageToRead(msgId);
  return c.json({ success: true as const, marked_msg_id: String(msgId) }, 200);
});

export { message as messageRoutes };
