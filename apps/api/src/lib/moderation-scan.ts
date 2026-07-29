import { and, asc, desc, eq, gt, inArray, lt, ne, sql } from "drizzle-orm";
import { moderationHits, moderationScanJobs, replies, topics } from "@cnode/db";
import { getDb } from "./db";
import { boolEq } from "./db-compat";
import { createHitDedupeKey, createHitPreview, incrementSensitiveWordHits, loadWords, matchContent, type SensitiveWordEntry } from "./moderation";
import { getRedis } from "./redis";

export type ScanScope = "topics" | "replies" | "all";
export type ScanMode = "historical" | "incremental";
export type ScanReason = "keyword_added" | "manual" | "scheduled";
export type ScanJobStatus = "pending" | "running" | "paused" | "done" | "failed" | "cancelled";

const DEFAULT_BATCH_SIZE = 200;
const DEFAULT_THROTTLE_MS = 500;
const DEFAULT_MAX_BATCHES = 100;
const LOCK_KEY = "moderation_scan_worker_lock";

export function scanDefaults() {
  return {
    batchSize: Number(process.env.MODERATION_SCAN_BATCH_SIZE || DEFAULT_BATCH_SIZE),
    throttleMs: Number(process.env.MODERATION_SCAN_THROTTLE_MS || DEFAULT_THROTTLE_MS),
    maxBatchesPerRun: Number(process.env.MODERATION_SCAN_MAX_BATCHES_PER_RUN || DEFAULT_MAX_BATCHES),
  };
}

function decodeJsonArray(value: unknown): number[] | null {
  if (!value) return null;
  if (Array.isArray(value)) return value.map(Number).filter((v) => v > 0);
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.map(Number).filter((v) => v > 0) : null;
  } catch {
    return null;
  }
}

function dateValue(value = new Date()) {
  return value;
}

function jsonValue(value: unknown) {
  return value === undefined ? null : value;
}

export async function acquireScanWorkerLock(ttlSeconds = 60) {
  const redis = getRedis() as any;
  const owner = `${process.pid}:${Date.now()}`;
  const acquired = await redis.setnx(LOCK_KEY, owner);
  if (!acquired) return null;
  await redis.expire(LOCK_KEY, ttlSeconds);
  return owner;
}

export async function releaseScanWorkerLock(owner: string) {
  const redis = getRedis() as any;
  const current = await redis.get(LOCK_KEY);
  if (current === owner) await redis.del(LOCK_KEY);
}

export async function extendScanWorkerLock(owner: string, ttlSeconds = 60) {
  const redis = getRedis() as any;
  const current = await redis.get(LOCK_KEY);
  if (current !== owner) return false;
  await redis.expire(LOCK_KEY, ttlSeconds);
  return true;
}

export async function createScanJob(params: {
  scope?: ScanScope;
  mode?: ScanMode;
  reason?: ScanReason;
  keywordIds?: number[];
  cursorTopicId?: number;
  cursorReplyId?: number;
  batchSize?: number;
  throttleMs?: number;
  maxBatchesPerRun?: number;
}) {
  const db = getDb();
  const defaults = scanDefaults();
  const [job] = await db
    .insert(moderationScanJobs)
    .values({
      scope: params.scope || "all",
      mode: params.mode || "historical",
      reason: params.reason || "manual",
      keywordIds: jsonValue(params.keywordIds || null),
      status: "pending",
      cursorTopicId: params.cursorTopicId || 0,
      cursorReplyId: params.cursorReplyId || 0,
      batchSize: params.batchSize || defaults.batchSize,
      throttleMs: params.throttleMs ?? defaults.throttleMs,
      maxBatchesPerRun: params.maxBatchesPerRun || defaults.maxBatchesPerRun,
      createAt: dateValue(),
      updateAt: dateValue(),
    } as any)
    .returning();
  return job;
}

export async function createScheduledScanJobIfNeeded() {
  const db = getDb();
  const existing = await db
    .select()
    .from(moderationScanJobs)
    .where(and(eq(moderationScanJobs.reason, "scheduled"), inArray(moderationScanJobs.status, ["pending", "running", "paused"])))
    .limit(1);
  if (existing.length) return null;
  const lastDone = await db
    .select()
    .from(moderationScanJobs)
    .where(and(eq(moderationScanJobs.reason, "scheduled"), eq(moderationScanJobs.status, "done")))
    .orderBy(desc(moderationScanJobs.finishedAt))
    .limit(1);
  return createScanJob({
    scope: "all",
    mode: "incremental",
    reason: "scheduled",
    cursorTopicId: Number(lastDone[0]?.cursorTopicId || 0),
    cursorReplyId: Number(lastDone[0]?.cursorReplyId || 0),
  });
}

