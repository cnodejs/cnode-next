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
import {
  auditLogs,
  ipBans,
  moderationHits,
  moderationScanJobs,
  reports,
  sensitiveWords,
  topics,
  replies,
  users,
} from "@cnode/db";
import { and, eq, sql, desc, count } from "drizzle-orm";
import { adminRequired, modRequired, type AuthVars } from "../middleware/auth";
import { invalidateWordCache } from "../lib/moderation";
import {
  createScanJob,
  handleModerationHit,
  pauseScanJob,
  pendingHitCount,
  resumeScanJob,
} from "../lib/moderation-scan";
import { boolEq, boolValue } from "../lib/db-compat";
import { decrementScoreAndReplyCount } from "../lib/score";

const admin = new Hono<{
  Variables: AuthVars;
}>();

const topicActions = new Set(["top", "good", "mute", "delete"]);
const ADMIN_DEFAULT_LIMIT = 50;
const ADMIN_MAX_LIMIT = 100;

type Pagination = {
  page: number;
  limit: number;
  offset: number;
};

export function parseAdminPagination(query: { page?: string | null; limit?: string | null }, defaultLimit = ADMIN_DEFAULT_LIMIT): Pagination {
  const page = Math.max(1, Number(query.page) || 1);
  const requestedLimit = Number(query.limit) || defaultLimit;
  const limit = Math.min(ADMIN_MAX_LIMIT, Math.max(1, requestedLimit));
  return { page, limit, offset: (page - 1) * limit };
}

function getPagination(c: any, defaultLimit = ADMIN_DEFAULT_LIMIT): Pagination {
  return parseAdminPagination({ page: c.req.query("page"), limit: c.req.query("limit") }, defaultLimit);
}

function paginated<T>(data: T[], total: number, pagination: Pagination) {
  return {
    success: true,
    data,
    total,
    page: pagination.page,
    limit: pagination.limit,
  };
}

export function canRunTopicAction(action: string, isAdmin: boolean, isMod: boolean) {
  if (!topicActions.has(action)) return false;
  return action === "top" ? isMod : isAdmin;
}

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
  const moderationPending = await pendingHitCount();
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
      moderationPending,
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

