import { MongoClient } from "mongodb";
import { Pool } from "pg";
import { parsePostgresConfig } from "@cnode/shared";
import { readFile } from "fs/promises";
import { loadRootEnv } from "./env";

loadRootEnv({ cwd: import.meta.dirname });

interface MigrationReport {
  skipped?: Record<string, { count: number }>;
}

const reportPath = process.env.MIGRATION_REPORT_PATH || "/app/migration-report.json";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function pgPool() {
  return new Pool(parsePostgresConfig());
}

async function mongoCount(client: MongoClient, collection: string) {
  const db = client.db(process.env.MONGO_DB || undefined);
  const exists = await db.listCollections({ name: collection }).hasNext();
  return exists ? db.collection(collection).countDocuments() : 0;
}

async function mongoReplyUps(client: MongoClient) {
  const db = client.db(process.env.MONGO_DB || undefined);
  const exists = await db.listCollections({ name: "replies" }).hasNext();
  if (!exists) return 0;
  const result = await db
    .collection("replies")
    .aggregate([{ $project: { count: { $size: { $ifNull: ["$ups", []] } } } }, { $group: { _id: null, total: { $sum: "$count" } } }])
    .toArray();
  return Number(result[0]?.total || 0);
}

async function mongoReplyUpDuplicates(client: MongoClient) {
  const db = client.db(process.env.MONGO_DB || undefined);
  const exists = await db.listCollections({ name: "replies" }).hasNext();
  if (!exists) return 0;
  const result = await db
    .collection("replies")
    .aggregate([
      { $project: { ups: { $ifNull: ["$ups", []] } } },
      { $project: { len: { $size: "$ups" }, uniq: { $size: { $setUnion: ["$ups", []] } } } },
      { $project: { dups: { $subtract: ["$len", "$uniq"] } } },
      { $match: { dups: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$dups" } } },
    ])
    .toArray();
  return Number(result[0]?.total || 0);
}

async function pgCount(pool: Pool, table: string) {
  const result = await pool.query(`select count(*)::int as count from ${table}`);
  return Number(result.rows[0].count);
}

async function readMigrationReport(): Promise<MigrationReport> {
  const data = await readFile(reportPath, "utf8").catch(() => "{}");
  return JSON.parse(data) as MigrationReport;
}

function skipped(report: MigrationReport, keys: string[]) {
  return keys.reduce((total, key) => total + Number(report.skipped?.[key]?.count || 0), 0);
}

async function main() {
  const startedAt = Date.now();
  const mongo = new MongoClient(required("MONGO_URI"), { readPreference: "primaryPreferred" });
  const pool = pgPool();
  const migrationReport = await readMigrationReport();
  await mongo.connect();

  const checks = [
    ["users", await mongoCount(mongo, "users"), 0, await pgCount(pool, "users")],
    ["topics", await mongoCount(mongo, "topics"), skipped(migrationReport, ["topicsMissingAuthor"]), await pgCount(pool, "topics")],
    ["replies", await mongoCount(mongo, "replies"), skipped(migrationReport, ["repliesMissingTopic", "repliesMissingAuthor"]), await pgCount(pool, "replies")],
    ["messages", await mongoCount(mongo, "messages"), skipped(migrationReport, ["messagesMissingMaster", "messagesMissingAuthor"]), await pgCount(pool, "messages")],
    ["reply_ups", await mongoReplyUps(mongo), skipped(migrationReport, ["replyUpsMissingReply", "replyUpsMissingUser"]) + await mongoReplyUpDuplicates(mongo), await pgCount(pool, "reply_ups")],
  ] as const;

  await mongo.close();
  await pool.end();

  const rows = checks.map(([name, source, skippedCount, target]) => {
    const expected = source - skippedCount;
    return { name, source, skipped: skippedCount, expected, target, pass: expected === target };
  });
  const pass = rows.every((row) => row.pass);
  const report = { pass, durationSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(1)), checks: rows };
  console.log(JSON.stringify(report, null, 2));
  if (!pass) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
