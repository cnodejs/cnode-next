import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { topicQueries, userQueries } from "../lib/db";
import { getDb } from "../lib/db";
import { topicCollects } from "@cnode/db";
import { eq, and } from "drizzle-orm";
import { incrementCollectTopicCount, decrementCollectTopicCount } from "../lib/score";
import { linkUsers } from "@cnode/shared";
import _ from "lodash";
import type { AuthVars } from "../middleware/auth";

const collect = new Hono<{
  Variables: AuthVars;
}>();

collect.get("/topic_collect/:loginname", async (c) => {
  const loginname = c.req.param("loginname");
  const userData = await userQueries.getByLoginName(loginname);

  if (!userData) {
    return c.json({ success: false, error_msg: "用户不存在" }, 404);
  }

  const db = getDb();
  const collects = await db
    .select()
    .from(topicCollects)
    .where(eq(topicCollects.userId, userData.id))
    .limit(100);

  const ids = collects.map((doc) => doc.topicId);

  if (ids.length === 0) {
    return c.json({ success: true, data: [] });
  }

  const topics = await Promise.all(ids.map((id) => topicQueries.getById(id)));

  const data = await Promise.all(
    topics.filter(Boolean).map(async (t: any) => {
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
          ? { loginname: author.loginname, avatar_url: author.avatar }
          : { loginname: "", avatar_url: "" },
      };
    }),
  );

  return c.json({ success: true, data });
});

const collectSchema = z.object({
  accesstoken: z.string().optional(),
  topic_id: z.string().min(1),
});

collect.post("/topic_collect/collect", zValidator("json", collectSchema), async (c) => {
  const { topic_id, accesstoken } = c.req.valid("json");
  let user = c.get("user");
  if (!user && accesstoken) {
    user = await userQueries.getByToken(accesstoken);
  }
  if (!user) {
    return c.json({ success: false, error_msg: "未登录" }, 401);
  }

  const tid = Number(topic_id);

  const topicData = await topicQueries.getById(tid);
  if (!topicData) {
    return c.json({ success: false, error_msg: "话题不存在" }, 404);
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(topicCollects)
    .where(and(eq(topicCollects.userId, user.id), eq(topicCollects.topicId, tid)))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ success: false, error_msg: "已经收藏过该主题" });
  }

  await db.insert(topicCollects).values({
    userId: user.id,
    topicId: tid,
    createAt: new Date().toISOString(),
  });

  await incrementCollectTopicCount(user.id);
  await topicQueries.incrementCollectCount(tid);

  return c.json({ success: true });
});

collect.post("/topic_collect/de_collect", zValidator("json", collectSchema), async (c) => {
  const { topic_id, accesstoken } = c.req.valid("json");
  let user = c.get("user");
  if (!user && accesstoken) {
    user = await userQueries.getByToken(accesstoken);
  }
  if (!user) {
    return c.json({ success: false, error_msg: "未登录" }, 401);
  }

  const tid = Number(topic_id);

  const topicData = await topicQueries.getById(tid);
  if (!topicData) {
    return c.json({ success: false, error_msg: "话题不存在" }, 404);
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(topicCollects)
    .where(and(eq(topicCollects.userId, user.id), eq(topicCollects.topicId, tid)))
    .limit(1);
  if (existing.length === 0) {
    return c.json({ success: false, error_msg: "尚未收藏该主题" });
  }

  await db
    .delete(topicCollects)
    .where(and(eq(topicCollects.userId, user.id), eq(topicCollects.topicId, tid)));

  await decrementCollectTopicCount(user.id);
  await topicQueries.decrementCollectCount(tid);

  return c.json({ success: true });
});

export { collect as collectRoutes };