export async function listScanJobs(limit = 50) {
  const db = getDb();
  return db.select().from(moderationScanJobs).orderBy(desc(moderationScanJobs.createAt)).limit(limit);
}

export async function listPendingHits(limit = 100) {
  const db = getDb();
  return db.select().from(moderationHits).where(eq(moderationHits.status, "pending")).orderBy(desc(moderationHits.scannedAt)).limit(limit);
}

export async function pendingHitCount() {
  const db = getDb();
  const rows = await db.select({ c: sql<number>`count(*)` }).from(moderationHits).where(eq(moderationHits.status, "pending"));
  return Number(rows[0]?.c || 0);
}

export async function claimNextScanJob() {
  const db = getDb();
  const rows = await db
    .select()
    .from(moderationScanJobs)
    .where(inArray(moderationScanJobs.status, ["running", "pending"]))
    .orderBy(sql`case when ${moderationScanJobs.status} = 'running' then 0 else 1 end`, asc(moderationScanJobs.createAt))
    .limit(1);
  const job = rows[0];
  if (!job) return null;
  const [claimed] = await db
    .update(moderationScanJobs)
    .set({ status: "running", startedAt: dateValue(), updateAt: dateValue() } as any)
    .where(and(eq(moderationScanJobs.id, job.id), eq(moderationScanJobs.status, job.status)))
    .returning();
  return claimed || null;
}

export async function runScanJobNow(id: number) {
  const db = getDb();
  const rows = await db.select().from(moderationScanJobs).where(eq(moderationScanJobs.id, id)).limit(1);
  const job = rows[0];
  if (!job) return null;
  if (["done", "failed", "cancelled"].includes(job.status)) return job;
  if (job.status === "paused") {
    const [updated] = await db
      .update(moderationScanJobs)
      .set({ status: "pending", updateAt: dateValue() } as any)
      .where(eq(moderationScanJobs.id, id))
      .returning();
    return updated || job;
  }
  await db.update(moderationScanJobs).set({ updateAt: dateValue() } as any).where(eq(moderationScanJobs.id, id));
  return job;
}

export async function cancelScanJob(id: number) {
  const db = getDb();
  const rows = await db.select().from(moderationScanJobs).where(eq(moderationScanJobs.id, id)).limit(1);
  const job = rows[0];
  if (!job) return null;
  if (["done", "failed", "cancelled"].includes(job.status)) return job;
  const [updated] = await db
    .update(moderationScanJobs)
    .set({ status: "cancelled", finishedAt: dateValue(), updateAt: dateValue() } as any)
    .where(and(eq(moderationScanJobs.id, id), inArray(moderationScanJobs.status, ["pending", "running", "paused"])))
    .returning();
  return updated || job;
}

export async function pauseScanJob(id: number) {
  const db = getDb();
  await db.update(moderationScanJobs).set({ status: "paused", updateAt: dateValue() } as any).where(eq(moderationScanJobs.id, id));
}

export async function resumeScanJob(id: number) {
  const db = getDb();
  await db.update(moderationScanJobs).set({ status: "pending", updateAt: dateValue() } as any).where(eq(moderationScanJobs.id, id));
}

export async function failScanJob(id: number, error: unknown) {
  const db = getDb();
  const current = await refreshJob(id);
  if (current?.status === "cancelled") return;
  await db
    .update(moderationScanJobs)
    .set({ status: "failed", error: error instanceof Error ? error.message : String(error), finishedAt: dateValue(), updateAt: dateValue() } as any)
    .where(eq(moderationScanJobs.id, id));
}

async function finishScanJob(id: number) {
  const db = getDb();
  await db.update(moderationScanJobs).set({ status: "done", finishedAt: dateValue(), updateAt: dateValue() } as any).where(eq(moderationScanJobs.id, id));
}

async function refreshJob(id: number) {
  const db = getDb();
  const rows = await db.select().from(moderationScanJobs).where(eq(moderationScanJobs.id, id)).limit(1);
  return rows[0] || null;
}

