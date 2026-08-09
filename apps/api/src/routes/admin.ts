import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
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
  zoneQueries,
  tabQueries,
  roleQueries,
} from "../lib/db";
import {
  auditLogs,
  jobMeta,
  ipBans,
  messages,
  moderationHits,
  moderationScanJobs,
  reports,
  replyUps,
  sensitiveWords,
  topicCollects,
  topics,
  replies,
  users,
} from "@cnode/db";
import { and, eq, sql, desc, count, inArray, gte, lte, or } from "drizzle-orm";
import { adminRequired, modRequired, type AuthVars } from "../middleware/auth";
import { invalidateWordCache } from "../lib/moderation";
import {
  createScanJob,
  cancelScanJob,
  handleModerationHit,
  pauseScanJob,
  pendingHitCount,
  resumeScanJob,
  runScanJobNow,
  triggerScanDrain,
} from "../lib/moderation-scan";
import { boolEq, boolValue } from "../lib/db-compat";
import { isValidIpRule } from "../middleware/ip-ban";
import { applyProgressivePenalty } from "../lib/penalty";
import { userSummary } from "../lib/format";
import {
  canRunJobBulkModerationAction,
  canRunPermanentTopicDelete,
  canRunTopicAction,
  normalizePermanentTopicDeleteIds,
  parseAdminTopicFilters,
  type AdminTopicFilters,
} from "../lib/admin-governance";
import {
  adminUserBulkGovernanceBodySchema,
  createReportBodySchema,
  errorResponseSchema,
  roleAssignmentSchema,
  userRoleSchema,
} from "@cnode/shared";

const admin = new OpenAPIHono<{
  Variables: AuthVars;
}>();

const ADMIN_DEFAULT_LIMIT = 50;
const ADMIN_MAX_LIMIT = 100;
const auditCategoryValues = new Set([
  "content",
  "user",
  "role",
  "account",
  "security",
  "moderation",
  "system",
]);
const auditRiskValues = new Set(["low", "medium", "high", "critical"]);
const auditTargetTypeValues = new Set([
  "topic",
  "topics",
  "reply",
  "user",
  "ip",
  "report",
  "scan_job",
  "settings",
  "zone",
  "tab",
  "moderation_hit",
]);

type Pagination = {
  page: number;
  limit: number;
  offset: number;
};

export function parseAdminPagination(
  query: { page?: string | null; limit?: string | null },
  defaultLimit = ADMIN_DEFAULT_LIMIT,
): Pagination {
  const page = Math.max(1, Number(query.page) || 1);
  const requestedLimit = Number(query.limit) || defaultLimit;
  const limit = Math.min(ADMIN_MAX_LIMIT, Math.max(1, requestedLimit));
  return { page, limit, offset: (page - 1) * limit };
}

function getPagination(c: any, defaultLimit = ADMIN_DEFAULT_LIMIT): Pagination {
  return parseAdminPagination(
    { page: c.req.query("page"), limit: c.req.query("limit") },
    defaultLimit,
  );
}

function paginated<T>(data: T[], total: number, pagination: Pagination) {
  return {
    success: true,
    data: data as any,
    total,
    page: pagination.page,
    limit: pagination.limit,
  };
}

function enumQueryValue(value: string | null | undefined, allowed: Set<string>) {
  return value && allowed.has(value) ? value : "";
}

function parseAuditDateBound(value: string | null | undefined, endOfDay = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) date.setHours(23, 59, 59, 999);
  return date;
}

export function auditEventMeta(action: string) {
  const labels: Record<string, string> = {
    top: "置顶话题",
    untop: "取消置顶",
    good: "加精话题",
    ungood: "取消加精",
    lock: "锁定话题",
    unlock: "解锁话题",
    delete_topic: "删除话题",
    delete_reply: "删除回复",
    permanent_delete_topic: "永久删除话题",
    block_user: "屏蔽用户内容",
    unblock_user: "恢复用户内容",
    mute_user: "禁言用户",
    unmute_user: "解除禁言",
    bulk_unblock_user: "批量恢复内容可见",
    bulk_unmute_user: "批量解除禁言",
    delete_all_user_content: "删除用户所有发言",
    grant_role: "授予角色",
    revoke_role: "撤销角色",
    reset_password: "重置密码",
    github_bind: "GitHub 绑定",
    github_unbind: "GitHub 解绑",
    ban_ip: "封禁 IP",
    unban_ip: "解除 IP 封禁",
    update_settings: "修改系统设置",
    update_zone: "修改专区",
    update_tab: "修改 Tab",
  };
  const category =
    action.startsWith("report_") || action.startsWith("moderation_")
      ? "moderation"
      : action === "grant_role" || action === "revoke_role"
        ? "role"
        : action === "reset_password" || action.startsWith("github_")
          ? "account"
          : action === "ban_ip" || action === "unban_ip"
            ? "security"
            : action.startsWith("update_")
              ? "system"
              : [
                    "block_user",
                    "unblock_user",
                    "mute_user",
                    "unmute_user",
                    "bulk_unblock_user",
                    "bulk_unmute_user",
                    "delete_all_user_content",
                  ].includes(action)
                ? "user"
                : "content";
  const risk = [
    "delete_topic",
    "delete_reply",
    "delete_all_user_content",
    "permanent_delete_topic",
  ].includes(action)
    ? "critical"
    : ["grant_role", "revoke_role", "reset_password", "ban_ip", "unban_ip"].includes(action)
      ? "high"
      : [
            "lock",
            "unlock",
            "block_user",
            "unblock_user",
            "mute_user",
            "unmute_user",
            "bulk_unblock_user",
            "bulk_unmute_user",
          ].includes(action)
        ? "medium"
        : "low";
  return { category, risk, label: labels[action] || action.replace(/_/g, " ") };
}

function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (!value || typeof value !== "object") return value;
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    result[key] =
      /password|passwd|secret|token|access[_-]?token|private|credential|database_url/i.test(key)
        ? "[redacted]"
        : redactSensitive(child);
  }
  return result;
}

export function sanitizeAuditDetail(detail?: string | null) {
  if (!detail) return null;
  try {
    return JSON.stringify(redactSensitive(JSON.parse(detail)));
  } catch {
    return detail.replace(
      /(password|passwd|secret|token|access[_-]?token|database_url)(\s*[=:]\s*)\S+/gi,
      "$1$2[redacted]",
    );
  }
}

function formatAuditLog(log: any) {
  const meta = auditEventMeta(log.action);
  return {
    id: log.id,
    operator_id: log.operatorId,
    operator_name: log.operatorName,
    operator: log.operatorName,
    action: log.action,
    category: meta.category,
    risk: meta.risk,
    label: meta.label,
    target_type: log.targetType,
    target_id: log.targetId,
    target_name: log.targetName,
    target: log.targetName || log.targetId,
    result: log.result,
    detail: sanitizeAuditDetail(log.detail),
    create_at: log.createAt,
  };
}

