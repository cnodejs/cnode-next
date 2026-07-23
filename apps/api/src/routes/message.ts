import { Hono } from "hono";
import {
  getMessagesCount,
  getReadMessagesByUserId,
  getUnreadMessagesByUserId,
  getMessageRelations,
  updateMessagesToRead,
  updateOneMessageToRead,
} from "../lib/message";
import { linkUsers } from "@cnode/shared";
import type { AuthVars } from "../middleware/auth";

const message = new Hono<{
  Variables: AuthVars;
}>();

message.get("/messages", async (c) => {
  const user = c.get("user");
  let currentUser = user;

  const accesstoken = c.req.query("accesstoken");
  if (accesstoken && !currentUser) {
    const { userQueries } = await import("../lib/db");
    currentUser = (await userQueries.getByToken(accesstoken)) || undefined;
  }

  if (!currentUser) {
    return c.json({ success: false, error_msg: "未登录" }, 401);
  }

  const mdrender = c.req.query("mdrender") !== "false";

  const [readMsgs, unreadMsgs] = await Promise.all([
    getReadMessagesByUserId(currentUser.id),
    getUnreadMessagesByUserId(currentUser.id),
  ]);

  const formatMessage = async (msg: any) => {
    const relations = await getMessageRelations(msg);
    return {
      id: String(relations.id),
      type: relations.type,
      has_read: !!relations.hasRead,
      create_at: relations.createAt,
      author: relations.author
        ? {
            loginname: relations.author.loginname,
            avatar_url: relations.author.avatar,
          }
        : { loginname: "", avatar_url: "" },
      topic: relations.topic
        ? {
            id: String(relations.topic.id),
            author: relations.topic.author
              ? {
                  loginname: relations.topic.author.loginname,
                  avatar_url: relations.topic.author.avatar,
                }
              : { loginname: "", avatar_url: "" },
            title: relations.topic.title,
            last_reply_at: relations.topic.lastReplyAt,
          }
        : null,
      reply: relations.reply
        ? {
            id: String(relations.reply.id),
            content: mdrender ? linkUsers(relations.reply.content) : relations.reply.content,
            ups: [],
            create_at: relations.reply.createAt,
          }
        : {},
    };
  };

  const [hasRead, hasUnread] = await Promise.all([
    Promise.all(readMsgs.map(formatMessage)),
    Promise.all(unreadMsgs.map(formatMessage)),
  ]);

  return c.json({
    success: true,
    data: {
      has_read_messages: hasRead,
      hasnot_read_messages: hasUnread,
    },
  });
});

message.get("/message/count", async (c) => {
  const user = c.get("user");
  let currentUser = user;

  const accesstoken = c.req.query("accesstoken");
  if (accesstoken && !currentUser) {
    const { userQueries } = await import("../lib/db");
    currentUser = (await userQueries.getByToken(accesstoken)) || undefined;
  }

  if (!currentUser) {
    return c.json({ success: false, error_msg: "未登录" }, 401);
  }

  const count = await getMessagesCount(currentUser.id);
  return c.json({ success: true, data: count });
});

message.post("/message/mark_all", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ success: false, error_msg: "未登录" }, 401);
  }

  const unread = await getUnreadMessagesByUserId(user.id);
  await updateMessagesToRead(
    user.id,
    unread.map((m) => m.id),
  );

  return c.json({
    success: true,
    marked_msgs: unread.map((m) => ({ id: String(m.id) })),
  });
});

message.post("/message/mark_one/:msg_id", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ success: false, error_msg: "未登录" }, 401);
  }

  const msgId = Number(c.req.param("msg_id"));
  await updateOneMessageToRead(msgId);

  return c.json({ success: true, marked_msg_id: String(msgId) });
});

export { message as messageRoutes };
