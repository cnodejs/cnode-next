import { createDb, type DB } from "@cnode/db";
import {
  users,
  topics,
  replies,
  messages,
  topicCollects,
  auditLogs,
  sensitiveWords,
  reports,
  ipBans,
  siteSettings,
} from "@cnode/db";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

let dbInstance: DB | null = null;

function getDb(): DB {
  if (!dbInstance) {
    dbInstance = createDb();
  }
  return dbInstance;
}

export const userQueries = {
  async getByLoginName(loginname: string) {
    const db = getDb();
    const result = await db.select().from(users).where(eq(users.loginname, loginname)).limit(1);
    return result[0] || null;
  },

  async getByEmail(email: string) {
    const db = getDb();
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  },

  async getById(id: number) {
    const db = getDb();
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  },

  async getByGithubId(githubId: string) {
    const db = getDb();
    const result = await db.select().from(users).where(eq(users.githubId, githubId)).limit(1);
    return result[0] || null;
  },

  async getByToken(token: string) {
    const db = getDb();
    const result = await db.select().from(users).where(eq(users.accessToken, token)).limit(1);
    return result[0] || null;
  },

  async getByNameAndKey(loginname: string, key: string) {
    const db = getDb();
    const result = await db
      .select()
      .from(users)
      .where(and(eq(users.loginname, loginname), eq(users.retrieveKey, key)))
      .limit(1);
    return result[0] || null;
  },

  async newAndSave(params: {
    loginname: string;
    pass: string;
    email: string;
    avatar?: string;
    active?: boolean;
  }) {
    const db = getDb();
    const [user] = await db
      .insert(users)
      .values({
        loginname: params.loginname,
        pass: params.pass,
        email: params.email,
        avatar: params.avatar || "",
        active: params.active ? 1 : 0,
        accessToken: uuidv4(),
      })
      .returning();
    return user;
  },

  async updateGithubInfo(
    userId: number,
    params: {
      githubId?: string;
      githubUsername?: string;
      githubAccessToken?: string;
      avatar?: string;
    },
  ) {
    const db = getDb();
    await db.update(users).set(params).where(eq(users.id, userId));
  },

  async updatePass(userId: number, passhash: string) {
    const db = getDb();
    await db.update(users).set({ pass: passhash }).where(eq(users.id, userId));
  },

  async updateRetrieveKey(userId: number, key: string, time: number) {
    const db = getDb();
    await db
      .update(users)
      .set({ retrieveKey: key, retrieveTime: time })
      .where(eq(users.id, userId));
  },

  async updateActive(userId: number) {
    const db = getDb();
    await db.update(users).set({ active: 1 }).where(eq(users.id, userId));
  },

  async updateAccessToken(userId: number, token: string) {
    const db = getDb();
    await db.update(users).set({ accessToken: token }).where(eq(users.id, userId));
  },

  async updateProfile(
    userId: number,
    params: {
      url?: string;
      location?: string;
      signature?: string;
      weibo?: string;
      receive_reply_mail?: boolean;
      receive_at_mail?: boolean;
    },
  ) {
    const db = getDb();
    const updates: any = {};
    if (params.url !== undefined) updates.url = params.url;
    if (params.location !== undefined) updates.location = params.location;
    if (params.signature !== undefined) updates.signature = params.signature;
    if (params.weibo !== undefined) updates.weibo = params.weibo;
    if (params.receive_reply_mail !== undefined)
      updates.receiveReplyMail = params.receive_reply_mail ? 1 : 0;
    if (params.receive_at_mail !== undefined)
      updates.receiveAtMail = params.receive_at_mail ? 1 : 0;
    await db.update(users).set(updates).where(eq(users.id, userId));
  },
};

export const topicQueries = {
  async getById(id: number) {
    const db = getDb();
    const result = await db.select().from(topics).where(eq(topics.id, id)).limit(1);
    return result[0] || null;
  },

  async getByQuery(where: any, opt?: any) {
    const db = getDb();
    let q = db.select().from(topics).$dynamic();
    const conditions = [];
    if (where.deleted !== undefined) {
      conditions.push(eq(topics.deleted, where.deleted));
    }
    if (where.tab) {
      conditions.push(eq(topics.tab, where.tab));
    }
    if (where.good !== undefined) {
      conditions.push(eq(topics.good, where.good));
    }
    if (where.authorId !== undefined) {
      conditions.push(eq(topics.authorId, where.authorId));
    }
    if (conditions.length > 0) {
      q = q.where(conditions.length === 1 ? conditions[0] : and(...conditions)) as any;
    }
    const limit = opt?.limit || 20;
    const offset = opt?.offset || 0;
    return q.limit(limit).offset(offset);
  },

  async newAndSave(title: string, content: string, tab: string, authorId: number) {
    const db = getDb();
    const now = new Date().toISOString();
    const [topic] = await db
      .insert(topics)
      .values({ title, content, tab, authorId, createAt: now, updateAt: now })
      .returning();
    return topic;
  },

  async updateLastReply(topicId: number, replyId: number) {
    const db = getDb();
    await db
      .update(topics)
      .set({ lastReplyId: replyId, lastReplyAt: new Date().toISOString() })
      .where(eq(topics.id, topicId));
  },

  async incrementVisitCount(id: number) {
    const db = getDb();
    await db
      .update(topics)
      .set({ visitCount: sql`${topics.visitCount} + 1` })
      .where(eq(topics.id, id));
  },

  async incrementCollectCount(id: number) {
    const db = getDb();
    await db
      .update(topics)
      .set({ collectCount: sql`${topics.collectCount} + 1` })
      .where(eq(topics.id, id));
  },

  async decrementCollectCount(id: number) {
    const db = getDb();
    await db
      .update(topics)
      .set({ collectCount: sql`${topics.collectCount} - 1` })
      .where(eq(topics.id, id));
  },
};