function buildAuditConditions(c: any) {
  const conditions: any[] = [];
  const dateFrom = parseAuditDateBound(c.req.query("date_from"));
  const dateTo = parseAuditDateBound(c.req.query("date_to"), true);
  const operator = c.req.query("operator")?.trim();
  const category = enumQueryValue(c.req.query("category"), auditCategoryValues);
  const risk = enumQueryValue(c.req.query("risk"), auditRiskValues);
  const targetType = enumQueryValue(c.req.query("target_type"), auditTargetTypeValues);
  const result = c.req.query("result")?.trim();
  const q = c.req.query("q")?.trim();
  if (dateFrom) conditions.push(gte(auditLogs.createAt, dateFrom));
  if (dateTo) conditions.push(lte(auditLogs.createAt, dateTo));
  if (operator) conditions.push(sql`${auditLogs.operatorName} LIKE ${`%${operator}%`}`);
  if (targetType) conditions.push(eq(auditLogs.targetType, targetType));
  if (result && result !== "all") conditions.push(eq(auditLogs.result, result));
  if (q)
    conditions.push(
      or(
        sql`${auditLogs.action} LIKE ${`%${q}%`}`,
        sql`${auditLogs.operatorName} LIKE ${`%${q}%`}`,
        sql`${auditLogs.targetName} LIKE ${`%${q}%`}`,
        sql`${auditLogs.targetId} LIKE ${`%${q}%`}`,
        sql`${auditLogs.detail} LIKE ${`%${q}%`}`,
      ),
    );
  return { conditions, category, risk };
}

function auditSummary(logs: any[]) {
  return logs.reduce(
    (summary, log) => {
      const meta = auditEventMeta(log.action);
      if (meta.risk === "high" || meta.risk === "critical") summary.high_risk += 1;
      if (
        [
          "delete_topic",
          "delete_reply",
          "delete_all_user_content",
          "permanent_delete_topic",
        ].includes(log.action)
      )
        summary.content_deletions += 1;
      if (meta.category === "role") summary.role_changes += 1;
      if (meta.category === "account") summary.account_security += 1;
      if (!["success", "confirmed", "dismissed", "created"].includes(String(log.result || "")))
        summary.failures += 1;
      return summary;
    },
    { high_risk: 0, content_deletions: 0, role_changes: 0, account_security: 0, failures: 0 },
  );
}

function topicDateColumn(field: AdminTopicFilters["dateField"]) {
  if (field === "update_at") return topics.updateAt;
  if (field === "last_reply_at") return topics.lastReplyAt;
  return topics.createAt;
}

function topicOrder(sort: AdminTopicFilters["sort"]) {
  if (sort === "update_at_desc") return desc(topics.updateAt);
  if (sort === "last_reply_at_desc") return desc(topics.lastReplyAt);
  if (sort === "reply_count_desc") return desc(topics.replyCount);
  if (sort === "visit_count_desc") return desc(topics.visitCount);
  if (sort === "collect_count_desc") return desc(topics.collectCount);
  return desc(topics.createAt);
}

function buildAdminTopicConditions(filters: AdminTopicFilters) {
  const conditions: any[] = [];
  if (filters.q) conditions.push(sql`${topics.title} LIKE ${`%${filters.q}%`}`);
  if (filters.tab) conditions.push(eq(topics.tab, filters.tab));
  if (filters.visibility === "normal") {
    conditions.push(boolEq(topics.deleted, false));
    conditions.push(sql`coalesce(${topics.status}, 'published') not in ('deleted', 'muted')`);
  } else if (filters.visibility === "muted") {
    conditions.push(eq(topics.status, "muted"));
  } else if (filters.visibility === "deleted") {
    conditions.push(or(boolEq(topics.deleted, true), eq(topics.status, "deleted")));
  }
  if (filters.flag === "top") conditions.push(boolEq(topics.top, true));
  else if (filters.flag === "good") conditions.push(boolEq(topics.good, true));
  else if (filters.flag === "locked") conditions.push(boolEq(topics.lock, true));
  else if (filters.flag === "archived") conditions.push(boolEq(topics.archived, true));
  const dateColumn = topicDateColumn(filters.dateField);
  if (filters.dateFrom) conditions.push(gte(dateColumn, filters.dateFrom));
  if (filters.dateTo) conditions.push(lte(dateColumn, filters.dateTo));
  return conditions;
}

function rejectSelfTarget(c: any, targetUser: { id: number }) {
  const currentUser = c.get("user");
  if (currentUser && currentUser.id === targetUser.id) {
    return c.json({ success: false, error_msg: "不能对自己执行该操作" }, 422);
  }
  return null;
}

export function bulkUserGovernanceAuditAction(action: "unmute" | "unblock") {
  return action === "unmute" ? "bulk_unmute_user" : "bulk_unblock_user";
}

export function buildBulkUserGovernancePlan(
  action: "unmute" | "unblock",
  requestedIds: number[],
  currentUserId: number,
  existingUsers: { id: number }[],
) {
  const ids = Array.from(new Set(requestedIds));
  const selfSkippedIds = ids.filter((id) => id === currentUserId);
  const existingIds = existingUsers.map((user) => user.id);
  const missingIds = ids.filter((id) => id !== currentUserId && !existingIds.includes(id));
  return {
    ids,
    processedIds: existingIds,
    skippedIds: [...selfSkippedIds, ...missingIds],
    update: action === "unmute" ? { isMuted: boolValue(false) } : { isBlock: boolValue(false) },
  };
}

async function getReportTargetSummary(targetType: string, targetId: number) {
  if (targetType === "topic") {
    const topic = await topicQueries.getById(targetId);
    if (!topic || topic.deleted) return null;
    return {
      target_type: "topic",
      target_id: String(topic.id),
      topic_id: String(topic.id),
      title: topic.title,
      summary: topic.title,
    };
  }
  if (targetType === "reply") {
    const reply = await replyQueries.getById(targetId);
    if (!reply || reply.deleted) return null;
    const topic = await topicQueries.getById(reply.topicId);
    if (!topic || topic.deleted) return null;
    return {
      target_type: "reply",
      target_id: String(reply.id),
      topic_id: String(topic.id),
      title: topic.title,
      summary: (reply.content ?? "").slice(0, 160),
    };
  }
  return null;
}

async function hideReportTarget(targetType: string, targetId: number) {
  const db = getDb();
  if (targetType === "topic") {
    const topic = await topicQueries.getById(targetId);
    if (!topic || topic.deleted) return null;
    await db
      .update(topics)
      .set({ deleted: boolValue(true), status: "deleted" } as any)
      .where(eq(topics.id, targetId));
    return topic.authorId;
  }
  if (targetType === "reply") {
    const reply = await replyQueries.getById(targetId);
    if (!reply || reply.deleted) return null;
    const result = await replyQueries.deleteWithAggregates(reply.id, reply.authorId, true);
    return result.status === "deleted" ? result.reply.authorId : null;
  }
  return null;
}

