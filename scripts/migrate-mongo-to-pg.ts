import { MongoClient, ObjectId } from "mongodb";
import { Pool } from "pg";
import { writeFile } from "fs/promises";
import { loadRootEnv } from "./env";

loadRootEnv({ cwd: import.meta.dirname });

type LegacyDoc = Record<string, any> & { _id: ObjectId };
type IdMap = Map<string, number>;
type SkipKey =
  | "topicsMissingAuthor"
  | "repliesMissingTopic"
  | "repliesMissingAuthor"
  | "messagesMissingMaster"
  | "messagesMissingAuthor"
  | "replyUpsMissingReply"
  | "replyUpsMissingUser"
  | "topicCollectsMissingUser"
  | "topicCollectsMissingTopic";

interface MigrationReport {
  startedAt: string;
  completedAt?: string;
  source: Record<string, number>;
  skipped: Record<SkipKey, { count: number; samples: string[] }>;
}

const startedAt = Date.now();
const batchSize = Number(process.env.MIGRATION_BATCH_SIZE || 500);
const reportPath = process.env.MIGRATION_REPORT_PATH || "/app/migration-report.json";
const skipKeys: SkipKey[] = [
  "topicsMissingAuthor",
  "repliesMissingTopic",
  "repliesMissingAuthor",
  "messagesMissingMaster",
  "messagesMissingAuthor",
  "replyUpsMissingReply",
  "replyUpsMissingUser",
  "topicCollectsMissingUser",
  "topicCollectsMissingTopic",
];

function createReport(): MigrationReport {
  return {
    startedAt: new Date().toISOString(),
    source: {},
    skipped: Object.fromEntries(skipKeys.map((key) => [key, { count: 0, samples: [] }])) as MigrationReport["skipped"],
  };
}

function recordSkip(report: MigrationReport, key: SkipKey, doc: LegacyDoc) {
  const entry = report.skipped[key];
  entry.count += 1;
  if (entry.samples.length < 20) {
    entry.samples.push(doc._id.toHexString());
  }
}

