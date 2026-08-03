import { OpenAPIHono } from "@hono/zod-openapi";
import { topics, users } from "@cnode/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../lib/db";
import { boolEq } from "../lib/db-compat";
import { renderMarkdown } from "../lib/markdown";
import type { AuthVars } from "../middleware/auth";

const feed = new OpenAPIHono<{
  Variables: AuthVars;
}>();

const INTERNAL_TABS = ["dev", "test"];
const RSS_LIMIT = 50;

function webBaseUrl() {
  return (process.env.CNODE_WEB_BASE_URL || "https://cnodejs.org").replace(/\/+$/g, "");
}

export function topicUrl(topicId: number, baseUrl = webBaseUrl()) {
  return `${baseUrl.replace(/\/+$/g, "")}/topic/${topicId}`;
}

export function toRssPubDate(value: Date | string | null | undefined) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
}

feed.get("/rss-source", async (c) => {
  const db = getDb();
  const rows = await db
    .select({
      id: topics.id,
      title: topics.title,
      content: topics.content,
      createAt: topics.createAt,
      author: users.loginname,
    })
    .from(topics)
    .innerJoin(users, eq(users.id, topics.authorId))
    .where(
      and(
        boolEq(topics.deleted, false),
        sql`coalesce(${topics.status}, 'published') <> 'deleted'`,
        sql`(${topics.tab} is null or ${topics.tab} not in (${sql.join(
          INTERNAL_TABS.map((tab) => sql`${tab}`),
          sql`, `,
        )}))`,
        boolEq(users.isBlock, false),
      ),
    )
    .orderBy(desc(topics.createAt))
    .limit(RSS_LIMIT);

  const baseUrl = webBaseUrl();
  return c.json({
    success: true as const,
    data: {
      title: "CNode：Node.js专业中文社区",
      link: baseUrl,
      language: "zh-cn",
      description: "CNode：Node.js专业中文社区",
      items: rows.map((topic) => {
        const link = topicUrl(topic.id, baseUrl);
        return {
          id: String(topic.id),
          title: topic.title || "CNode 话题",
          link,
          guid: link,
          description: renderMarkdown(topic.content || "", true),
          author: topic.author || "",
          pubDate: toRssPubDate(topic.createAt),
          create_at: topic.createAt,
        };
      }),
    },
  });
});

export { feed as feedRoutes };