async function permanentlyDeleteTopic(topicId: number) {
  const db = getDb();
  const topicRows = await db.select().from(topics).where(eq(topics.id, topicId)).limit(1);
  const topic = topicRows[0];
  if (!topic) return null;

  return db.transaction(async (tx: any) => {
    const replyRows = await tx
      .select({ id: replies.id })
      .from(replies)
      .where(eq(replies.topicId, topicId));
    const replyIds = replyRows.map((reply: any) => reply.id);

    if (replyIds.length > 0) {
      await tx.delete(replyUps).where(inArray(replyUps.replyId, replyIds));
      await tx
        .delete(messages)
        .where(or(eq(messages.topicId, topicId), inArray(messages.replyId, replyIds)));
      await tx
        .delete(reports)
        .where(
          or(
            and(eq(reports.targetType, "topic"), eq(reports.targetId, topicId)),
            and(eq(reports.targetType, "reply"), inArray(reports.targetId, replyIds)),
          ),
        );
      await tx
        .delete(moderationHits)
        .where(
          or(
            eq(moderationHits.topicId, topicId),
            and(eq(moderationHits.targetType, "topic"), eq(moderationHits.targetId, topicId)),
            and(eq(moderationHits.targetType, "reply"), inArray(moderationHits.targetId, replyIds)),
          ),
        );
      await tx.delete(replies).where(inArray(replies.id, replyIds));
    } else {
      await tx.delete(messages).where(eq(messages.topicId, topicId));
      await tx
        .delete(reports)
        .where(and(eq(reports.targetType, "topic"), eq(reports.targetId, topicId)));
      await tx
        .delete(moderationHits)
        .where(
          or(
            eq(moderationHits.topicId, topicId),
            and(eq(moderationHits.targetType, "topic"), eq(moderationHits.targetId, topicId)),
          ),
        );
    }

    await tx.delete(topicCollects).where(eq(topicCollects.topicId, topicId));
    await tx.delete(jobMeta).where(eq(jobMeta.topicId, topicId));
    await tx.delete(topics).where(eq(topics.id, topicId));

    const [
      remainingTopics,
      remainingReplies,
      remainingCollects,
      remainingJobMeta,
      remainingMessages,
      remainingHits,
      remainingReports,
      remainingReplyUps,
      remainingReplyMessages,
      remainingReplyHits,
      remainingReplyReports,
    ] = await Promise.all([
      tx.select({ c: count() }).from(topics).where(eq(topics.id, topicId)),
      tx.select({ c: count() }).from(replies).where(eq(replies.topicId, topicId)),
      tx.select({ c: count() }).from(topicCollects).where(eq(topicCollects.topicId, topicId)),
      tx.select({ c: count() }).from(jobMeta).where(eq(jobMeta.topicId, topicId)),
      tx.select({ c: count() }).from(messages).where(eq(messages.topicId, topicId)),
      tx.select({ c: count() }).from(moderationHits).where(eq(moderationHits.topicId, topicId)),
      tx
        .select({ c: count() })
        .from(reports)
        .where(and(eq(reports.targetType, "topic"), eq(reports.targetId, topicId))),
      replyIds.length
        ? tx.select({ c: count() }).from(replyUps).where(inArray(replyUps.replyId, replyIds))
        : Promise.resolve([{ c: 0 }]),
      replyIds.length
        ? tx.select({ c: count() }).from(messages).where(inArray(messages.replyId, replyIds))
        : Promise.resolve([{ c: 0 }]),
      replyIds.length
        ? tx
            .select({ c: count() })
            .from(moderationHits)
            .where(
              and(
                eq(moderationHits.targetType, "reply"),
                inArray(moderationHits.targetId, replyIds),
              ),
            )
        : Promise.resolve([{ c: 0 }]),
      replyIds.length
        ? tx
            .select({ c: count() })
            .from(reports)
            .where(and(eq(reports.targetType, "reply"), inArray(reports.targetId, replyIds)))
        : Promise.resolve([{ c: 0 }]),
    ]);
    const remaining =
      Number(remainingTopics[0]?.c || 0) +
      Number(remainingReplies[0]?.c || 0) +
      Number(remainingCollects[0]?.c || 0) +
      Number(remainingJobMeta[0]?.c || 0) +
      Number(remainingMessages[0]?.c || 0) +
      Number(remainingHits[0]?.c || 0) +
      Number(remainingReports[0]?.c || 0) +
      Number(remainingReplyUps[0]?.c || 0) +
      Number(remainingReplyMessages[0]?.c || 0) +
      Number(remainingReplyHits[0]?.c || 0) +
      Number(remainingReplyReports[0]?.c || 0);
    if (remaining > 0) throw new Error("话题真实删除后仍存在关联数据");

    return { topic, deletedReplies: replyIds.length };
  });
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
  const pendingReports =
    (await db.select({ c: count() }).from(reports).where(eq(reports.status, "pending")))[0]?.c ?? 0;
  return c.json({
    success: true,
    data: {
      userCount,
      topicCount,
      replyCount,
      todayTopics,
      todayReplies,
      todayUsers,
      pendingReports,
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
      is_muted: !!u.isMuted || !!u.isBlock,
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
  const filters = parseAdminTopicFilters({
    q: c.req.query("q"),
    tab: c.req.query("tab"),
    visibility: c.req.query("visibility"),
    flag: c.req.query("flag"),
    date_field: c.req.query("date_field"),
    date_from: c.req.query("date_from"),
    date_to: c.req.query("date_to"),
    sort: c.req.query("sort"),
  });
  const db = getDb();
  const conditions = buildAdminTopicConditions(filters);
  const where =
    conditions.length === 0
      ? undefined
      : conditions.length === 1
        ? conditions[0]
        : and(...conditions);
  let listQuery = db.select().from(topics).$dynamic();
  let totalQuery = db.select({ c: count() }).from(topics).$dynamic();
  if (where) {
    listQuery = listQuery.where(where) as any;
    totalQuery = totalQuery.where(where) as any;
  }
  const [list, totalResult] = await Promise.all([
    listQuery
      .orderBy(topicOrder(filters.sort), desc(topics.id))
      .limit(pagination.limit)
      .offset(pagination.offset),
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
        archived: t.archived,
        status: t.status,
        deleted: t.deleted,
        reply_count: t.replyCount,
        visit_count: t.visitCount,
        collect_count: t.collectCount,
        create_at: t.createAt,
        update_at: t.updateAt,
        last_reply_at: t.lastReplyAt,
      })),
      Number(totalResult[0]?.c || 0),
      pagination,
    ),
  );
});