function recordSkipCount(report: MigrationReport, key: SkipKey, doc: LegacyDoc, count: number) {
  const entry = report.skipped[key];
  entry.count += count;
  if (count > 0 && entry.samples.length < 20) {
    entry.samples.push(doc._id.toHexString());
  }
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function pgPool() {
  return new Pool({
    host: required("DB_HOST"),
    port: Number(process.env.DB_PORT || 5432),
    database: required("DB_NAME"),
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
  });
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toBool(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function cleanText(value: unknown, fallback = ""): string {
  return String(value ?? fallback).replaceAll("\0", "");
}

function oid(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof ObjectId) return value.toHexString();
  return String(value);
}

function mapId(map: IdMap, value: unknown): number | null {
  const key = oid(value);
  return key ? (map.get(key) ?? null) : null;
}

async function collectionExists(client: MongoClient, name: string): Promise<boolean> {
  const db = client.db(process.env.MONGO_DB || undefined);
  return db.listCollections({ name }).hasNext();
}

async function firstCollectionName(client: MongoClient, names: string[]): Promise<string | null> {
  for (const name of names) {
    if (await collectionExists(client, name)) return name;
  }
  return null;
}

async function buildIdMap(client: MongoClient, collectionName: string | null): Promise<IdMap> {
  const map: IdMap = new Map();
  if (!collectionName) return map;
  const cursor = client
    .db(process.env.MONGO_DB || undefined)
    .collection<LegacyDoc>(collectionName)
    .find({}, { projection: { _id: 1 } })
    .sort({ _id: 1 })
    .batchSize(batchSize);
  let id = 1;
  for await (const doc of cursor) {
    map.set(doc._id.toHexString(), id);
    id += 1;
  }
  return map;
}

async function forEachDoc(client: MongoClient, collectionName: string | null, handler: (doc: LegacyDoc) => Promise<void>) {
  if (!collectionName) return;
  const cursor = client
    .db(process.env.MONGO_DB || undefined)
    .collection<LegacyDoc>(collectionName)
    .find({})
    .sort({ _id: 1 })
    .batchSize(batchSize);
  for await (const doc of cursor) {
    await handler(doc);
  }
}

function uniqueValue(value: string, seen: Set<string>, suffix: string): string {
  const key = value.toLowerCase();
  if (!seen.has(key)) {
    seen.add(key);
    return value;
  }
  const next = `${value}__legacy_${suffix}`;
  seen.add(next.toLowerCase());
  return next;
}

async function resetTarget(pool: Pool) {
  await pool.query(
    "truncate table topic_collects, reply_ups, messages, replies, topics, users restart identity cascade",
  );
}

async function insertUsers(client: MongoClient, pool: Pool, collectionName: string | null, userMap: IdMap) {
  const loginNames = new Set<string>();
  const emails = new Set<string>();
  await forEachDoc(client, collectionName, async (user) => {
    const id = userMap.get(user._id.toHexString())!;
    const suffix = user._id.toHexString();
    const loginname = uniqueValue(cleanText(user.loginname || user.name, `legacy_user_${id}`), loginNames, suffix);
    const email = uniqueValue(cleanText(user.email, `${loginname}-${id}@legacy.invalid`), emails, suffix);
    await pool.query(
      `insert into users (
        id, loginname, pass, email, url, profile_image_url, location, signature, profile, weibo,
        avatar, github_id, github_username, github_access_token, is_block, score, topic_count,
        reply_count, collect_topic_count, is_star, level, active, access_token, receive_reply_mail,
        receive_at_mail, retrieve_key, retrieve_time, create_at, update_at
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29
      )`,
      [
        id,
        loginname,
        user.pass ? cleanText(user.pass) : null,
        email,
        user.url ? cleanText(user.url) : null,
        user.profile_image_url ? cleanText(user.profile_image_url) : null,
        user.location ? cleanText(user.location) : null,
        user.signature ? cleanText(user.signature) : null,
        user.profile ? cleanText(user.profile) : null,
        user.weibo ? cleanText(user.weibo) : null,
        user.avatar || user.avatar_url ? cleanText(user.avatar || user.avatar_url) : null,
        user.githubId || user.github_id ? cleanText(user.githubId || user.github_id) : null,
        user.githubUsername || user.github_username ? cleanText(user.githubUsername || user.github_username) : null,
        user.githubAccessToken || user.github_access_token ? cleanText(user.githubAccessToken || user.github_access_token) : null,
        toBool(user.is_block),
        Number(user.score || 0),
        Number(user.topic_count || 0),
        Number(user.reply_count || 0),
        Number(user.collect_topic_count || 0),
        user.is_star === null || user.is_star === undefined ? null : toBool(user.is_star),
        user.level ? cleanText(user.level) : null,
        toBool(user.active),
        user.accessToken || user.access_token ? cleanText(user.accessToken || user.access_token) : null,
        toBool(user.receive_reply_mail),
        toBool(user.receive_at_mail),
        user.retrieve_key ? cleanText(user.retrieve_key) : null,
        user.retrieve_time || null,
        toDate(user.create_at) || new Date(0),
        toDate(user.update_at) || toDate(user.create_at) || new Date(0),
      ],
    );
  });
}

async function insertTopics(client: MongoClient, pool: Pool, collectionName: string | null, topicMap: IdMap, replyMap: IdMap, userMap: IdMap, report: MigrationReport) {
  await forEachDoc(client, collectionName, async (topic) => {
    const id = topicMap.get(topic._id.toHexString())!;
    const authorId = mapId(userMap, topic.author_id);
    if (!authorId) {
      recordSkip(report, "topicsMissingAuthor", topic);
      return;
    }
    await pool.query(
      `insert into topics (
        id, title, content, author_id, tab, top, good, lock, status, reply_count, visit_count,
        collect_count, last_reply_id, last_reply_at, archived, deleted, create_at, update_at
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [
        id,
        cleanText(topic.title),
        cleanText(topic.content),
        authorId,
        topic.tab ? cleanText(topic.tab) : null,
        toBool(topic.top),
        toBool(topic.good),
        toBool(topic.lock),
        cleanText(topic.status, "published"),
        Number(topic.reply_count || 0),
        Number(topic.visit_count || 0),
        Number(topic.collect_count || 0),
        mapId(replyMap, topic.last_reply),
        toDate(topic.last_reply_at),
        toBool(topic.archived),
        toBool(topic.deleted),
        toDate(topic.create_at) || new Date(0),
        toDate(topic.update_at) || toDate(topic.create_at) || new Date(0),
      ],
    );
  });
}

async function insertRepliesAndUps(client: MongoClient, pool: Pool, collectionName: string | null, replyMap: IdMap, topicMap: IdMap, userMap: IdMap, report: MigrationReport) {
  await forEachDoc(client, collectionName, async (reply) => {
    const id = replyMap.get(reply._id.toHexString())!;
    const topicId = mapId(topicMap, reply.topic_id);
    const authorId = mapId(userMap, reply.author_id);
    if (!topicId) {
      recordSkip(report, "repliesMissingTopic", reply);
      recordSkipCount(report, "replyUpsMissingReply", reply, (reply.ups || []).length);
      return;
    }
    if (!authorId) {
      recordSkip(report, "repliesMissingAuthor", reply);
      recordSkipCount(report, "replyUpsMissingReply", reply, (reply.ups || []).length);
      return;
    }
    await pool.query(
      `insert into replies (id, content, topic_id, author_id, reply_id, deleted, create_at, update_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        id,
        cleanText(reply.content),
        topicId,
        authorId,
        mapId(replyMap, reply.reply_id),
        toBool(reply.deleted),
        toDate(reply.create_at) || new Date(0),
        toDate(reply.update_at) || toDate(reply.create_at) || new Date(0),
      ],
    );
    for (const up of reply.ups || []) {
      const userId = mapId(userMap, up);
      if (!userId) {
        recordSkip(report, "replyUpsMissingUser", reply);
        continue;
      }
      await pool.query(
        "insert into reply_ups (reply_id, user_id, create_at) values ($1,$2,$3) on conflict do nothing",
        [id, userId, toDate(reply.update_at) || toDate(reply.create_at) || new Date(0)],
      );
    }
  });
}

async function insertMessages(client: MongoClient, pool: Pool, collectionName: string | null, messageMap: IdMap, topicMap: IdMap, replyMap: IdMap, userMap: IdMap, report: MigrationReport) {
  await forEachDoc(client, collectionName, async (message) => {
    const id = messageMap.get(message._id.toHexString())!;
    const masterId = mapId(userMap, message.master_id);
    const authorId = mapId(userMap, message.author_id);
    if (!masterId) {
      recordSkip(report, "messagesMissingMaster", message);
      return;
    }
    if (!authorId) {
      recordSkip(report, "messagesMissingAuthor", message);
      return;
    }
    await pool.query(
      `insert into messages (id, type, master_id, author_id, topic_id, reply_id, has_read, create_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        id,
        message.type ? cleanText(message.type) : null,
        masterId,
        authorId,
        mapId(topicMap, message.topic_id),
        mapId(replyMap, message.reply_id),
        toBool(message.has_read),
        toDate(message.create_at) || new Date(0),
      ],
    );
  });
}

async function insertTopicCollects(client: MongoClient, pool: Pool, collectionName: string | null, topicMap: IdMap, userMap: IdMap, report: MigrationReport) {
  await forEachDoc(client, collectionName, async (collect) => {
    const userId = mapId(userMap, collect.user_id);
    const topicId = mapId(topicMap, collect.topic_id);
    if (!userId) {
      recordSkip(report, "topicCollectsMissingUser", collect);
      return;
    }
    if (!topicId) {
      recordSkip(report, "topicCollectsMissingTopic", collect);
      return;
    }
    await pool.query(
      "insert into topic_collects (user_id, topic_id, create_at) values ($1,$2,$3) on conflict do nothing",
      [userId, topicId, toDate(collect.create_at) || new Date(0)],
    );
  });
}

async function resetSequences(pool: Pool) {
  for (const table of ["users", "topics", "replies", "messages"]) {
    await pool.query(`select setval(pg_get_serial_sequence('${table}', 'id'), coalesce((select max(id) from ${table}), 1))`);
  }
}

async function main() {
  const mongo = new MongoClient(required("MONGO_URI"), { readPreference: "primaryPreferred" });
  const pool = pgPool();
  const report = createReport();

  await mongo.connect();
  const usersCollection = await firstCollectionName(mongo, ["users"]);
  const topicsCollection = await firstCollectionName(mongo, ["topics"]);
  const repliesCollection = await firstCollectionName(mongo, ["replies"]);
  const messagesCollection = await firstCollectionName(mongo, ["messages"]);
  const collectsCollection = await firstCollectionName(mongo, ["topiccollects", "topic_collects"]);

  console.log("building id maps...");
  const userMap = await buildIdMap(mongo, usersCollection);
  const topicMap = await buildIdMap(mongo, topicsCollection);
  const replyMap = await buildIdMap(mongo, repliesCollection);
  const messageMap = await buildIdMap(mongo, messagesCollection);
  report.source = { users: userMap.size, topics: topicMap.size, replies: replyMap.size, messages: messageMap.size };

  try {
    await resetTarget(pool);
    console.log(`migrating users (${userMap.size})...`);
    await insertUsers(mongo, pool, usersCollection, userMap);
    console.log(`migrating topics (${topicMap.size})...`);
    await insertTopics(mongo, pool, topicsCollection, topicMap, replyMap, userMap, report);
    console.log(`migrating replies (${replyMap.size}) and reply_ups...`);
    await insertRepliesAndUps(mongo, pool, repliesCollection, replyMap, topicMap, userMap, report);
    console.log(`migrating messages (${messageMap.size})...`);
    await insertMessages(mongo, pool, messagesCollection, messageMap, topicMap, replyMap, userMap, report);
    console.log("migrating topic collects...");
    await insertTopicCollects(mongo, pool, collectsCollection, topicMap, userMap, report);
    await resetSequences(pool);
    report.completedAt = new Date().toISOString();
    await writeFile(reportPath, JSON.stringify(report, null, 2));
  } finally {
    await mongo.close();
    await pool.end();
  }

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`migration complete in ${seconds}s`);
  console.log(`migration report written to ${reportPath}`);
  console.log(JSON.stringify({ users: userMap.size, topics: topicMap.size, replies: replyMap.size, messages: messageMap.size }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
