import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  const dir = await mkdtemp(join(tmpdir(), "cnode-moderation-scan-"));
  const dbPath = join(dir, "test.db");
  process.env.DB_DIALECT = "sqlite";
  process.env.DB_SQLITE_PATH = dbPath;
  process.env.REDIS_HOST = "";
  process.env.REDIS_PORT = "";

  const Database = require("better-sqlite3") as typeof import("better-sqlite3");
  const sqlite = new Database(dbPath);
  sqlite.exec(`
    create table sensitive_words (id integer primary key autoincrement, word text not null unique, category text, hit_count integer default 0, create_at text);
    create table topics (id integer primary key autoincrement, title text, content text, author_id integer not null, tab text, top integer default 0, good integer default 0, lock integer default 0, status text default 'published', reply_count integer default 0, visit_count integer default 0, collect_count integer default 0, last_reply_id integer, last_reply_at text, archived integer default 0, deleted integer default 0, create_at text, update_at text);
    create table replies (id integer primary key autoincrement, content text, topic_id integer not null, author_id integer not null, reply_id integer, deleted integer default 0, create_at text, update_at text);
    create table moderation_scan_jobs (id integer primary key autoincrement, scope text not null default 'all', mode text not null default 'historical', reason text not null default 'manual', keyword_ids text, status text not null default 'pending', cursor_topic_id integer default 0, cursor_reply_id integer default 0, batch_size integer default 200, throttle_ms integer default 500, max_batches_per_run integer default 100, scanned_count integer default 0, hit_count integer default 0, last_scheduled_at text, started_at text, finished_at text, error text, create_at text, update_at text);
    create table moderation_hits (id integer primary key autoincrement, scan_job_id integer, target_type text not null, target_id integer not null, topic_id integer, author_id integer, field text, keyword_ids text, keywords text not null, preview text, dedupe_key text not null unique, status text not null default 'pending', action text default 'none', handled_by integer, handled_at text, scanned_at text, create_at text, update_at text);
  `);
  sqlite.close();

  const { createDb, sensitiveWords, topics, replies } = await import("../packages/db/src/index");
  const {
    createScanJob,
    claimNextScanJob,
    processScanBatch,
    listPendingHits,
    pauseScanJob,
    resumeScanJob,
    handleModerationHit,
    createScheduledScanJobIfNeeded,
    listScanJobs,
  } = await import("../apps/api/src/lib/moderation-scan");

  const db = createDb();
  const [word] = await db.insert(sensitiveWords).values({ word: "VPN", category: "circumvention", createAt: new Date().toISOString() }).returning();
  const [topic] = await db.insert(topics).values({ title: "普通标题", content: "这里提到了 VPN", authorId: 1, tab: "share", createAt: new Date().toISOString(), updateAt: new Date().toISOString() }).returning();
  const [reply] = await db.insert(replies).values({ content: "回复里也有 VPN", topicId: topic.id, authorId: 2, createAt: new Date().toISOString(), updateAt: new Date().toISOString() }).returning();

  await createScanJob({ scope: "all", mode: "historical", reason: "keyword_added", keywordIds: [word.id], batchSize: 1, throttleMs: 0, maxBatchesPerRun: 10 });
  const job = await claimNextScanJob();
  assert(job, "should claim scan job");
  await processScanBatch(job);
  await processScanBatch(job);
  const hits = await listPendingHits();
  assert(hits.length === 2, "should create topic and reply hits");

  await pauseScanJob(job.id);
  let jobs = await listScanJobs();
  assert(jobs[0].status === "paused", "should pause job");
  await resumeScanJob(job.id);
  jobs = await listScanJobs();
  assert(jobs[0].status === "pending", "should resume job");

  const handled = await handleModerationHit(hits[0].id, "confirm", 99);
  assert(handled, "should handle moderation hit");
  const remainingHits = await listPendingHits();
  assert(remainingHits.length === 1, "handled hit should leave pending queue");

  await createScheduledScanJobIfNeeded();
  await createScheduledScanJobIfNeeded();
  jobs = await listScanJobs();
  const scheduledOpen = jobs.filter((item: any) => item.reason === "scheduled" && ["pending", "running", "paused"].includes(item.status));
  assert(scheduledOpen.length === 1, "should avoid duplicate scheduled jobs");
  assert(reply.id > 0, "reply fixture should exist");

  await rm(dir, { recursive: true, force: true });
  console.log("moderation scan runtime verification passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