admin.post("/admin/topics/permanent-delete", adminRequired(), async (c) => {
  if (!canRunPermanentTopicDelete(c.get("isAdmin")))
    return c.json({ success: false, error_msg: "需要管理员权限" }, 403);
  const body = await c.req.json().catch(() => ({}));
  const ids = normalizePermanentTopicDeleteIds(body);
  if (!ids.length) return c.json({ success: false, error_msg: "话题 ID 无效" }, 400);
  const user = c.get("user")!;
  const results: { topic_id: number; title: string; deleted_replies: number }[] = [];
  for (const id of ids) {
    const result = await permanentlyDeleteTopic(id);
    if (!result) continue;
    results.push({
      topic_id: id,
      title: result.topic.title ?? "",
      deleted_replies: result.deletedReplies,
    });
  }
  if (!results.length) return c.json({ success: false, error_msg: "话题不存在" }, 404);
  await auditQueries.log(
    user.id,
    user.loginname,
    "permanent_delete_topic",
    { type: "topics", id: results.map((item) => item.topic_id).join(","), name: results[0]?.title },
    "success",
    JSON.stringify({ topics: results, deleted: results.length }),
  );
  return c.json({ success: true, deleted: results.length, topics: results });
});

admin.post("/admin/topics/:action", modRequired(), async (c) => {
  const action = c.req.param("action");
  if (!canRunTopicAction(action, true, true))
    return c.json({ success: false, error_msg: "未知操作" }, 400);
  if (!canRunTopicAction(action, c.get("isAdmin"), c.get("isMod")))
    return c.json({ success: false, error_msg: "需要管理员权限" }, 403);
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
      await db
        .update(topics)
        .set({ deleted: boolValue(true), status: "deleted" } as any)
        .where(eq(topics.id, id));
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
    { type: "topic", id: String(tid), name: topic.title ?? undefined },
    "success",
  );
  return c.json({ success: true, message: topic.top ? "已取消置顶" : "已置顶" });
});

admin.post("/topic/:tid/good", modRequired(), async (c) => {
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
    { type: "topic", id: String(tid), name: topic.title ?? undefined },
    "success",
  );
  return c.json({ success: true, message: topic.good ? "已取消加精" : "已加精" });
});

admin.post("/topic/:tid/lock", modRequired(), async (c) => {
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
    { type: "topic", id: String(tid), name: topic.title ?? undefined },
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
  if (topic.authorId !== user.id && !c.get("isMod"))
    return c.json({ success: false, error_msg: "无权限" }, 403);
  const db = getDb();
  await db
    .update(topics)
    .set({ deleted: boolValue(true), status: "deleted" } as any)
    .where(eq(topics.id, tid));
  await db
    .update(users)
    .set({ score: sql`${users.score} - 5`, topicCount: sql`${users.topicCount} - 1` })
    .where(eq(users.id, topic.authorId));
  await auditQueries.log(
    user.id,
    user.loginname,
    "delete_topic",
    { type: "topic", id: String(tid), name: topic.title ?? undefined },
    "success",
  );
  return c.json({ success: true, message: "话题已删除" });
});

admin.post("/admin/reply/:rid/delete", modRequired(), async (c) => {
  const rid = Number(c.req.param("rid"));
  const reply = await replyQueries.getById(rid);
  if (!reply) return c.json({ success: false, error_msg: "回复不存在" }, 404);
  if (reply.deleted) return c.json({ success: false, error_msg: "回复已删除" }, 422);
  const topic = await topicQueries.getById(reply.topicId);
  const user = c.get("user")!;
  const result = await replyQueries.deleteWithAggregates(rid, user.id, true);
  if (result.status !== "deleted") return c.json({ success: false, error_msg: "回复已删除" }, 422);
  await auditQueries.log(
    user.id,
    user.loginname,
    "delete_reply",
    { type: "reply", id: String(rid), name: topic?.title || String(reply.topicId) },
    "success",
  );
  return c.json({ success: true, message: "回复已删除" });
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
  const rolesByUserId = await roleQueries.listByUserIds(list.map((u: any) => u.id));
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
        roles: rolesByUserId.get(u.id) || [],
        is_block: !!u.isBlock,
        is_muted: !!u.isMuted || !!u.isBlock,
        active: !!u.active,
        create_at: u.createAt,
      })),
      Number(totalResult[0]?.c || 0),
      pagination,
    ),
  );
});

admin.get("/admin/users/:id/roles", adminRequired(), async (c) => {
  const id = Number(c.req.param("id"));
  if (!id || Number.isNaN(id)) return c.json({ success: false, error_msg: "用户不存在" }, 404);
  const target = await userQueries.getById(id);
  if (!target) return c.json({ success: false, error_msg: "用户不存在" }, 404);
  const roles = await roleQueries.listByUserId(id);
  return c.json({ success: true, data: { user_id: id, roles } });
});

admin.post("/admin/users/:id/roles", adminRequired(), async (c) => {
  const id = Number(c.req.param("id"));
  const target = id > 0 && !Number.isNaN(id) ? await userQueries.getById(id) : null;
  if (!target) return c.json({ success: false, error_msg: "用户不存在" }, 404);
  const parsed = roleAssignmentSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ success: false, error_msg: "角色无效" }, 422);
  const user = c.get("user")!;
  const roles = await roleQueries.grant(id, parsed.data.role, user.id, parsed.data.reason);
  await auditQueries.log(
    user.id,
    user.loginname,
    "grant_role",
    { type: "user", id: String(id), name: target.loginname },
    "success",
    JSON.stringify({ role: parsed.data.role, reason: parsed.data.reason || null }),
  );
  return c.json({ success: true, data: { user_id: id, roles } });
});

admin.delete("/admin/users/:id/roles/:role", adminRequired(), async (c) => {
  const id = Number(c.req.param("id"));
  const target = id > 0 && !Number.isNaN(id) ? await userQueries.getById(id) : null;
  if (!target) return c.json({ success: false, error_msg: "用户不存在" }, 404);
  const role = c.req.param("role");
  const parsed = userRoleSchema.safeParse(role);
  if (!parsed.success) return c.json({ success: false, error_msg: "角色无效" }, 422);
  const user = c.get("user")!;
  const roles = await roleQueries.revoke(id, parsed.data);
  await auditQueries.log(
    user.id,
    user.loginname,
    "revoke_role",
    { type: "user", id: String(id), name: target.loginname },
    "success",
    JSON.stringify({ role: parsed.data }),
  );
  return c.json({ success: true, data: { user_id: id, roles } });
});

