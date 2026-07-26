import { Hono } from "hono";
import {
  topicQueries,
  userQueries,
  replyQueries,
  getDb,
  auditQueries,
  keywordQueries,
  reportQueries,
  ipBanQueries,
  settingQueries,
} from "../lib/db";
import { topics, replies, users } from "@cnode/db";
import { eq, sql, desc, count } from "drizzle-orm";
import { adminRequired, modRequired, type AuthVars } from "../middleware/auth";
import { invalidateWordCache } from "../lib/moderation";
import { boolEq, boolValue } from "../lib/db-compat";

const admin = new Hono<{
  Variables: AuthVars;
}>();

// ── Stats / Overview ──

admin.get("/admin/stats", adminRequired(), async (c) => {
  const db = getDb();
  const userCount = (await db.select({ c: count() }).from(users))[0]?.c ?? 0;
  const topicCount = (await db.select({ c: count() }).from(topics))[0]?.c ?? 0;
  const replyCount = (await db.select({ c: count() }).from(replies))[0]?.c ?? 0;
  const today = new Date().toISOString().split("T")[0];
  const todayTopics =
    (
      await db
        .select({ c: count() })
        .from(topics)
        .where(sql`date(${topics.createAt}) = ${today}`)
    )[0]?.c ?? 0;
  const todayReplies =
    (
      await db
        .select({ c: count() })
        .from(replies)
        .where(sql`date(${replies.createAt}) = ${today}`)
    )[0]?.c ?? 0;
  const todayUsers =
    (
      await db
        .select({ c: count() })
        .from(users)
        .where(sql`date(${users.createAt}) = ${today}`)
    )[0]?.c ?? 0;
  const pendingReports =
    (
      await db
        .select({ c: count() })
        .from(replies)
        .where(sql`1=1`)
    )[0]?.c ?? 0;
  return c.json({
    success: true,
    data: {
      userCount,
      topicCount,
      replyCount,
      todayTopics,
      todayReplies,
      todayUsers,
      pendingReports: 0,
    },
  });
});

admin.get("/admin/recent-users", adminRequired(), async (c) => {
  const db = getDb();
  const recent = await db.select().from(users).orderBy(desc(users.createAt)).limit(10);
  return c.json({
    success: true,
    data: recent.map((u: any) => ({
      id: u.id,
      loginname: u.loginname,
      avatar_url: u.avatar,
      create_at: u.createAt,
      is_block: !!u.isBlock,
    })),
  });
});

admin.get("/admin/recent-topics", adminRequired(), async (c) => {
  const db = getDb();
  const recent = await db
    .select()
    .from(topics)
    .where(boolEq(topics.deleted, false))
    .orderBy(desc(topics.createAt))
    .limit(10);
  return c.json({
    success: true,
    data: recent.map((t: any) => ({ id: t.id, title: t.title, create_at: t.createAt })),
  });
});

// ── Topic management ──

admin.get("/admin/topics", adminRequired(), async (c) => {
  const limit = Math.min(100, Number(c.req.query("limit")) || 50);
  const db = getDb();
  const list = await db.select().from(topics).limit(limit).orderBy(desc(topics.createAt));
  return c.json({
    success: true,
    data: list.map((t: any) => ({
      id: t.id,
      title: t.title,
      tab: t.tab,
      top: t.top,
      good: t.good,
      lock: t.lock,
      deleted: t.deleted,
      reply_count: t.replyCount,
      visit_count: t.visitCount,
      create_at: t.createAt,
    })),
  });
});

admin.post("/admin/topics/:action", adminRequired(), async (c) => {
  const action = c.req.param("action");
  const body = await c.req.json().catch(() => ({}));
  const ids: number[] = body.ids || [];
  if (ids.length === 0) return c.json({ success: false, error_msg: "no ids" }, 400);
  const db = getDb();
  const user = c.get("user")!;
  for (const id of ids) {
    if (action === "top")
      await db
        .update(topics)
        .set({ top: sql`NOT ${topics.top}` })
        .where(eq(topics.id, id));
    else if (action === "good")
      await db
        .update(topics)
        .set({ good: sql`NOT ${topics.good}` })
        .where(eq(topics.id, id));
    else if (action === "mute")
      await db.update(topics).set({ status: "muted" }).where(eq(topics.id, id));
    else if (action === "delete")
      await db.update(topics).set({ deleted: boolValue(true) } as any).where(eq(topics.id, id));
  }
  await auditQueries.log(
    user.id,
    user.loginname,
    `batch_${action}`,
    { type: "topics", id: ids.join(",") },
    "success",
  );
  return c.json({ success: true });
});