async function updateScanJobProgress(id: number, topicResult: { scanned: number; hits: number; cursor: number }, replyResult: { scanned: number; hits: number; cursor: number }) {
  const scanned = topicResult.scanned + replyResult.scanned;
  const hits = topicResult.hits + replyResult.hits;
  await getDb()
    .update(moderationScanJobs)
    .set({
      cursorTopicId: topicResult.cursor,
      cursorReplyId: replyResult.cursor,
      scannedCount: sql`${moderationScanJobs.scannedCount} + ${scanned}`,
      hitCount: sql`${moderationScanJobs.hitCount} + ${hits}`,
      updateAt: dateValue(),
    } as any)
    .where(eq(moderationScanJobs.id, id));
  return { scanned, hits };
}

async function wordsForJob(job: any) {
  const words = await loadWords();
  const ids = decodeJsonArray(job.keywordIds);
  if (!ids?.length) return words;
  const idSet = new Set(ids);
  return words.filter((word) => idSet.has(word.id));
}

async function insertHit(data: {
  scanJobId: number;
  targetType: "topic" | "reply";
  targetId: number;
  topicId?: number | null;
  authorId?: number | null;
  field: string;
  hits: ReturnType<typeof matchContent>;
  preview: string;
}) {
  if (!data.hits.length) return 0;
  const db = getDb();
  const keywords = data.hits.map((hit) => hit.word);
  const keywordIds = data.hits.map((hit) => hit.keywordId).filter((id): id is number => !!id);
  const dedupeKey = createHitDedupeKey(data.targetType, data.targetId, data.field, keywords.join("|"));
  const existing = await db.select().from(moderationHits).where(eq(moderationHits.dedupeKey, dedupeKey)).limit(1);
  if (existing[0]?.status === "confirmed") {
    await db
      .update(moderationHits)
      .set({
        scanJobId: data.scanJobId,
        topicId: data.topicId ?? (data.targetType === "topic" ? data.targetId : null),
        authorId: data.authorId ?? null,
        keywordIds: jsonValue(keywordIds),
        keywords: jsonValue(keywords),
        preview: data.preview,
        status: "pending",
        action: "none",
        handledBy: null,
        handledAt: null,
        scannedAt: dateValue(),
        updateAt: dateValue(),
      } as any)
      .where(eq(moderationHits.id, existing[0].id));
    await incrementSensitiveWordHits(data.hits);
    return 1;
  }
  const inserted = await db
    .insert(moderationHits)
    .values({
      scanJobId: data.scanJobId,
      targetType: data.targetType,
      targetId: data.targetId,
      topicId: data.topicId ?? (data.targetType === "topic" ? data.targetId : null),
      authorId: data.authorId ?? null,
      field: data.field,
      keywordIds: jsonValue(keywordIds),
      keywords: jsonValue(keywords),
      preview: data.preview,
      dedupeKey,
      status: "pending",
      action: "none",
      scannedAt: dateValue(),
      createAt: dateValue(),
      updateAt: dateValue(),
    } as any)
    .onConflictDoNothing()
    .returning({ id: moderationHits.id });
  if (inserted.length > 0) await incrementSensitiveWordHits(data.hits);
  return inserted.length;
}

async function scanTopicBatch(job: any, words: SensitiveWordEntry[]) {
  const db = getDb();
  const cursor = Number(job.cursorTopicId || 0);
  const historical = job.mode === "historical";
  const conditions = [boolEq(topics.deleted, false), ne(topics.status, "draft")];
  if (historical) {
    if (cursor > 0) conditions.unshift(lt(topics.id, cursor));
  } else {
    conditions.unshift(gt(topics.id, cursor));
  }
  const rows = await db
    .select({ id: topics.id, title: topics.title, content: topics.content, authorId: topics.authorId })
    .from(topics)
    .where(and(...conditions))
    .orderBy(historical ? desc(topics.id) : asc(topics.id))
    .limit(Number(job.batchSize || DEFAULT_BATCH_SIZE));
  let hits = 0;
  for (const row of rows) {
    const fields = [
      { name: "title", value: row.title || "" },
      { name: "content", value: row.content || "" },
    ];
    for (const field of fields) {
      const fieldHits = matchContent(field.value, words);
      if (!fieldHits.length) continue;
      hits += await insertHit({
        scanJobId: job.id,
        targetType: "topic",
        targetId: row.id,
        topicId: row.id,
        authorId: row.authorId,
        field: field.name,
        hits: fieldHits,
        preview: createHitPreview(field.value, fieldHits[0]?.index || 0),
      });
    }
  }
  const lastId = rows.at(-1)?.id ?? cursor;
  return { scanned: rows.length, hits, cursor: lastId };
}