admin.get("/admin/topics", modRequired(), async (c) => {
  const pagination = getPagination(c);
  const q = c.req.query("q")?.trim();
  const db = getDb();
  const where = q ? sql`${topics.title} LIKE ${`%${q}%`}` : undefined;
  let listQuery = db.select().from(topics).$dynamic();
  let totalQuery = db.select({ c: count() }).from(topics).$dynamic();
  if (where) {
    listQuery = listQuery.where(where) as any;
    totalQuery = totalQuery.where(where) as any;
  }
  const [list, totalResult] = await Promise.all([
    listQuery.orderBy(desc(topics.createAt)).limit(pagination.limit).offset(pagination.offset),
    totalQuery,
  ]);
  return c.json(
    paginated(
      list.map((t: any) => ({
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
      Number(totalResult[0]?.c || 0),
      pagination,
    ),
  );
});

admin.post("/admin/topics/:action", modRequired(), async (c) => {
  const action = c.req.param("action");
  if (!topicActions.has(action)) {
    return c.json({ success: false, error_msg: "未知操作" }, 400);
  }
  if (!canRunTopicAction(action, c.get("isAdmin"), c.get("isMod"))) {
    return c.json({ success: false, error_msg: "需要管理员权限" }, 403);
  }
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

admin.post("/topic/:tid/top", modRequired(), async (c) => {
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
  const pagination = getPagination(c);
  const q = c.req.query("q")?.trim();
  const db = getDb();
  const where = q
    ? sql`(${users.loginname} LIKE ${`%${q}%`} OR ${users.email} LIKE ${`%${q}%`})`
    : undefined;
  let listQuery = db.select().from(users).$dynamic();
  let totalQuery = db.select({ c: count() }).from(users).$dynamic();
  if (where) {
    listQuery = listQuery.where(where) as any;
    totalQuery = totalQuery.where(where) as any;
  }
  const [list, totalResult] = await Promise.all([
    listQuery.orderBy(desc(users.createAt)).limit(pagination.limit).offset(pagination.offset),
    totalQuery,
  ]);
  return c.json(
    paginated(
      list.map((u: any) => ({
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
      Number(totalResult[0]?.c || 0),
      pagination,
    ),
  );
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
  const pagination = getPagination(c);
  const db = getDb();
  const where = boolEq(users.isBlock, true);
  const [banned, totalResult] = await Promise.all([
    db
      .select()
      .from(users)
      .where(where)
      .orderBy(desc(users.createAt))
      .limit(pagination.limit)
      .offset(pagination.offset),
    db.select({ c: count() }).from(users).where(where),
  ]);
  return c.json(
    paginated(
      banned.map((u: any) => ({ id: u.id, loginname: u.loginname, is_block: true })),
      Number(totalResult[0]?.c || 0),
      pagination,
    ),
  );
});

admin.get("/admin/bans/ips", adminRequired(), async (c) => {
  const pagination = getPagination(c);
  const db = getDb();
  const [list, totalResult] = await Promise.all([
    db
      .select()
      .from(ipBans)
      .orderBy(desc(ipBans.createAt))
      .limit(pagination.limit)
      .offset(pagination.offset),
    db.select({ c: count() }).from(ipBans),
  ]);
  return c.json(paginated(list, Number(totalResult[0]?.c || 0), pagination));
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
  const pagination = getPagination(c);
  const status = c.req.query("status") || "pending";
  const db = getDb();
  const where = eq(reports.status, status);
  const [list, totalResult] = await Promise.all([
    db
      .select()
      .from(reports)
      .where(where)
      .orderBy(desc(reports.createAt))
      .limit(pagination.limit)
      .offset(pagination.offset),
    db.select({ c: count() }).from(reports).where(where),
  ]);
  return c.json(paginated(list, Number(totalResult[0]?.c || 0), pagination));
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
  const pagination = getPagination(c);
  const q = c.req.query("q")?.trim();
  const category = c.req.query("category")?.trim();
  const db = getDb();
  const conditions: any[] = [];
  if (q) conditions.push(sql`${sensitiveWords.word} LIKE ${`%${q}%`}`);
  if (category) conditions.push(eq(sensitiveWords.category, category));
  const where = conditions.length === 0 ? undefined : conditions.length === 1 ? conditions[0] : and(...conditions);
  let listQuery = db.select().from(sensitiveWords).$dynamic();
  let totalQuery = db.select({ c: count() }).from(sensitiveWords).$dynamic();
  if (where) {
    listQuery = listQuery.where(where) as any;
    totalQuery = totalQuery.where(where) as any;
  }
  const [list, totalResult] = await Promise.all([
    listQuery.orderBy(desc(sensitiveWords.createAt)).limit(pagination.limit).offset(pagination.offset),
    totalQuery,
  ]);
  return c.json(paginated(list, Number(totalResult[0]?.c || 0), pagination));
});

admin.post("/admin/keywords", adminRequired(), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (!body.word) return c.json({ success: false, error_msg: "缺少 word" }, 400);
  const keyword = await keywordQueries.add(body.word, body.category);
  invalidateWordCache();
  if (keyword?.id) {
    await createScanJob({ scope: "all", mode: "historical", reason: "keyword_added", keywordIds: [keyword.id] });
  }
  return c.json({ success: true });
});

admin.post("/admin/keywords/bulk", adminRequired(), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const words: string[] = body.words || [];
  const keywordIds: number[] = [];
  for (const line of words) {
    const parts = line.split(",");
    const word = parts[0].trim();
    if (!word) continue;
    const keyword = await keywordQueries.add(word, parts[1]?.trim());
    if (keyword?.id) keywordIds.push(keyword.id);
  }
  invalidateWordCache();
  if (keywordIds.length) {
    await createScanJob({ scope: "all", mode: "historical", reason: "keyword_added", keywordIds });
  }
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
  const pagination = getPagination(c, 100);
  const db = getDb();
  const where = eq(moderationHits.status, "pending");
  const [list, totalResult] = await Promise.all([
    db
      .select()
      .from(moderationHits)
      .where(where)
      .orderBy(desc(moderationHits.scannedAt))
      .limit(pagination.limit)
      .offset(pagination.offset),
    db.select({ c: count() }).from(moderationHits).where(where),
  ]);
  return c.json({
    success: true,
    data: list.map((hit: any) => ({
      id: hit.id,
      type: hit.targetType,
      target_id: hit.targetId,
      topic_id: hit.topicId,
      author_id: hit.authorId,
      field: hit.field,
      scanned_at: hit.scannedAt,
      keywords: Array.isArray(hit.keywords) ? hit.keywords : JSON.parse(hit.keywords || "[]"),
      preview: hit.preview,
      status: hit.status,
    })),
    total: Number(totalResult[0]?.c || 0),
    page: pagination.page,
    limit: pagination.limit,
  });
});

admin.post("/admin/moderation/:id/:action", modRequired(), async (c) => {
  const id = Number(c.req.param("id"));
  const action = c.req.param("action");
  const user = c.get("user")!;
  if (!["confirm", "falsepositive", "ignore"].includes(action)) {
    return c.json({ success: false, error_msg: "不支持的操作" }, 400);
  }
  const hit = await handleModerationHit(id, action as any, user.id);
  if (!hit) return c.json({ success: false, error_msg: "巡检记录不存在" }, 404);
  if (action === "confirm") {
    if (hit.targetType === "topic") {
      await getDb().update(topics).set({ deleted: boolValue(true) } as any).where(eq(topics.id, hit.targetId));
    } else if (hit.targetType === "reply") {
      const reply = await replyQueries.getById(hit.targetId);
      if (reply && !reply.deleted) {
        await replyQueries.softDelete(reply.id);
        await decrementScoreAndReplyCount(reply.authorId, 5, 1);
        await topicQueries.decrementReplyCount(reply.topicId);
      }
    }
  }
  await auditQueries.log(
    user.id,
    user.loginname,
    `moderation_${action}`,
    { type: hit.targetType, id: String(hit.targetId) },
    action,
    JSON.stringify({ hit_id: id, topic_id: hit.topicId }),
  );
  return c.json({ success: true });
});

admin.get("/admin/moderation/jobs", adminRequired(), async (c) => {
  const pagination = getPagination(c);
  const db = getDb();
  const [list, totalResult] = await Promise.all([
    db
      .select()
      .from(moderationScanJobs)
      .orderBy(desc(moderationScanJobs.createAt))
      .limit(pagination.limit)
      .offset(pagination.offset),
    db.select({ c: count() }).from(moderationScanJobs),
  ]);
  return c.json(paginated(list, Number(totalResult[0]?.c || 0), pagination));
});

admin.post("/admin/moderation/jobs", adminRequired(), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const scope = ["topics", "replies", "all"].includes(body.scope) ? body.scope : "all";
  const mode = body.mode === "incremental" ? "incremental" : "historical";
  const job = await createScanJob({ scope, mode, reason: "manual" });
  const user = c.get("user")!;
  await auditQueries.log(user.id, user.loginname, "moderation_scan_create", { type: "scan_job", id: String(job.id) }, "created");
  return c.json({ success: true, data: job });
});

admin.post("/admin/moderation/jobs/:id/:action", adminRequired(), async (c) => {
  const id = Number(c.req.param("id"));
  const action = c.req.param("action");
  const user = c.get("user")!;
  if (action === "pause") {
    await pauseScanJob(id);
  } else if (action === "resume") {
    await resumeScanJob(id);
  } else {
    return c.json({ success: false, error_msg: "不支持的操作" }, 400);
  }
  await auditQueries.log(user.id, user.loginname, `moderation_scan_${action}`, { type: "scan_job", id: String(id) }, action);
  return c.json({ success: true });
});

// ── Audit log ──

admin.get("/admin/audit", adminRequired(), async (c) => {
  const pagination = getPagination(c);
  const db = getDb();
  const [list, totalResult] = await Promise.all([
    db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createAt))
      .limit(pagination.limit)
      .offset(pagination.offset),
    db.select({ c: count() }).from(auditLogs),
  ]);
  return c.json(
    paginated(
      list.map((log: any) => ({
      id: log.id,
      operator: log.operatorName,
      action: log.action,
      target: log.targetName || log.targetId,
      result: log.result,
      create_at: log.createAt,
      })),
      Number(totalResult[0]?.c || 0),
      pagination,
    ),
  );
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