admin.post("/admin/users/bulk-governance", adminRequired(), async (c) => {
  const parsed = adminUserBulkGovernanceBodySchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ success: false, error_msg: "批量用户治理参数无效" }, 422);
  const currentUser = c.get("user")!;
  const ids = Array.from(new Set(parsed.data.ids));
  const skipped = ids.filter((id) => id === currentUser.id);
  const targetIds = ids.filter((id) => id !== currentUser.id);
  if (!targetIds.length) {
    return c.json({ success: true, processed: 0, processed_ids: [], skipped_ids: skipped });
  }

  const db = getDb();
  const targetRows = await db
    .select({ id: users.id, loginname: users.loginname })
    .from(users)
    .where(inArray(users.id, targetIds));
  const plan = buildBulkUserGovernancePlan(parsed.data.action, ids, currentUser.id, targetRows);
  if (plan.processedIds.length > 0) {
    await db
      .update(users)
      .set(plan.update as any)
      .where(inArray(users.id, plan.processedIds));
  }

  await auditQueries.log(
    currentUser.id,
    currentUser.loginname,
    bulkUserGovernanceAuditAction(parsed.data.action),
    {
      type: "user",
      id: plan.processedIds.join(","),
      name: targetRows.map((user: any) => user.loginname).join(","),
    },
    "success",
    JSON.stringify({
      action: parsed.data.action,
      ids: plan.ids,
      processed_ids: plan.processedIds,
      skipped_ids: plan.skippedIds,
      processed: plan.processedIds.length,
    }),
  );
  return c.json({
    success: true,
    processed: plan.processedIds.length,
    processed_ids: plan.processedIds,
    skipped_ids: plan.skippedIds,
  });
});

admin.post("/user/:name/block", adminRequired(), async (c) => {
  const name = c.req.param("name");
  const userData = await userQueries.getByLoginName(name);
  if (!userData) return c.json({ success: false, error_msg: "用户不存在" }, 404);
  const selfError = rejectSelfTarget(c, userData);
  if (selfError) return selfError;
  const db = getDb();
  await db
    .update(users)
    .set({ isBlock: boolValue(true) } as any)
    .where(eq(users.id, userData.id));
  const user = c.get("user")!;
  await auditQueries.log(
    user.id,
    user.loginname,
    "block_user",
    { type: "user", id: String(userData.id), name },
    "success",
  );
  return c.json({ success: true, message: "已隐藏该用户内容" });
});

admin.post("/user/:name/unblock", adminRequired(), async (c) => {
  const name = c.req.param("name");
  const userData = await userQueries.getByLoginName(name);
  if (!userData) return c.json({ success: false, error_msg: "用户不存在" }, 404);
  const selfError = rejectSelfTarget(c, userData);
  if (selfError) return selfError;
  const db = getDb();
  await db
    .update(users)
    .set({ isBlock: boolValue(false) } as any)
    .where(eq(users.id, userData.id));
  const user = c.get("user")!;
  await auditQueries.log(
    user.id,
    user.loginname,
    "unblock_user",
    { type: "user", id: String(userData.id), name },
    "success",
  );
  return c.json({ success: true, message: "已恢复该用户内容可见性" });
});

admin.post("/user/:name/mute", adminRequired(), async (c) => {
  const name = c.req.param("name");
  const userData = await userQueries.getByLoginName(name);
  if (!userData) return c.json({ success: false, error_msg: "用户不存在" }, 404);
  const selfError = rejectSelfTarget(c, userData);
  if (selfError) return selfError;
  const db = getDb();
  await db
    .update(users)
    .set({ isMuted: boolValue(true) } as any)
    .where(eq(users.id, userData.id));
  const user = c.get("user")!;
  await auditQueries.log(
    user.id,
    user.loginname,
    "mute_user",
    { type: "user", id: String(userData.id), name },
    "success",
  );
  return c.json({ success: true, message: "已禁言" });
});

admin.post("/user/:name/unmute", adminRequired(), async (c) => {
  const name = c.req.param("name");
  const userData = await userQueries.getByLoginName(name);
  if (!userData) return c.json({ success: false, error_msg: "用户不存在" }, 404);
  const selfError = rejectSelfTarget(c, userData);
  if (selfError) return selfError;
  const db = getDb();
  await db
    .update(users)
    .set({ isMuted: boolValue(false) } as any)
    .where(eq(users.id, userData.id));
  const user = c.get("user")!;
  await auditQueries.log(
    user.id,
    user.loginname,
    "unmute_user",
    { type: "user", id: String(userData.id), name },
    "success",
  );
  return c.json({ success: true, message: "已解除禁言" });
});

admin.post("/user/:name/delete_all", adminRequired(), async (c) => {
  const name = c.req.param("name");
  const userData = await userQueries.getByLoginName(name);
  if (!userData) return c.json({ success: false, error_msg: "用户不存在" }, 404);
  const selfError = rejectSelfTarget(c, userData);
  if (selfError) return selfError;
  const db = getDb();
  await db
    .update(topics)
    .set({ deleted: boolValue(true), status: "deleted" } as any)
    .where(eq(topics.authorId, userData.id));
  await db
    .update(replies)
    .set({ deleted: boolValue(true) } as any)
    .where(eq(replies.authorId, userData.id));
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
  await db
    .update(users)
    .set({ isStar: boolValue(true) } as any)
    .where(eq(users.id, userData.id));
  return c.json({ success: true, message: "已设为达人" });
});

admin.post("/user/cancel_star", adminRequired(), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const name = body.name || c.req.query("name");
  if (!name) return c.json({ success: false, error_msg: "缺少 name" }, 400);
  const userData = await userQueries.getByLoginName(name);
  if (!userData) return c.json({ success: false, error_msg: "用户不存在" }, 404);
  const db = getDb();
  await db
    .update(users)
    .set({ isStar: boolValue(false) } as any)
    .where(eq(users.id, userData.id));
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
  const status = c.req.query("status") === "muted" ? "muted" : "blocked";
  const db = getDb();
  const where = status === "muted" ? boolEq(users.isMuted, true) : boolEq(users.isBlock, true);
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
      banned.map((u: any) => ({
        id: u.id,
        loginname: u.loginname,
        is_block: !!u.isBlock,
        is_muted: !!u.isMuted,
      })),
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
  const ip = typeof body.ip === "string" ? body.ip.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : undefined;
  if (!ip) return c.json({ success: false, error_msg: "缺少 ip" }, 400);
  if (!isValidIpRule(ip)) return c.json({ success: false, error_msg: "IP/CIDR 格式无效" }, 422);
  await ipBanQueries.add(ip, reason);
  const user = c.get("user")!;
  await auditQueries.log(user.id, user.loginname, "ban_ip", { type: "ip", name: ip }, "success");
  return c.json({ success: true });
});

admin.delete("/admin/bans/ips/:id", adminRequired(), async (c) => {
  const id = Number(c.req.param("id"));
  await ipBanQueries.remove(id);
  const user = c.get("user")!;
  await auditQueries.log(
    user.id,
    user.loginname,
    "unban_ip",
    { type: "ip", id: String(id) },
    "success",
  );
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
  const data = await Promise.all(
    list.map(async (report: any) => {
      const summary = await getReportTargetSummary(report.targetType, report.targetId);
      const reporterCount =
        (
          await db
            .select({ c: sql<number>`count(distinct ${reports.reporterId})` })
            .from(reports)
            .where(
              and(
                eq(reports.targetType, report.targetType),
                eq(reports.targetId, report.targetId),
                eq(reports.status, status),
              ),
            )
        )[0]?.c ?? 0;
      return {
        id: report.id,
        type: report.type,
        description: report.description,
        status: report.status,
        reporter_count: Number(reporterCount),
        target_type: report.targetType,
        target_id: String(report.targetId),
        topic_id: summary?.topic_id || null,
        topic_title: summary?.title || "目标内容已不可见",
        target_summary: summary?.summary || "目标内容已不可见",
        create_at: report.createAt,
      };
    }),
  );
  return c.json(paginated(data, Number(totalResult[0]?.c || 0), pagination));
});