admin.post("/topic/:tid/top", adminRequired(), async (c) => {
  const tid = Number(c.req.param("tid"));
  const topic = await topicQueries.getById(tid);
  if (!topic) return c.json({ success: false, error_msg: "话题不存在" }, 404);
  const db = getDb();
  await db
    .update(topics)
    .set({ top: boolValue(!topic.top) } as any)
    .where(eq(topics.id, tid));
  const user = c.get("user")!;
  await auditQueries.log(
    user.id,
    user.loginname,
    topic.top ? "untop" : "top",
    { type: "topic", id: String(tid), name: topic.title },
    "success",
  );
  return c.json({ success: true, message: topic.top ? "已取消置顶" : "已置顶" });
});

admin.post("/topic/:tid/good", adminRequired(), async (c) => {
  const tid = Number(c.req.param("tid"));
  const topic = await topicQueries.getById(tid);
  if (!topic) return c.json({ success: false, error_msg: "话题不存在" }, 404);
  const db = getDb();
  await db
    .update(topics)
    .set({ good: boolValue(!topic.good) } as any)
    .where(eq(topics.id, tid));
  const user = c.get("user")!;
  await auditQueries.log(
    user.id,
    user.loginname,
    topic.good ? "ungood" : "good",
    { type: "topic", id: String(tid), name: topic.title },
    "success",
  );
  return c.json({ success: true, message: topic.good ? "已取消加精" : "已加精" });
});

admin.post("/topic/:tid/lock", adminRequired(), async (c) => {
  const tid = Number(c.req.param("tid"));
  const topic = await topicQueries.getById(tid);
  if (!topic) return c.json({ success: false, error_msg: "话题不存在" }, 404);
  const db = getDb();
  await db
    .update(topics)
    .set({ lock: boolValue(!topic.lock) } as any)
    .where(eq(topics.id, tid));
  const user = c.get("user")!;
  await auditQueries.log(
    user.id,
    user.loginname,
    topic.lock ? "unlock" : "lock",
    { type: "topic", id: String(tid), name: topic.title },
    "success",
  );
  return c.json({ success: true, message: topic.lock ? "已解锁" : "已锁定" });
});

admin.post("/topic/:tid/delete", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error_msg: "未登录" }, 401);
  const tid = Number(c.req.param("tid"));
  const topic = await topicQueries.getById(tid);
  if (!topic) return c.json({ success: false, error_msg: "话题不存在" }, 404);
  if (topic.authorId !== user.id && !c.get("isAdmin"))
    return c.json({ success: false, error_msg: "无权限" }, 403);
  const db = getDb();
  await db.update(topics).set({ deleted: boolValue(true) } as any).where(eq(topics.id, tid));
  await db
    .update(users)
    .set({ score: sql`${users.score} - 5`, topicCount: sql`${users.topicCount} - 1` })
    .where(eq(users.id, topic.authorId));
  await auditQueries.log(
    user.id,
    user.loginname,
    "delete_topic",
    { type: "topic", id: String(tid), name: topic.title },
    "success",
  );
  return c.json({ success: true, message: "话题已删除" });
});

// ── User management ──

admin.get("/admin/users", adminRequired(), async (c) => {
  const limit = Math.min(100, Number(c.req.query("limit")) || 50);
  const db = getDb();
  const list = await db.select().from(users).limit(limit).orderBy(desc(users.createAt));
  return c.json({
    success: true,
    data: list.map((u: any) => ({
      id: u.id,
      loginname: u.loginname,
      email: u.email,
      avatar_url: u.avatar,
      score: u.score,
      topic_count: u.topicCount,
      reply_count: u.replyCount,
      is_block: !!u.isBlock,
      active: !!u.active,
      create_at: u.createAt,
    })),
  });
});

