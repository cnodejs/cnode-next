import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { and, desc, sql } from "drizzle-orm";
import { replies, topics, users } from "@cnode/db";
import { getDb, userQueries, topicQueries } from "../lib/db";
import { excerptMarkdown, userSummary } from "../lib/format";
import { boolEq } from "../lib/db-compat";
import { sidebarHomeResponseSchema } from "@cnode/shared";

const community = new OpenAPIHono();
const INTERNAL_TABS = ["dev", "test"];

function publicTopicSql(topicId: any = topics.id) {
  return sql`${boolEq(topics.deleted, false)} and coalesce(${topics.status}, 'published') <> 'deleted' and (${topics.tab} is null or ${topics.tab} not in (${sql.join(INTERNAL_TABS.map((tab) => sql`${tab}`), sql`, `)})) and exists (select 1 from ${users} where ${users.id} = ${topics.authorId} and ${boolEq(users.isBlock, false)}) and ${topics.id} = ${topicId}`;
}

const sidebarHomeRoute = createRoute({
  method: "get", path: "/sidebar/home", tags: ["system config"], summary: "首页侧边栏数据",
  responses: { 200: { description: "侧边栏数据", content: { "application/json": { schema: z.object({ success: z.literal(true), data: sidebarHomeResponseSchema }) } } } },
});
community.openapi(sidebarHomeRoute, async (c) => {
  const db = getDb();
  const replyNotDeleted = boolEq(replies.deleted, false);
  const replyTopicVisible = sql`exists (select 1 from ${topics} where ${publicTopicSql(replies.topicId)})`;
  const [latestRepliesRaw, noReplyTopicsRaw, topUsersRaw] = await Promise.all([
    db.select().from(replies).where(and(replyNotDeleted, replyTopicVisible)).orderBy(desc(replies.createAt)).limit(5),
    db.select().from(topics).where(sql`${publicTopicSql()} and ${topics.replyCount} = 0`).orderBy(desc(topics.createAt)).limit(5),
    db.select().from(users).orderBy(desc(users.score)).limit(5),
  ]);
  const latestReplies = await Promise.all(
    latestRepliesRaw.map(async (reply: any) => {
      const [author, topic] = await Promise.all([userQueries.getById(reply.authorId), topicQueries.getById(reply.topicId)]);
      return { id: String(reply.id), topic_id: String(reply.topicId), topic_title: topic?.title || "已删除的话题", author: userSummary(author), create_at: reply.createAt, excerpt: excerptMarkdown(reply.content, 64) };
    }),
  );
  return c.json({
    success: true as const,
    data: {
      latest_replies: latestReplies,
      no_reply_topics: noReplyTopicsRaw.map((topic: any) => ({ id: String(topic.id), title: topic.title, tab: topic.tab, create_at: topic.createAt })),
      top_users: topUsersRaw.map((user: any) => ({ id: String(user.id), loginname: user.loginname, avatar_url: userSummary(user).avatar_url, score: user.score || 0 })),
      partners: [{ name: "Node.js", url: "https://nodejs.org", description: "JavaScript runtime" }, { name: "npm", url: "https://www.npmjs.com", description: "Package ecosystem" }, { name: "Cloudflare", url: "https://www.cloudflare.com", description: "Edge platform" }],
      resources: [{ name: "Express", url: "https://expressjs.com" }, { name: "Koa", url: "https://koajs.com" }, { name: "Egg", url: "https://eggjs.org" }],
    },
  }, 200);
});

export { community as communityRoutes };
