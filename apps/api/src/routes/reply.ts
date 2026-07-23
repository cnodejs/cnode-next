import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { replyQueries, topicQueries, userQueries } from "../lib/db";
import { linkUsers } from "@cnode/shared";
import { SCORES } from "@cnode/shared";
import { incrementScoreAndReplyCount } from "../lib/score";
import { sendMessageToMentionUsers } from "../lib/at";
import { sendReplyMessage, sendReply2Message } from "../lib/message";
import { checkContent } from "../lib/moderation";
import type { AuthVars } from "../middleware/auth";

const reply = new Hono<{
  Variables: AuthVars;
}>();

const createReplySchema = z.object({
  accesstoken: z.string().optional(),
  content: z.string().min(1),
  reply_id: z.string().optional(),
});

reply.post("/topic/:topic_id/replies", zValidator("json", createReplySchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ success: false, error_msg: "未登录" }, 401);
  }
  if (user.isBlock) {
    return c.json({ success: false, error_msg: "您已被禁言" }, 403);
  }

  const topicId = Number(c.req.param("topic_id"));
  const { content, reply_id } = c.req.valid("json");

  const contentCheck = await checkContent(content);
  if (contentCheck.hit) {
    return c.json(
      { success: false, error_msg: `回复内容包含敏感词: ${contentCheck.words.join(", ")}` },
      422,
    );
  }

  const topicData = await topicQueries.getById(topicId);
  if (!topicData) {
    return c.json({ success: false, error_msg: "话题不存在" }, 404);
  }
  if (topicData.lock) {
    return c.json({ success: false, error_msg: "该话题已被锁定" }, 403);
  }

  const replyId = reply_id ? Number(reply_id) : undefined;
  const newReply = await replyQueries.newAndSave(content, topicId, user.id, replyId);

  await topicQueries.updateLastReply(topicId, newReply.id);
  await incrementScoreAndReplyCount(user.id, SCORES.CREATE_REPLY, 1);

  // Send reply message to topic author
  if (topicData.authorId !== user.id) {
    await sendReplyMessage(topicData.authorId, user.id, topicId, newReply.id);
  }

  // Send reply2 message if replying to a reply
  if (replyId) {
    const parentReply = await replyQueries.getById(replyId);
    if (
      parentReply &&
      parentReply.authorId !== user.id &&
      parentReply.authorId !== topicData.authorId
    ) {
      await sendReply2Message(parentReply.authorId, user.id, topicId, newReply.id);
    }
  }

  // Process @mentions
  const topicAuthor = await userQueries.getById(topicData.authorId);
  const newContent = content.replace(`@${topicAuthor?.loginname} `, "");
  await sendMessageToMentionUsers(newContent, topicId, user.id, newReply.id);

  return c.json({ success: true, reply_id: String(newReply.id) });
});

reply.post("/reply/:reply_id/ups", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ success: false, error_msg: "未登录" }, 401);
  }

  const replyId = Number(c.req.param("reply_id"));
  const replyData = await replyQueries.getById(replyId);

  if (!replyData) {
    return c.json({ success: false, error_msg: "评论不存在" }, 404);
  }

  if (replyData.authorId === user.id && process.env.APP_ENV !== "development") {
    return c.json({ success: false, error_msg: "不能帮自己点赞" }, 403);
  }

  // TODO: implement reply_ups insert/delete
  // For now just return action
  return c.json({ success: true, action: "up" });
});

export { reply as replyRoutes };
