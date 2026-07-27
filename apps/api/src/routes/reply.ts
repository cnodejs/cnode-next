import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { replyQueries, topicQueries, userQueries } from "../lib/db";
import { decrementScoreAndReplyCount, incrementScoreAndReplyCount } from "../lib/score";
import { sendMessageToMentionUsers } from "../lib/at";
import { sendReplyMessage, sendReply2Message } from "../lib/message";
import { checkContent } from "../lib/moderation";
import { perUserPerDaySetting } from "../middleware/rate-limit";
import type { AuthVars } from "../middleware/auth";
import { ensureMuteNotExpired } from "../lib/penalty";
import { requestIp, verifyTurnstile } from "../lib/turnstile";

const reply = new Hono<{
  Variables: AuthVars;
}>();

const CREATE_REPLY_SCORE = 5;
const CREATE_REPLY_PER_DAY = 1000;

const createReplySchema = z.object({
  accesstoken: z.string().optional(),
  content: z.string().min(1),
  reply_id: z.string().optional(),
  turnstileToken: z.string().optional(),
});

const editReplySchema = z.object({
  accesstoken: z.string().optional(),
  content: z.string().min(1),
});

async function requestUser(c: any, accesstoken?: string) {
  const user = c.get("user");
  if (user) return user;
  if (!accesstoken) return null;
  return userQueries.getByToken(accesstoken);
}

reply.post(
  "/topic/:topic_id/replies",
  zValidator("json", createReplySchema),
  perUserPerDaySetting("create_reply", "rate_reply", CREATE_REPLY_PER_DAY, true),
  async (c) => {
  let user = c.get("user");
  if (!user) {
    return c.json({ success: false, error_msg: "未登录" }, 401);
  }
  user = await ensureMuteNotExpired(user);
  if (user.isMuted || user.isBlock) {
    return c.json({ success: false, error_msg: "您已被禁言" }, 403);
  }

  const topicId = Number(c.req.param("topic_id"));
  const { content, reply_id, turnstileToken } = c.req.valid("json");

  if (!(await verifyTurnstile(turnstileToken, requestIp(c)))) {
    return c.json({ success: false, error_msg: "人机验证失败" }, 403);
  }

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
  await incrementScoreAndReplyCount(user.id, CREATE_REPLY_SCORE, 1);

  // Send reply message to topic author
  if (topicData.authorId !== user.id) {
    await sendReplyMessage(topicData.authorId, user.id, topicId, newReply.id);
  }

  // Send reply2 message if replying to a reply
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

  // Process @mentions
  const topicAuthor = await userQueries.getById(topicData.authorId);
  const newContent = content.replace(`@${topicAuthor?.loginname} `, "");
  await sendMessageToMentionUsers(newContent, topicId, user.id, newReply.id, mentionExcludes);

    return c.json({ success: true, reply_id: String(newReply.id) });
  },
);

reply.get("/reply/:id", async (c) => {
  const user = await requestUser(c, c.req.query("accesstoken"));
  if (!user) {
    return c.json({ success: false, error_msg: "未登录" }, 401);
  }

  const replyId = Number(c.req.param("id"));
  const replyData = await replyQueries.getById(replyId);
  if (!replyData || replyData.deleted) {
    return c.json({ success: false, error_msg: "评论不存在" }, 404);
  }
  const topicData = await topicQueries.getById(replyData.topicId);
  if (!topicData || topicData.deleted) {
    return c.json({ success: false, error_msg: "话题不存在" }, 404);
  }
  if (replyData.authorId !== user.id && !c.get("isAdmin")) {
    return c.json({ success: false, error_msg: "无权限编辑" }, 403);
  }

  return c.json({
    success: true,
    data: {
      id: String(replyData.id),
      topic_id: String(replyData.topicId),
      content: replyData.content,
      create_at: replyData.createAt,
      update_at: replyData.updateAt,
    },
  });
});

reply.post("/reply/:id/edit", zValidator("json", editReplySchema), async (c) => {
  const body = c.req.valid("json");
  const user = await requestUser(c, body.accesstoken);
  if (!user) {
    return c.json({ success: false, error_msg: "未登录" }, 401);
  }

  const replyId = Number(c.req.param("id"));
  const replyData = await replyQueries.getById(replyId);
  if (!replyData || replyData.deleted) {
    return c.json({ success: false, error_msg: "评论不存在" }, 404);
  }
  const topicData = await topicQueries.getById(replyData.topicId);
  if (!topicData || topicData.deleted) {
    return c.json({ success: false, error_msg: "话题不存在" }, 404);
  }
  if (topicData.lock && !c.get("isAdmin")) {
    return c.json({ success: false, error_msg: "话题已锁定" }, 403);
  }
  if (replyData.authorId !== user.id && !c.get("isAdmin")) {
    return c.json({ success: false, error_msg: "无权限编辑" }, 403);
  }

  const contentCheck = await checkContent(body.content);
  if (contentCheck.hit) {
    return c.json(
      { success: false, error_msg: `回复内容包含敏感词: ${contentCheck.words.join(", ")}` },
      422,
    );
  }

  await replyQueries.updateContent(replyId, body.content);
  await sendMessageToMentionUsers(body.content, topicData.id, user.id, replyId);

  return c.json({ success: true, reply_id: String(replyId) });
});

reply.post("/reply/:id/delete", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const user = await requestUser(c, body.accesstoken || c.req.query("accesstoken"));
  if (!user) {
    return c.json({ success: false, error_msg: "未登录" }, 401);
  }

  const replyId = Number(c.req.param("id"));
  const replyData = await replyQueries.getById(replyId);
  if (!replyData) {
    return c.json({ success: false, error_msg: "评论不存在" }, 404);
  }
  if (replyData.deleted) {
    return c.json({ success: false, error_msg: "评论已删除" }, 422);
  }
  if (replyData.authorId !== user.id && !c.get("isAdmin")) {
    return c.json({ success: false, error_msg: "无权限删除" }, 403);
  }

  await replyQueries.softDelete(replyId);
  await decrementScoreAndReplyCount(replyData.authorId, CREATE_REPLY_SCORE, 1);
  await topicQueries.decrementReplyCount(replyData.topicId);

  return c.json({ success: true, status: "success" });
});

reply.post("/reply/:reply_id/ups", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const user = await requestUser(c, body.accesstoken || c.req.query("accesstoken"));
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

  const action = await replyQueries.toggleUp(replyId, user.id);
  return c.json({ success: true, action });
});

export { reply as replyRoutes };