export const replyQueries = {
  async getById(id: number) {
    const db = getDb();
    const result = await db.select().from(replies).where(eq(replies.id, id)).limit(1);
    return result[0] || null;
  },

  async getByTopicId(topicId: number) {
    const db = getDb();
    return db
      .select()
      .from(replies)
      .where(and(eq(replies.topicId, topicId), eq(replies.deleted, 0)));
  },

  async getByAuthorId(authorId: number, opt?: any) {
    const db = getDb();
    const limit = opt?.limit || 20;
    return db.select().from(replies).where(eq(replies.authorId, authorId)).limit(limit);
  },

  async newAndSave(content: string, topicId: number, authorId: number, replyId?: number) {
    const db = getDb();
    const now = new Date().toISOString();
    const [reply] = await db
      .insert(replies)
      .values({ content, topicId, authorId, replyId, createAt: now, updateAt: now })
      .returning();
    return reply;
  },
};

export { getDb };

export const auditQueries = {
  async log(
    operatorId: number | null,
    operatorName: string,
    action: string,
    target: { type?: string; id?: string; name?: string },
    result: string,
    detail?: string,
  ) {
    const db = getDb();
    await db.insert(auditLogs).values({
      operatorId,
      operatorName,
      action,
      targetType: target.type || null,
      targetId: target.id ? String(target.id) : null,
      targetName: target.name || null,
      result,
      detail,
      createAt: new Date().toISOString(),
    });
  },

  async getList(limit = 50) {
    const db = getDb();
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createAt)).limit(limit);
  },
};

export const keywordQueries = {
  async list() {
    const db = getDb();
    return db.select().from(sensitiveWords).orderBy(desc(sensitiveWords.createAt));
  },

  async add(word: string, category?: string) {
    const db = getDb();
    await db
      .insert(sensitiveWords)
      .values({ word, category: category || null, createAt: new Date().toISOString() });
  },

  async bulkAdd(words: { word: string; category?: string }[]) {
    const db = getDb();
    for (const w of words) {
      await db
        .insert(sensitiveWords)
        .values({ ...w, createAt: new Date().toISOString() })
        .onConflictDoNothing();
    }
  },

  async remove(id: number) {
    const db = getDb();
    await db.delete(sensitiveWords).where(eq(sensitiveWords.id, id));
  },
};

export const reportQueries = {
  async list() {
    const db = getDb();
    return db
      .select()
      .from(reports)
      .where(eq(reports.status, "pending"))
      .orderBy(desc(reports.createAt));
  },

  async create(data: {
    targetType: string;
    targetId: number;
    reporterId: number;
    type: string;
    description?: string;
  }) {
    const db = getDb();
    await db.insert(reports).values({ ...data, createAt: new Date().toISOString() });
  },

  async handle(id: number, handlerId: number, action: string) {
    const db = getDb();
    const status = action === "confirm" ? "confirmed" : "dismissed";
    await db
      .update(reports)
      .set({ status, handlerId, handleAt: new Date().toISOString() })
      .where(eq(reports.id, id));
  },
};

export const ipBanQueries = {
  async list() {
    const db = getDb();
    return db.select().from(ipBans).orderBy(desc(ipBans.createAt));
  },

  async add(ip: string, reason?: string, source = "manual") {
    const db = getDb();
    await db.insert(ipBans).values({ ip, reason, source, createAt: new Date().toISOString() });
  },

  async remove(id: number) {
    const db = getDb();
    await db.delete(ipBans).where(eq(ipBans.id, id));
  },

  async isBanned(ip: string) {
    const db = getDb();
    const result = await db.select().from(ipBans).where(eq(ipBans.ip, ip)).limit(1);
    return result.length > 0;
  },
};

export const settingQueries = {
  async getAll(): Promise<Record<string, string>> {
    const db = getDb();
    const rows = await db.select().from(siteSettings);
    const result: Record<string, string> = {};
    for (const row of rows) {
      if (row.key && row.value) result[row.key] = row.value;
    }
    return result;
  },

  async get(key: string, defaultValue?: string): Promise<string | undefined> {
    const db = getDb();
    const result = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    return result[0]?.value ?? defaultValue;
  },

  async set(key: string, value: string) {
    const db = getDb();
    await db.delete(siteSettings).where(eq(siteSettings.key, key));
    await db.insert(siteSettings).values({ key, value, updateAt: new Date().toISOString() });
  },
};