admin.post("/admin/reports/:id/:action", modRequired(), async (c) => {
  const id = Number(c.req.param("id"));
  const action = c.req.param("action");
  if (!["confirm", "dismiss"].includes(action))
    return c.json({ success: false, error_msg: "不支持的操作" }, 400);
  const user = c.get("user")!;
  const db = getDb();
  const report = (await db.select().from(reports).where(eq(reports.id, id)).limit(1))[0] as any;
  if (!report) return c.json({ success: false, error_msg: "举报不存在" }, 404);
  await reportQueries.handle(id, user.id, action);
  if (action === "confirm") {
    const authorId = await hideReportTarget(report.targetType, report.targetId);
    if (authorId) await applyProgressivePenalty(authorId, user.id, user.loginname, `report:${id}`);
  }
  await auditQueries.log(
    user.id,
    user.loginname,
    `report_${action}`,
    { type: "report", id: String(id) },
    action === "confirm" ? "confirmed" : "dismissed",
  );
  return c.json({ success: true });
});

const createReportRoute = createRoute({
  method: "post",
  path: "/admin/reports",
  tags: ["admin"],
  summary: "创建举报",
  request: { body: { content: { "application/json": { schema: createReportBodySchema } } } },
  responses: {
    200: {
      description: "举报成功",
      content: { "application/json": { schema: z.object({ success: z.literal(true) }) } },
    },
    401: {
      description: "未登录",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "目标不存在",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    422: {
      description: "目标无效",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});
admin.openapi(createReportRoute, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ success: false as const, error_msg: "未登录" }, 401);
  const { targetType, targetId, type, description } = c.req.valid("json");
  const tid = Number(targetId);
  if (!tid || Number.isNaN(tid))
    return c.json({ success: false as const, error_msg: "举报目标无效" }, 422);
  const summary = await getReportTargetSummary(targetType, tid);
  if (!summary) return c.json({ success: false as const, error_msg: "举报目标不存在" }, 404);
  await reportQueries.create({ targetType, targetId: tid, reporterId: user.id, type, description });
  const db = getDb();
  const threshold = Math.max(
    1,
    Number(await settingQueries.get("report_auto_hide_threshold", "3")) || 3,
  );
  const reporterCount =
    (
      await db
        .select({ c: sql<number>`count(distinct ${reports.reporterId})` })
        .from(reports)
        .where(
          and(
            eq(reports.targetType, targetType),
            eq(reports.targetId, tid),
            eq(reports.status, "pending"),
          ),
        )
    )[0]?.c ?? 0;
  if (Number(reporterCount) >= threshold) {
    await hideReportTarget(targetType, tid);
    await auditQueries.log(
      user.id,
      user.loginname,
      "report_auto_hide",
      { type: targetType, id: String(tid), name: summary.title ?? undefined },
      "success",
      JSON.stringify({ reporter_count: Number(reporterCount), threshold }),
    );
  }
  return c.json({ success: true as const }, 200);
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
  const where =
    conditions.length === 0
      ? undefined
      : conditions.length === 1
        ? conditions[0]
        : and(...conditions);
  let listQuery = db.select().from(sensitiveWords).$dynamic();
  let totalQuery = db.select({ c: count() }).from(sensitiveWords).$dynamic();
  if (where) {
    listQuery = listQuery.where(where) as any;
    totalQuery = totalQuery.where(where) as any;
  }
  const [list, totalResult] = await Promise.all([
    listQuery
      .orderBy(desc(sensitiveWords.createAt))
      .limit(pagination.limit)
      .offset(pagination.offset),
    totalQuery,
  ]);
  return c.json(paginated(list, Number(totalResult[0]?.c || 0), pagination));
});