admin.post("/user/:name/block", adminRequired(), async (c) => {
  const name = c.req.param("name");
  const userData = await userQueries.getByLoginName(name);
  if (!userData) return c.json({ success: false, error_msg: "用户不存在" }, 404);
  const db = getDb();
  await db.update(users).set({ isBlock: boolValue(true) } as any).where(eq(users.id, userData.id));
  const user = c.get("user")!;
  await auditQueries.log(
    user.id,
    user.loginname,
    "block_user",
    { type: "user", id: String(userData.id), name },
    "success",
  );
  return c.json({ success: true, message: "已禁言" });
});

admin.post("/user/:name/unblock", adminRequired(), async (c) => {
  const name = c.req.param("name");
  const userData = await userQueries.getByLoginName(name);
  if (!userData) return c.json({ success: false, error_msg: "用户不存在" }, 404);
  const db = getDb();
  await db.update(users).set({ isBlock: boolValue(false) } as any).where(eq(users.id, userData.id));
  const user = c.get("user")!;
  await auditQueries.log(
    user.id,
    user.loginname,
    "unblock_user",
    { type: "user", id: String(userData.id), name },
    "success",
  );
  return c.json({ success: true, message: "已解禁" });
});

admin.post("/user/:name/delete_all", adminRequired(), async (c) => {
  const name = c.req.param("name");
  const userData = await userQueries.getByLoginName(name);
  if (!userData) return c.json({ success: false, error_msg: "用户不存在" }, 404);
  const db = getDb();
  await db.update(topics).set({ deleted: boolValue(true) } as any).where(eq(topics.authorId, userData.id));
  await db.update(replies).set({ deleted: boolValue(true) } as any).where(eq(replies.authorId, userData.id));
  const user = c.get("user")!;
  await auditQueries.log(
    user.id,
    user.loginname,
    "delete_all_user_content",
    { type: "user", id: String(userData.id), name },
    "success",
  );
  return c.json({ success: true, message: "已删除所有发言" });
});

admin.post("/user/set_star", adminRequired(), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const name = body.name || c.req.query("name");
  if (!name) return c.json({ success: false, error_msg: "缺少 name" }, 400);
  const userData = await userQueries.getByLoginName(name);
  if (!userData) return c.json({ success: false, error_msg: "用户不存在" }, 404);
  const db = getDb();
  await db.update(users).set({ isStar: boolValue(true) } as any).where(eq(users.id, userData.id));
  return c.json({ success: true, message: "已设为达人" });
});

admin.post("/user/cancel_star", adminRequired(), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const name = body.name || c.req.query("name");
  if (!name) return c.json({ success: false, error_msg: "缺少 name" }, 400);
  const userData = await userQueries.getByLoginName(name);
  if (!userData) return c.json({ success: false, error_msg: "用户不存在" }, 404);
  const db = getDb();
  await db.update(users).set({ isStar: boolValue(false) } as any).where(eq(users.id, userData.id));
  return c.json({ success: true, message: "已取消达人" });
});

admin.post("/user/:name/reset_password", adminRequired(), async (c) => {
  const name = c.req.param("name");
  const userData = await userQueries.getByLoginName(name);
  if (!userData) return c.json({ success: false, error_msg: "用户不存在" }, 404);
  const { v4: uuidv4 } = await import("uuid");
  const bcryptjs = await import("bcryptjs");
  const newPass = uuidv4().slice(0, 12);
  const passhash = await bcryptjs.default.hash(newPass, 10);
  await userQueries.updatePass(userData.id, passhash);
  await userQueries.updateRetrieveKey(userData.id, "", 0);
  const user = c.get("user")!;
  await auditQueries.log(
    user.id,
    user.loginname,
    "reset_password",
    { type: "user", id: String(userData.id), name },
    "success",
  );
  return c.json({ success: true, newPassword: newPass });
});

// ── Ban management ──

