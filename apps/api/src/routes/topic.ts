import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import _ from "lodash";
import { topicQueries, userQueries, replyQueries } from "../lib/db";
import { linkUsers } from "@cnode/shared";
import { SCORES } from "@cnode/shared";
import { incrementScoreAndTopicCount } from "../lib/score";
import { sendMessageToMentionUsers } from "../lib/at";
import { checkContent } from "../lib/moderation";
import { excerptMarkdown, userSummary } from "../lib/format";
import type { AuthVars } from "../middleware/auth";

const topic = new Hono<{
  Variables: AuthVars;
}>();

const allTabs = ["share", "ask", "job"];

function renderContent(content: string, mdrender: boolean): string {
  if (!mdrender) return content;
  // TODO: markdown render
  return linkUsers(content);
}

topic.get("/topics", async (c) => {
  const page = Math.max(1, Number(c.req.query("page")) || 1);
  const limit = Math.min(100, Number(c.req.query("limit")) || 20);
  const tab = c.req.query("tab") || "all";
  const mdrender = c.req.query("mdrender") !== "false";

  const query: any = {};
  if (!tab || tab === "all") {
    query.excludeTabs = ["job", "dev"];
  } else if (tab === "good") {
    query.good = 1;
  } else {
    query.tab = tab;
  }
  query.deleted = 0;

  const topicsList = await topicQueries.getByQuery(query, {
    limit,
    offset: (page - 1) * limit,
  });

  const data = await Promise.all(
    topicsList.map(async (t) => {
      const author = await userQueries.getById(t.authorId);
      return {
        id: String(t.id),
        author_id: String(t.authorId),
        tab: t.tab,
        content: renderContent(t.content, mdrender),
        title: t.title,
        last_reply_at: t.lastReplyAt,
        good: !!t.good,
        top: !!t.top,
        reply_count: t.replyCount,
        visit_count: t.visitCount,
        create_at: t.createAt,
        author: userSummary(author),
      };
    }),
  );

  return c.json({ success: true, data });
});

topic.get("/topic/:id", async (c) => {
  const id = Number(c.req.query("id") || c.req.param("id"));
  if (!id || Number.isNaN(id)) {
    return c.json({ success: false, error_msg: "不是有效的话题id" }, 400);
  }

  const mdrender = c.req.query("mdrender") !== "false";
  const accesstoken = c.req.query("accesstoken");

  let currentUser: any = null;
  if (accesstoken) {
    currentUser = await userQueries.getByToken(accesstoken);
  } else {
    currentUser = c.get("user") || null;
  }

  const topicData = await topicQueries.getById(id);
  if (!topicData || topicData.deleted) {
    return c.json({ success: false, error_msg: "话题不存在" }, 404);
  }

  await topicQueries.incrementVisitCount(id);

  const author = await userQueries.getById(topicData.authorId);
  const repliesList = await replyQueries.getByTopicId(id);

  const replyMap = new Map(repliesList.map((reply) => [reply.id, reply]));
  const repliesData = await Promise.all(
    repliesList.map(async (r) => {
      const replyAuthor = await userQueries.getById(r.authorId);
      const parentReply = r.replyId
        ? replyMap.get(r.replyId) || (await replyQueries.getById(r.replyId))
        : null;
      const parentAuthor = parentReply ? await userQueries.getById(parentReply.authorId) : null;
      return {
        id: String(r.id),
        author: userSummary(replyAuthor),
        content: renderContent(r.content, mdrender),
        ups: [],
        create_at: r.createAt,
        reply_id: r.replyId ? String(r.replyId) : null,
        reply_to: parentReply
          ? {
              id: String(parentReply.id),
              author: userSummary(parentAuthor),
              content_excerpt: excerptMarkdown(parentReply.content),
              deleted: !!parentReply.deleted,
            }
          : null,
        is_uped: false,
      };
    }),
  );

  const result: any = {
    id: String(topicData.id),
    author_id: String(topicData.authorId),
    tab: topicData.tab,
    content: renderContent(topicData.content, mdrender),
    title: topicData.title,
    last_reply_at: topicData.lastReplyAt,
    good: !!topicData.good,
    top: !!topicData.top,
    reply_count: topicData.replyCount,
    visit_count: topicData.visitCount,
    create_at: topicData.createAt,
    author: userSummary(author),
    replies: repliesData,
    is_collect: false,
  };

  // TODO: check is_collect if currentUser

  return c.json({ success: true, data: result });
});

const createTopicSchema = z.object({
  accesstoken: z.string().optional(),
  title: z.string().min(5).max(100),
  tab: z.enum(["share", "ask", "job"]),
  content: z.string().min(1),
});

topic.post("/topics", zValidator("json", createTopicSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ success: false, error_msg: "未登录" }, 401);
  }
  if (user.isBlock) {
    return c.json({ success: false, error_msg: "您已被禁言" }, 403);
  }

  const { title, tab, content } = c.req.valid("json");

  const titleCheck = await checkContent(title);
  if (titleCheck.hit) {
    return c.json(
      { success: false, error_msg: `标题包含敏感词: ${titleCheck.words.join(", ")}` },
      422,
    );
  }
  const contentCheck = await checkContent(content);
  if (contentCheck.hit) {
    return c.json(
      { success: false, error_msg: `内容包含敏感词: ${contentCheck.words.join(", ")}` },
      422,
    );
  }

  const newTopic = await topicQueries.newAndSave(title, content, tab, user.id);
  await incrementScoreAndTopicCount(user.id, SCORES.CREATE_TOPIC, 1);
  await sendMessageToMentionUsers(content, newTopic.id, user.id);

  return c.json({ success: true, topic_id: String(newTopic.id) });
});

const updateTopicSchema = z.object({
  accesstoken: z.string().optional(),
  topic_id: z.string().min(1),
  title: z.string().min(5).max(100),
  tab: z.enum(["share", "ask", "job"]),
  content: z.string().min(1),
});

topic.post("/topics/update", zValidator("json", updateTopicSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ success: false, error_msg: "未登录" }, 401);
  }

  const { topic_id, title, tab, content } = c.req.valid("json");
  const tid = Number(topic_id);

  const titleCheck = await checkContent(title);
  if (titleCheck.hit) {
    return c.json(
      { success: false, error_msg: `标题包含敏感词: ${titleCheck.words.join(", ")}` },
      422,
    );
  }
  const contentCheck = await checkContent(content);
  if (contentCheck.hit) {
    return c.json(
      { success: false, error_msg: `内容包含敏感词: ${contentCheck.words.join(", ")}` },
      422,
    );
  }

  const topicData = await topicQueries.getById(tid);
  if (!topicData) {
    return c.json({ success: false, error_msg: "话题不存在" }, 404);
  }

  if (topicData.authorId !== user.id && !c.get("isAdmin")) {
    return c.json({ success: false, error_msg: "无权限编辑" }, 403);
  }

  // TODO: update topic
  await sendMessageToMentionUsers(content, tid, user.id);

  return c.json({ success: true, topic_id: String(tid) });
});

export { topic as topicRoutes };