async function scanReplyBatch(job: any, words: SensitiveWordEntry[]) {
  const db = getDb();
  const cursor = Number(job.cursorReplyId || 0);
  const historical = job.mode === "historical";
  const conditions = [boolEq(replies.deleted, false)];
  if (historical) {
    if (cursor > 0) conditions.unshift(lt(replies.id, cursor));
  } else {
    conditions.unshift(gt(replies.id, cursor));
  }
  const rows = await db
    .select({ id: replies.id, topicId: replies.topicId, content: replies.content, authorId: replies.authorId })
    .from(replies)
    .where(and(...conditions))
    .orderBy(historical ? desc(replies.id) : asc(replies.id))
    .limit(Number(job.batchSize || DEFAULT_BATCH_SIZE));
  let hits = 0;
  for (const row of rows) {
    const content = row.content || "";
    const fieldHits = matchContent(content, words);
    if (!fieldHits.length) continue;
    hits += await insertHit({
      scanJobId: job.id,
      targetType: "reply",
      targetId: row.id,
      topicId: row.topicId,
      authorId: row.authorId,
      field: "content",
      hits: fieldHits,
      preview: createHitPreview(content, fieldHits[0]?.index || 0),
    });
  }
  const lastId = rows.at(-1)?.id ?? cursor;
  return { scanned: rows.length, hits, cursor: lastId };
}

export async function processScanBatch(job: any) {
  const current = await refreshJob(job.id);
  if (!current || current.status !== "running") return { done: true, scanned: 0, hits: 0 };
  const words = await wordsForJob(current);
  if (!words.length) {
    await finishScanJob(current.id);
    return { done: true, scanned: 0, hits: 0 };
  }

  const scope = current.scope as ScanScope;
  const shouldScanTopics = scope === "topics" || scope === "all";
  const shouldScanReplies = scope === "replies" || scope === "all";
  const topicResult = shouldScanTopics ? await scanTopicBatch(current, words) : { scanned: 0, hits: 0, cursor: Number(current.cursorTopicId || 0) };
  const afterTopics = await refreshJob(current.id);
  if (!afterTopics || afterTopics.status !== "running") {
    const replyResult = { scanned: 0, hits: 0, cursor: Number(current.cursorReplyId || 0) };
    const progress = await updateScanJobProgress(current.id, topicResult, replyResult);
    return { done: true, ...progress };
  }
  const replyResult = shouldScanReplies ? await scanReplyBatch(afterTopics || current, words) : { scanned: 0, hits: 0, cursor: Number(current.cursorReplyId || 0) };
  const { scanned, hits } = await updateScanJobProgress(current.id, topicResult, replyResult);

  const done = (!shouldScanTopics || topicResult.scanned === 0) && (!shouldScanReplies || replyResult.scanned === 0);
  if (done) {
    const latest = await refreshJob(current.id);
    if (latest?.status === "running") await finishScanJob(current.id);
  }
  return { done, scanned, hits };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function drainScanQueue(owner: string, maxJobs = 20) {
  let processed = 0;
  while (processed < maxJobs && (await extendScanWorkerLock(owner))) {
    const job = await claimNextScanJob();
    if (!job) break;
    const throttleMs = Number(job.throttleMs ?? process.env.MODERATION_SCAN_THROTTLE_MS ?? 500);
    try {
      while (await extendScanWorkerLock(owner)) {
        const result = await processScanBatch(job);
        if (result.done) break;
        if (throttleMs > 0) await sleep(throttleMs);
      }
    } catch (error) {
      await failScanJob(job.id, error);
      throw error;
    }
    processed += 1;
  }
  return processed;
}

export async function triggerScanDrain() {
  const owner = await acquireScanWorkerLock();
  if (!owner) return false;
  try {
    await drainScanQueue(owner);
    return true;
  } finally {
    await releaseScanWorkerLock(owner);
  }
}

export async function handleModerationHit(id: number, action: "confirm" | "falsepositive" | "ignore", handlerId: number) {
  const db = getDb();
  const rows = await db.select().from(moderationHits).where(eq(moderationHits.id, id)).limit(1);
  const hit = rows[0];
  if (!hit) return null;
  const status = action === "confirm" ? "confirmed" : action === "falsepositive" ? "false_positive" : "ignored";
  await db
    .update(moderationHits)
    .set({ status, action, handledBy: handlerId, handledAt: dateValue(), updateAt: dateValue() } as any)
    .where(eq(moderationHits.id, id));
  return hit;
}