admin.get("/admin/bans/users", adminRequired(), async (c) => {
  const db = getDb();
  const banned = await db.select().from(users).where(boolEq(users.isBlock, true));
  return c.json({
    success: true,
    data: banned.map((u: any) => ({ id: u.id, loginname: u.loginname, is_block: true })),
  });
});

admin.get("/admin/bans/ips", adminRequired(), async (c) => {
  const list = await ipBanQueries.list();
  return c.json({ success: true, data: list });
});

admin.post("/admin/bans/ips", adminRequired(), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { ip, reason } = body;
  if (!ip) return c.json({ success: false, error_msg: "缺少 ip" }, 400);
  await ipBanQueries.add(ip, reason);
  const user = c.get("user")!;
  await auditQueries.log(user.id, user.loginname, "ban_ip", { type: "ip", name: ip }, "success");
  return c.json({ success: true });
});

admin.delete("/admin/bans/ips/:id", adminRequired(), async (c) => {
  const id = Number(c.req.param("id"));
  await ipBanQueries.remove(id);
  return c.json({ success: true });
});

// ── Report queue ──

admin.get("/admin/reports", modRequired(), async (c) => {
  const list = await reportQueries.list();
  return c.json({ success: true, data: list });
});

admin.post("/admin/reports/:id/:action", modRequired(), async (c) => {
  const id = Number(c.req.param("id"));
  const action = c.req.param("action");
  const user = c.get("user")!;
  await reportQueries.handle(id, user.id, action);
  await auditQueries.log(
    user.id,
    user.loginname,
    `report_${action}`,
    { type: "report", id: String(id) },
    action === "confirm" ? "confirmed" : "dismissed",
  );
  return c.json({ success: true });
});

admin.post("/admin/reports", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error_msg: "未登录" }, 401);
  const body = await c.req.json().catch(() => ({}));
  await reportQueries.create({
    targetType: body.targetType,
    targetId: body.targetId,
    reporterId: user.id,
    type: body.type,
    description: body.description,
  });
  return c.json({ success: true });
});

// ── Sensitive words ──

admin.get("/admin/keywords", adminRequired(), async (c) => {
  const list = await keywordQueries.list();
  return c.json({ success: true, data: list });
});

admin.post("/admin/keywords", adminRequired(), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (!body.word) return c.json({ success: false, error_msg: "缺少 word" }, 400);
  await keywordQueries.add(body.word, body.category);
  invalidateWordCache();
  return c.json({ success: true });
});

admin.post("/admin/keywords/bulk", adminRequired(), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const words: string[] = body.words || [];
  for (const line of words) {
    const parts = line.split(",");
    await keywordQueries.add(parts[0].trim(), parts[1]?.trim());
  }
  invalidateWordCache();
  return c.json({ success: true, added: words.length });
});

admin.delete("/admin/keywords/:id", adminRequired(), async (c) => {
  const id = Number(c.req.param("id"));
  await keywordQueries.remove(id);
  invalidateWordCache();
  return c.json({ success: true });
});

// ── Moderation / scan results ──

admin.get("/admin/moderation", modRequired(), async (c) => {
  // Scan results are stored in topics.replies with status=muted
  const db = getDb();
  const mutedTopics = await db.select().from(topics).where(eq(topics.status, "muted"));
  return c.json({
    success: true,
    data: mutedTopics.map((t: any) => ({
      id: t.id,
      type: "topic",
      target_id: t.id,
      title: t.title,
      scanned_at: t.updateAt,
      keywords: [],
      preview: t.content?.slice(0, 200),
    })),
  });
});

admin.post("/admin/moderation/:id/:action", modRequired(), async (c) => {
  const id = Number(c.req.param("id"));
  const action = c.req.param("action");
  const db = getDb();
  if (action === "restore") {
    await db.update(topics).set({ status: "published" }).where(eq(topics.id, id));
  } else if (action === "confirm") {
    await db.update(topics).set({ deleted: boolValue(true) } as any).where(eq(topics.id, id));
  } else if (action === "falsepositive") {
    await db.update(topics).set({ status: "published" }).where(eq(topics.id, id));
  }
  const user = c.get("user")!;
  await auditQueries.log(
    user.id,
    user.loginname,
    `moderation_${action}`,
    { type: "topic", id: String(id) },
    action,
  );
  return c.json({ success: true });
});