admin.post("/admin/keywords", adminRequired(), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (!body.word) return c.json({ success: false, error_msg: "缺少 word" }, 400);
  const keyword = await keywordQueries.add(body.word, body.category);
  invalidateWordCache();
  if (keyword?.id)
    await createScanJob({
      scope: "all",
      mode: "historical",
      reason: "keyword_added",
      keywordIds: [keyword.id],
    });
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
  if (keywordIds.length)
    await createScanJob({ scope: "all", mode: "historical", reason: "keyword_added", keywordIds });
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
  const status = c.req.query("status") || "pending";
  const type = c.req.query("type") || "";
  const jobId = Number(c.req.query("job_id") || 0);
  const conditions: any[] = [];
  if (status !== "all") conditions.push(eq(moderationHits.status, status));
  if (type === "topic" || type === "reply") conditions.push(eq(moderationHits.targetType, type));
  if (jobId > 0) conditions.push(eq(moderationHits.scanJobId, jobId));
  const where =
    conditions.length === 0
      ? undefined
      : conditions.length === 1
        ? conditions[0]
        : and(...conditions);
  let listQuery = db.select().from(moderationHits).$dynamic();
  let totalQuery = db.select({ c: count() }).from(moderationHits).$dynamic();
  if (where) {
    listQuery = listQuery.where(where) as any;
    totalQuery = totalQuery.where(where) as any;
  }
  const [list, totalResult] = await Promise.all([
    listQuery
      .orderBy(desc(moderationHits.scannedAt), desc(moderationHits.targetId))
      .limit(pagination.limit)
      .offset(pagination.offset),
    totalQuery,
  ]);
  const summary = list.reduce(
    (acc: any, hit: any) => {
      acc.by_type[hit.targetType] = (acc.by_type[hit.targetType] || 0) + 1;
      const keywords = Array.isArray(hit.keywords)
        ? hit.keywords
        : JSON.parse(hit.keywords || "[]");
      for (const keyword of keywords) acc.by_keyword[keyword] = (acc.by_keyword[keyword] || 0) + 1;
      return acc;
    },
    { by_type: {}, by_keyword: {} },
  );
  return c.json({
    success: true,
    data: list.map((hit: any) => ({
      id: hit.id,
      scan_job_id: hit.scanJobId,
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
    summary,
  });
});

async function applyModerationHitAction(
  hit: any,
  action: "confirm" | "falsepositive" | "ignore",
  user: any,
) {
  const db = getDb();
  const current = await handleModerationHit(hit.id, action, user.id);
  if (!current) return false;
  if (action === "confirm") {
    if (hit.targetType === "topic")
      await db
        .update(topics)
        .set({ deleted: boolValue(true), status: "deleted" } as any)
        .where(eq(topics.id, hit.targetId));
    else if (hit.targetType === "reply") {
      const reply = await replyQueries.getById(hit.targetId);
      if (reply && !reply.deleted)
        await replyQueries.deleteWithAggregates(reply.id, reply.authorId, true);
    }
    if (hit.authorId)
      await applyProgressivePenalty(
        hit.authorId,
        user.id,
        user.loginname,
        `moderation_hit:${hit.id}`,
      );
  }
  return true;
}

admin.post("/admin/moderation/bulk", modRequired(), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const ids = Array.isArray(body.ids)
    ? body.ids
        .map(Number)
        .filter((id: number) => id > 0)
        .slice(0, 100)
    : [];
  const jobId = Number(body.job_id || 0);
  const action = String(body.action || "");
  if (!["confirm", "falsepositive", "ignore"].includes(action))
    return c.json({ success: false, error_msg: "不支持的操作" }, 400);
  const db = getDb();
  const user = c.get("user")!;
  if (jobId > 0 && !ids.length) {
    if (!canRunJobBulkModerationAction(action, c.get("isAdmin")))
      return c.json(
        {
          success: false,
          error_msg: action === "confirm" ? "需要管理员权限" : "任务级批量处理仅支持确认删除",
        },
        action === "confirm" ? 403 : 400,
      );
    const hits = await db
      .select()
      .from(moderationHits)
      .where(and(eq(moderationHits.scanJobId, jobId), eq(moderationHits.status, "pending")));
    let handled = 0;
    for (const hit of hits) {
      if (await applyModerationHitAction(hit, action as any, user)) handled += 1;
    }
    await auditQueries.log(
      user.id,
      user.loginname,
      `moderation_job_bulk_${action}`,
      { type: "scan_job", id: String(jobId) },
      action,
      JSON.stringify({ job_id: jobId, handled }),
    );
    return c.json({ success: true, handled });
  }
  if (!ids.length) return c.json({ success: false, error_msg: "未选择巡检记录" }, 400);
  const hits = await db.select().from(moderationHits).where(inArray(moderationHits.id, ids));
  let handled = 0;
  for (const hit of hits) {
    if (await applyModerationHitAction(hit, action as any, user)) handled += 1;
  }
  await auditQueries.log(
    user.id,
    user.loginname,
    `moderation_bulk_${action}`,
    { type: "moderation_hit" },
    action,
    JSON.stringify({ ids, handled }),
  );
  return c.json({ success: true, handled });
});

admin.post("/admin/moderation/:id/:action", modRequired(), async (c) => {
  const id = Number(c.req.param("id"));
  const action = c.req.param("action");
  const user = c.get("user")!;
  if (!["confirm", "falsepositive", "ignore"].includes(action))
    return c.json({ success: false, error_msg: "不支持的操作" }, 400);
  const hit = await handleModerationHit(id, action as any, user.id);
  if (!hit) return c.json({ success: false, error_msg: "巡检记录不存在" }, 404);
  if (action === "confirm") {
    if (hit.targetType === "topic")
      await getDb()
        .update(topics)
        .set({ deleted: boolValue(true), status: "deleted" } as any)
        .where(eq(topics.id, hit.targetId));
    else if (hit.targetType === "reply") {
      const reply = await replyQueries.getById(hit.targetId);
      if (reply && !reply.deleted)
        await replyQueries.deleteWithAggregates(reply.id, reply.authorId, true);
    }
    if (hit.authorId)
      await applyProgressivePenalty(
        hit.authorId,
        user.id,
        user.loginname,
        `moderation_hit:${hit.id}`,
      );
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
  const hitCounts = await Promise.all(
    list.map(async (job: any) => {
      const rows = await db
        .select({ c: count() })
        .from(moderationHits)
        .where(eq(moderationHits.scanJobId, job.id));
      return [job.id, Number(rows[0]?.c || 0)] as const;
    }),
  );
  const pendingCounts = await Promise.all(
    list.map(async (job: any) => {
      const rows = await db
        .select({ c: count() })
        .from(moderationHits)
        .where(and(eq(moderationHits.scanJobId, job.id), eq(moderationHits.status, "pending")));
      return [job.id, Number(rows[0]?.c || 0)] as const;
    }),
  );
  const hitsByJobId = new Map(hitCounts);
  const pendingByJobId = new Map(pendingCounts);
  return c.json(
    paginated(
      list.map((job: any) => ({
        ...job,
        hitCount: hitsByJobId.get(job.id) || 0,
        rawHitCount: job.hitCount || 0,
        pendingHitCount: pendingByJobId.get(job.id) || 0,
      })),
      Number(totalResult[0]?.c || 0),
      pagination,
    ),
  );
});

admin.post("/admin/moderation/jobs", adminRequired(), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const scope = ["topics", "replies", "all"].includes(body.scope) ? body.scope : "all";
  const mode = body.mode === "incremental" ? "incremental" : "historical";
  const job = await createScanJob({ scope, mode, reason: "manual" });
  const user = c.get("user")!;
  await auditQueries.log(
    user.id,
    user.loginname,
    "moderation_scan_create",
    { type: "scan_job", id: String(job.id) },
    "created",
  );
  void triggerScanDrain().catch((error) => console.error("[moderation scan trigger]", error));
  return c.json({ success: true, data: job });
});

admin.post("/admin/moderation/jobs/:id/:action", adminRequired(), async (c) => {
  const id = Number(c.req.param("id"));
  const action = c.req.param("action");
  const user = c.get("user")!;
  if (action === "pause") await pauseScanJob(id);
  else if (action === "resume") {
    await resumeScanJob(id);
    void triggerScanDrain().catch((error) => console.error("[moderation scan trigger]", error));
  } else if (action === "run") {
    const job = await runScanJobNow(id);
    if (!job) return c.json({ success: false, error_msg: "任务不存在" }, 404);
    if (["done", "failed", "cancelled"].includes(job.status))
      return c.json({ success: false, error_msg: "任务已结束，不能立即执行" }, 422);
    void triggerScanDrain().catch((error) => console.error("[moderation scan trigger]", error));
  } else if (action === "cancel") {
    const job = await cancelScanJob(id);
    if (!job) return c.json({ success: false, error_msg: "任务不存在" }, 404);
    if (["done", "failed"].includes(job.status))
      return c.json({ success: false, error_msg: "任务已结束，不能取消" }, 422);
  } else return c.json({ success: false, error_msg: "不支持的操作" }, 400);
  await auditQueries.log(
    user.id,
    user.loginname,
    `moderation_scan_${action}`,
    { type: "scan_job", id: String(id) },
    action,
  );
  return c.json({ success: true });
});

// ── Audit log ──
admin.get("/admin/audit", adminRequired(), async (c) => {
  const pagination = getPagination(c);
  const db = getDb();
  const { conditions, category, risk } = buildAuditConditions(c);
  const where = conditions.length ? and(...conditions) : undefined;
  let listQuery = db.select().from(auditLogs).$dynamic();
  let totalQuery = db.select({ c: count() }).from(auditLogs).$dynamic();
  let summaryQuery = db.select().from(auditLogs).$dynamic();
  if (where) {
    listQuery = listQuery.where(where) as any;
    totalQuery = totalQuery.where(where) as any;
    summaryQuery = summaryQuery.where(where) as any;
  }
  const [list, totalResult, summaryRows] = await Promise.all([
    listQuery.orderBy(desc(auditLogs.createAt)).limit(pagination.limit).offset(pagination.offset),
    totalQuery,
    summaryQuery.orderBy(desc(auditLogs.createAt)),
  ]);
  const matchesMeta = (log: any) => {
    const meta = auditEventMeta(log.action);
    return (!category || meta.category === category) && (!risk || meta.risk === risk);
  };
  const filteredSummaryRows = summaryRows.filter(matchesMeta);
  const pageRows =
    category || risk
      ? filteredSummaryRows.slice(pagination.offset, pagination.offset + pagination.limit)
      : list;
  return c.json({
    ...paginated(
      pageRows.map(formatAuditLog),
      category || risk ? filteredSummaryRows.length : Number(totalResult[0]?.c || 0),
      pagination,
    ),
    summary: auditSummary(filteredSummaryRows),
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
      rate_topic: Number(settings.rate_topic) || 1000,
      rate_reply: Number(settings.rate_reply) || 1000,
    },
  });
});

