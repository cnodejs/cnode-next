import { Hono } from "hono";
import { desc, eq, sql } from "drizzle-orm";
import { replies, topics, users } from "@cnode/db";
import { getDb, userQueries, topicQueries } from "../lib/db";
import { excerptMarkdown, userSummary } from "../lib/format";

const community = new Hono();

community.get("/sidebar/home", async (c) => {
  const db = getDb();
  const [latestRepliesRaw, noReplyTopicsRaw, topUsersRaw] = await Promise.all([
    db
      .select()
      .from(replies)
      .where(eq(replies.deleted, 0))
      .orderBy(desc(replies.createAt))
      .limit(5),
    db
      .select()
      .from(topics)
      .where(sql`${topics.deleted} = 0 and ${topics.replyCount} = 0`)
      .orderBy(desc(topics.createAt))
      .limit(5),
    db.select().from(users).orderBy(desc(users.score)).limit(5),
  ]);

  const latestReplies = await Promise.all(
    latestRepliesRaw.map(async (reply: any) => {
      const [author, topic] = await Promise.all([
        userQueries.getById(reply.authorId),
        topicQueries.getById(reply.topicId),
      ]);
      return {
        id: String(reply.id),
        topic_id: String(reply.topicId),
        topic_title: topic?.title || "已删除的话题",
        author: userSummary(author),
        create_at: reply.createAt,
        excerpt: excerptMarkdown(reply.content, 64),
      };
    }),
  );

  return c.json({
    success: true,
    data: {
      latest_replies: latestReplies,
      no_reply_topics: noReplyTopicsRaw.map((topic: any) => ({
        id: String(topic.id),
        title: topic.title,
        tab: topic.tab,
        create_at: topic.createAt,
      })),
      top_users: topUsersRaw.map((user: any) => ({
        id: String(user.id),
        loginname: user.loginname,
        avatar_url: userSummary(user).avatar_url,
        score: user.score || 0,
      })),
      partners: [
        { name: "Node.js", url: "https://nodejs.org", description: "JavaScript runtime" },
        { name: "npm", url: "https://www.npmjs.com", description: "Package ecosystem" },
        { name: "Cloudflare", url: "https://www.cloudflare.com", description: "Edge platform" },
      ],
      resources: [
        { name: "Express", url: "https://expressjs.com" },
        { name: "Koa", url: "https://koajs.com" },
        { name: "Egg", url: "https://eggjs.org" },
      ],
    },
  });
});

export { community as communityRoutes };