// ── Audit log ──

admin.get("/admin/audit", adminRequired(), async (c) => {
  const limit = Math.min(100, Number(c.req.query("limit")) || 50);
  const list = await auditQueries.getList(limit);
  return c.json({
    success: true,
    data: list.map((log: any) => ({
      id: log.id,
      operator: log.operatorName,
      action: log.action,
      target: log.targetName || log.targetId,
      result: log.result,
      create_at: log.createAt,
    })),
  });
});

// ── Settings ──

admin.get("/admin/settings", adminRequired(), async (c) => {
  const settings = await settingQueries.getAll();
  return c.json({
    success: true,
    data: {
      allow_signup: settings.allow_signup !== "false",
      new_user_min_hours: Number(settings.new_user_min_hours) || 24,
      new_user_min_replies: Number(settings.new_user_min_replies) || 3,
      archive_days: Number(settings.archive_days) || 365,
      rate_topic: Number(settings.rate_topic) || 1000,
      rate_reply: Number(settings.rate_reply) || 1000,
      rate_signup_ip: Number(settings.rate_signup_ip) || 1000,
    },
  });
});

admin.post("/admin/settings", adminRequired(), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  for (const [key, value] of Object.entries(body)) {
    await settingQueries.set(key, String(value));
  }
  const user = c.get("user")!;
  await auditQueries.log(
    user.id,
    user.loginname,
    "update_settings",
    { type: "settings" },
    "success",
  );
  return c.json({ success: true });
});

// ── RSS ──

admin.get("/rss", async (c) => {
  const topicsList = await topicQueries.getByQuery({ deleted: 0 }, { limit: 50 });
  const items = topicsList
    .map((t: any) => {
      const pubDate = t.createAt ? new Date(t.createAt) : new Date();
      return `    <item>
      <title><![CDATA[${t.title}]]></title>
      <link>https://cnodejs.org/topic/${t.id}</link>
      <guid>https://cnodejs.org/topic/${t.id}</guid>
      <pubDate>${isNaN(pubDate.getTime()) ? new Date().toUTCString() : pubDate.toUTCString()}</pubDate>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>CNode：Node.js专业中文社区</title>
    <link>https://cnodejs.org</link>
    <language>zh-cn</language>
    <description>CNode：Node.js专业中文社区</description>
    ${items}
  </channel>
</rss>`;

  return c.body(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
});

// ── Sitemap ──

admin.get("/sitemap.xml", async (c) => {
  const topicsList = await topicQueries.getByQuery({ deleted: 0 }, { limit: 50000 });
  const urls = topicsList
    .map((t: any) => {
      const dateStr = t.updateAt || t.createAt;
      const date = dateStr ? new Date(dateStr) : new Date();
      const iso = isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
      return `  <url>
    <loc>https://cnodejs.org/topic/${t.id}</loc>
    <lastmod>${iso}</lastmod>
  </url>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://cnodejs.org</loc></url>
  ${urls}
</urlset>`;

  return c.body(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
});

// ── Search ──

admin.get("/search", async (c) => {
  const q = c.req.query("q") || "";
  const engine = c.req.query("engine") || process.env.APP_SEARCH_ENGINE || "google";
  if (engine === "local") {
    const db = getDb();
    const results = await db
      .select()
      .from(topics)
      .where(sql`${topics.title} LIKE ${`%${q}%`} AND ${topics.deleted} = ${boolValue(false)}`)
      .limit(20);
    return c.json({ success: true, data: results });
  }
  const searchUrls: Record<string, string> = {
    google: `https://www.google.com/search?q=site:cnodejs.org+${encodeURIComponent(q)}`,
    baidu: `https://www.baidu.com/s?wd=site:cnodejs.org+${encodeURIComponent(q)}`,
  };
  return c.redirect(searchUrls[engine] || searchUrls.google);
});

export { admin as adminRoutes };