admin.post("/admin/settings", adminRequired(), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const allowedKeys = new Set([
    "allow_signup",
    "new_user_min_hours",
    "new_user_min_replies",
    "rate_topic",
    "rate_reply",
  ]);
  for (const [key, value] of Object.entries(body)) {
    if (!allowedKeys.has(key)) continue;
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
      return `    <item>\n      <title><![CDATA[${t.title}]]></title>\n      <link>https://cnodejs.org/topic/${t.id}</link>\n      <guid>https://cnodejs.org/topic/${t.id}</guid>\n      <pubDate>${isNaN(pubDate.getTime()) ? new Date().toUTCString() : pubDate.toUTCString()}</pubDate>\n    </item>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>CNode：Node.js专业中文社区</title>\n    <link>https://cnodejs.org</link>\n    <language>zh-cn</language>\n    <description>CNode：Node.js专业中文社区</description>\n    ${items}\n  </channel>\n</rss>`;
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
      return `  <url>\n    <loc>https://cnodejs.org/topic/${t.id}</loc>\n    <lastmod>${iso}</lastmod>\n  </url>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://cnodejs.org</loc></url>\n  ${urls}\n</urlset>`;
  return c.body(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
});

// ── Search ──
admin.get("/search", async (c) => {
  const q = c.req.query("q") || "";
  const engine = c.req.query("engine") || process.env.CNODE_SEARCH_ENGINE || "google";
  if (engine === "local") {
    const db = getDb();
    const results = await db
      .select()
      .from(topics)
      .where(
        and(
          sql`(${topics.title} LIKE ${`%${q}%`} OR ${topics.content} LIKE ${`%${q}%`})`,
          boolEq(topics.deleted, false),
          sql`${topics.status} != 'deleted'`,
          sql`${topics.tab} <> 'dev'`,
        ),
      )
      .orderBy(desc(topics.lastReplyAt))
      .limit(20);
    const data: any[] = [];
    for (const topic of results as any[]) {
      const author = await userQueries.getById(topic.authorId);
      if (author?.isBlock) continue;
      data.push({
        id: String(topic.id),
        author_id: String(topic.authorId),
        tab: topic.tab,
        title: topic.title,
        last_reply_at: topic.lastReplyAt,
        good: !!topic.good,
        top: !!topic.top,
        reply_count: topic.replyCount,
        visit_count: topic.visitCount,
        create_at: topic.createAt,
        author: userSummary(author),
      });
    }
    return c.json({ success: true, data });
  }
  const searchUrls: Record<string, string> = {
    google: `https://www.google.com/search?q=site:cnodejs.org+${encodeURIComponent(q)}`,
    baidu: `https://www.baidu.com/s?wd=site:cnodejs.org+${encodeURIComponent(q)}`,
  };
  return c.redirect(searchUrls[engine] || searchUrls.google);
});

// ── Zone management ──
admin.get("/admin/zones", adminRequired(), async (c) => {
  const rows = await zoneQueries.listAll();
  const data = rows.map((r: any) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    icon: r.icon,
    visible: !!r.visible,
    sort_order: r.sortOrder || 0,
  }));
  return c.json({ success: true, data });
});

admin.patch("/admin/zones/:id", adminRequired(), async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json().catch(() => ({}));
  const update: any = {};
  if (typeof body.name === "string") update.name = body.name;
  if (typeof body.description === "string") update.description = body.description;
  if (typeof body.icon === "string") update.icon = body.icon;
  if (typeof body.visible === "boolean") update.visible = body.visible;
  if (typeof body.sort_order === "number") update.sortOrder = body.sort_order;

  const updated = await zoneQueries.updateById(id, update);
  if (!updated) return c.json({ success: false, error_msg: "专区不存在" }, 404);

  const user = c.get("user")!;
  await auditQueries.log(
    user.id,
    user.loginname,
    "update_zone",
    { type: "zone", id: String(id), name: updated.slug },
    "success",
  );
  return c.json({
    success: true,
    data: {
      id: updated.id,
      slug: updated.slug,
      name: updated.name,
      description: updated.description,
      icon: updated.icon,
      visible: !!updated.visible,
      sort_order: updated.sortOrder || 0,
    },
  });
});

// ── Tab management ──
admin.get("/admin/tabs", adminRequired(), async (c) => {
  const rows = await tabQueries.listAll();
  const data = rows.map((r: any) => ({
    id: r.id,
    key: r.key,
    label: r.label,
    visible: !!r.visible,
    sort_order: r.sortOrder || 0,
    scope: r.scope || "public",
  }));
  return c.json({ success: true, data });
});

admin.patch("/admin/tabs/:id", adminRequired(), async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json().catch(() => ({}));
  const update: any = {};
  if (typeof body.label === "string") update.label = body.label;
  if (typeof body.visible === "boolean") update.visible = body.visible;
  if (typeof body.sort_order === "number") update.sortOrder = body.sort_order;

  const updated = await tabQueries.updateById(id, update);
  if (!updated) return c.json({ success: false, error_msg: "Tab 不存在" }, 404);

  const user = c.get("user")!;
  await auditQueries.log(
    user.id,
    user.loginname,
    "update_tab",
    { type: "tab", id: String(id), name: updated.key },
    "success",
  );
  return c.json({
    success: true,
    data: {
      id: updated.id,
      key: updated.key,
      label: updated.label,
      visible: !!updated.visible,
      sort_order: updated.sortOrder || 0,
      scope: updated.scope || "public",
    },
  });
});

export { admin as adminRoutes };
