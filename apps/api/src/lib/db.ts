import { createDb, type DB } from "@cnode/db";
import {
  users,
  topics,
  replies,
  replyUps,
  topicCollects,
  auditLogs,
  sensitiveWords,
  reports,
  ipBans,
  siteSettings,
  jobMeta,
  tabs,
  zones,
  userRoles,
} from "@cnode/db";
import { eq, and, desc, inArray, sql, count, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { boolEq, boolValue } from "./db-compat";

let dbInstance: DB | null = null;
const INTERNAL_TABS = ["dev", "test"];

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

  async getByRetrieveKey(key: string) {
    const db = getDb();
    const result = await db.select().from(users).where(eq(users.retrieveKey, key)).limit(1);
    return result[0] || null;
  },

  async newAndSave(params: {
    loginname: string;
    pass: string;
    email: string;
    avatar?: string;
    active?: boolean;
    githubId?: string;
    githubUsername?: string;
    githubAccessToken?: string;
  }) {
    const db = getDb();
    const [user] = await db
      .insert(users)
      .values({
        loginname: params.loginname,
        pass: params.pass,
        email: params.email,
        avatar: params.avatar || "",
        active: boolValue(!!params.active),
        accessToken: uuidv4(),
        githubId: params.githubId,
        githubUsername: params.githubUsername,
        githubAccessToken: params.githubAccessToken,
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

  async clearGithubInfo(userId: number, githubId: string) {
    const db = getDb();
    return db.transaction(async (tx: DB) => {
      const [updated] = await tx
        .update(users)
        .set({ githubId: null, githubUsername: null, githubAccessToken: null })
        .where(and(eq(users.id, userId), eq(users.githubId, githubId)))
        .returning({ id: users.id });
      return !!updated;
    });
  },

  async updatePass(userId: number, passhash: string) {
    const db = getDb();
    await db.update(users).set({ pass: passhash }).where(eq(users.id, userId));
  },

  async updateRetrieveKey(userId: number, key: string | null, time: number | null) {
    const db = getDb();
    await db
      .update(users)
      .set({ retrieveKey: key, retrieveTime: time })
      .where(eq(users.id, userId));
  },

  async updateActive(userId: number) {
    const db = getDb();
    await db
      .update(users)
      .set({ active: boolValue(true) } as any)
      .where(eq(users.id, userId));
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
      updates.receiveReplyMail = boolValue(params.receive_reply_mail);
    if (params.receive_at_mail !== undefined)
      updates.receiveAtMail = boolValue(params.receive_at_mail);
    await db.update(users).set(updates).where(eq(users.id, userId));
  },
};

export const activeUserRoleCondition = isNull(userRoles.revokedAt);

export const roleQueries = {
  async listByUserId(userId: number): Promise<string[]> {
    const db = getDb();
    const rows = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), activeUserRoleCondition));
    return rows.map((row) => row.role);
  },

  async listByUserIds(userIds: number[]): Promise<Map<number, string[]>> {
    const result = new Map<number, string[]>();
    if (userIds.length === 0) return result;

    const db = getDb();
    const rows = await db
      .select({ userId: userRoles.userId, role: userRoles.role })
      .from(userRoles)
      .where(and(inArray(userRoles.userId, userIds), activeUserRoleCondition));
    for (const row of rows) {
      const roles = result.get(row.userId) || [];
      roles.push(row.role);
      result.set(row.userId, roles);
    }
    return result;
  },

  async hasRole(userId: number, role: string): Promise<boolean> {
    const db = getDb();
    const rows = await db
      .select({ id: userRoles.id })
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.role, role), isNull(userRoles.revokedAt)))
      .limit(1);
    return rows.length > 0;
  },

  async grant(userId: number, role: string, grantedBy: number, reason?: string | null) {
    const db = getDb();
    await db
      .insert(userRoles)
      .values({ userId, role, grantedBy, reason: reason || null, createAt: new Date(), updateAt: new Date() })
      .onConflictDoNothing();
    return roleQueries.listByUserId(userId);
  },

  async revoke(userId: number, role: string) {
    const db = getDb();
    await db
      .update(userRoles)
      .set({ revokedAt: new Date(), updateAt: new Date() })
      .where(and(eq(userRoles.userId, userId), eq(userRoles.role, role), isNull(userRoles.revokedAt)));
    return roleQueries.listByUserId(userId);
  },
};

function topicConditions(where: any) {
  const conditions: any[] = [];
  if (where.deleted !== undefined) {
    conditions.push(boolEq(topics.deleted, !!where.deleted));
  }
  if (where.tab) {
    conditions.push(eq(topics.tab, where.tab));
  }
  if (where.excludeTabs?.length) {
    conditions.push(
      sql`(${topics.tab} is null or ${topics.tab} not in (${sql.join(
        where.excludeTabs.map((tab: string) => sql`${tab}`),
        sql`, `,
      )}))`,
    );
  }
  if (where.good !== undefined) {
    conditions.push(boolEq(topics.good, !!where.good));
  }
  if (where.authorId !== undefined) {
    conditions.push(eq(topics.authorId, where.authorId));
  }
  if (where.publicVisible) {
    conditions.push(boolEq(topics.deleted, false));
    conditions.push(sql`coalesce(${topics.status}, 'published') <> 'deleted'`);
    if (!where.includeInternalTabs) {
      conditions.push(
        sql`(${topics.tab} is null or ${topics.tab} not in (${sql.join(
          INTERNAL_TABS.map((tab) => sql`${tab}`),
          sql`, `,
        )}))`,
      );
    }
    conditions.push(
      sql`exists (select 1 from ${users} where ${users.id} = ${topics.authorId} and ${boolEq(users.isBlock, false)})`,
    );
  }
  return conditions;
}

export const topicQueries = {
  async getById(id: number) {
    const db = getDb();
    const result = await db.select().from(topics).where(eq(topics.id, id)).limit(1);
    return result[0] || null;
  },

  async getByQuery(where: any, opt?: any) {
    const db = getDb();
    let q = db.select().from(topics).$dynamic();
    const conditions = topicConditions(where);
    if (conditions.length > 0) {
      q = q.where(conditions.length === 1 ? conditions[0] : and(...conditions)) as any;
    }
    const limit = opt?.limit || 20;
    const offset = opt?.offset || 0;
    return q.orderBy(desc(topics.top), desc(topics.lastReplyAt)).limit(limit).offset(offset);
  },

  async countByQuery(where: any) {
    const db = getDb();
    let q = db.select({ c: count() }).from(topics).$dynamic();
    const conditions = topicConditions(where);
    if (conditions.length > 0) {
      q = q.where(conditions.length === 1 ? conditions[0] : and(...conditions)) as any;
    }
    const result = await q;
    return Number(result[0]?.c || 0);
  },

  async newAndSave(title: string, content: string, tab: string, authorId: number) {
    const db = getDb();
    const now = new Date();
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
      .set({
        lastReplyId: replyId,
        lastReplyAt: new Date(),
        replyCount: sql`${topics.replyCount} + 1`,
      })
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
      .set({
        collectCount: sql`case when ${topics.collectCount} - 1 < 0 then 0 else ${topics.collectCount} - 1 end`,
      })
      .where(eq(topics.id, id));
  },

  async decrementReplyCount(id: number) {
    const db = getDb();
    await db
      .update(topics)
      .set({
        replyCount: sql`case when ${topics.replyCount} - 1 < 0 then 0 else ${topics.replyCount} - 1 end`,
      })
      .where(eq(topics.id, id));
  },

  async updateTopic(id: number, params: { title: string; tab: string; content: string }) {
    const db = getDb();
    await db
      .update(topics)
      .set({ ...params, updateAt: new Date() } as any)
      .where(eq(topics.id, id));
  },

  async isCollected(topicId: number, userId: number) {
    const db = getDb();
    const result = await db
      .select()
      .from(topicCollects)
      .where(and(eq(topicCollects.topicId, topicId), eq(topicCollects.userId, userId)))
      .limit(1);
    return result.length > 0;
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
      .where(and(eq(replies.topicId, topicId), boolEq(replies.deleted, false)));
  },

  async getByAuthorId(authorId: number, opt?: any) {
    const db = getDb();
    const limit = opt?.limit || 20;
    return db
      .select()
      .from(replies)
      .where(and(eq(replies.authorId, authorId), boolEq(replies.deleted, false)))
      .orderBy(desc(replies.createAt))
      .limit(limit);
  },

  async newAndSave(content: string, topicId: number, authorId: number, replyId?: number) {
    const db = getDb();
    const now = new Date();
    const [reply] = await db
      .insert(replies)
      .values({ content, topicId, authorId, replyId, createAt: now, updateAt: now })
      .returning();
    return reply;
  },

  async updateContent(id: number, content: string) {
    const db = getDb();
    await db
      .update(replies)
      .set({ content, updateAt: new Date() } as any)
      .where(eq(replies.id, id));
  },

  async softDelete(id: number) {
    const db = getDb();
    await db
      .update(replies)
      .set({ deleted: boolValue(true) } as any)
      .where(eq(replies.id, id));
  },

  async getUpsByReplyIds(replyIds: number[]) {
    if (replyIds.length === 0) return [];
    const db = getDb();
    return db.select().from(replyUps).where(inArray(replyUps.replyId, replyIds));
  },

  async toggleUp(replyId: number, userId: number) {
    const db = getDb();
    const existing = await db
      .select()
      .from(replyUps)
      .where(and(eq(replyUps.replyId, replyId), eq(replyUps.userId, userId)))
      .limit(1);
    if (existing.length > 0) {
      await db
        .delete(replyUps)
        .where(and(eq(replyUps.replyId, replyId), eq(replyUps.userId, userId)));
      return "down" as const;
    }
    await db
      .insert(replyUps)
      .values({ replyId, userId, createAt: new Date() } as any);
    return "up" as const;
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
      createAt: new Date(),
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
      .values({ word, category: category || null, createAt: new Date() });
    const result = await db
      .select()
      .from(sensitiveWords)
      .where(eq(sensitiveWords.word, word))
      .limit(1);
    return result[0] || null;
  },

  async bulkAdd(words: { word: string; category?: string }[]) {
    const db = getDb();
    for (const w of words) {
      await db
        .insert(sensitiveWords)
        .values({ ...w, createAt: new Date() })
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
    await db.insert(reports).values({ ...data, createAt: new Date() });
  },

  async handle(id: number, handlerId: number, action: string) {
    const db = getDb();
    const status = action === "confirm" ? "confirmed" : "dismissed";
    await db
      .update(reports)
      .set({ status, handlerId, handleAt: new Date() })
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
    await db.insert(ipBans).values({ ip, reason, source, createAt: new Date() });
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
    await db.insert(siteSettings).values({ key, value, updateAt: new Date() });
  },
};

export const jobMetaQueries = {
  async upsert(topicId: number, data: {
    company: string;
    companyLogo?: string | null;
    position: string;
    location: string;
    remote: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    experience?: string | null;
    techTags?: string[];
    contact: string;
  }) {
    const db = getDb();
    await db
      .insert(jobMeta)
      .values({
        topicId,
        company: data.company,
        companyLogo: data.companyLogo ?? null,
        position: data.position,
        location: data.location,
        remote: data.remote,
        salaryMin: data.salaryMin ?? null,
        salaryMax: data.salaryMax ?? null,
        experience: data.experience ?? null,
        techTags: data.techTags ?? null,
        contact: data.contact,
        createAt: new Date(),
        updateAt: new Date(),
      })
      .onConflictDoUpdate({
        target: jobMeta.topicId,
        set: {
          company: data.company,
          companyLogo: data.companyLogo ?? null,
          position: data.position,
          location: data.location,
          remote: data.remote,
          salaryMin: data.salaryMin ?? null,
          salaryMax: data.salaryMax ?? null,
          experience: data.experience ?? null,
          techTags: data.techTags ?? null,
          contact: data.contact,
          updateAt: new Date(),
        },
      });
  },

  async getByTopicId(topicId: number) {
    const db = getDb();
    const result = await db.select().from(jobMeta).where(eq(jobMeta.topicId, topicId)).limit(1);
    return result[0] || null;
  },

  async listWithFilters(params: {
    limit: number;
    offset: number;
    location?: string;
    remote?: string;
    salaryMin?: number;
    tags?: string[];
  }) {
    const db = getDb();
    const conditions: any[] = [
      eq(topics.tab, "job"),
      boolEq(topics.deleted, false),
      sql`coalesce(${topics.status}, 'published') <> 'deleted'`,
      sql`${jobMeta.topicId} = ${topics.id}`,
    ];
    if (params.location) conditions.push(eq(jobMeta.location, params.location));
    if (params.remote) conditions.push(eq(jobMeta.remote, params.remote));
    if (params.salaryMin) conditions.push(sql`${jobMeta.salaryMax} >= ${params.salaryMin}`);
    if (params.tags && params.tags.length > 0) {
      conditions.push(sql`${jobMeta.techTags} && ${sql.raw(`ARRAY[${params.tags.map((t) => `'${t.replace(/'/g, "''")}'`).join(",")}]::text[]`)}`);
    }
    const where = and(...conditions);
    const listQuery = db
      .select({
        id: topics.id,
        title: topics.title,
        content: topics.content,
        authorId: topics.authorId,
        replyCount: topics.replyCount,
        visitCount: topics.visitCount,
        createAt: topics.createAt,
        company: jobMeta.company,
        companyLogo: jobMeta.companyLogo,
        position: jobMeta.position,
        location: jobMeta.location,
        remote: jobMeta.remote,
        salaryMin: jobMeta.salaryMin,
        salaryMax: jobMeta.salaryMax,
        experience: jobMeta.experience,
        techTags: jobMeta.techTags,
        contact: jobMeta.contact,
      })
      .from(topics)
      .innerJoin(jobMeta, eq(jobMeta.topicId, topics.id))
      .where(where)
      .orderBy(desc(topics.createAt))
      .limit(params.limit)
      .offset(params.offset);
    return listQuery;
  },

  async countWithFilters(params: {
    location?: string;
    remote?: string;
    salaryMin?: number;
    tags?: string[];
  }) {
    const db = getDb();
    const conditions: any[] = [
      eq(topics.tab, "job"),
      boolEq(topics.deleted, false),
      sql`coalesce(${topics.status}, 'published') <> 'deleted'`,
      sql`${jobMeta.topicId} = ${topics.id}`,
    ];
    if (params.location) conditions.push(eq(jobMeta.location, params.location));
    if (params.remote) conditions.push(eq(jobMeta.remote, params.remote));
    if (params.salaryMin) conditions.push(sql`${jobMeta.salaryMax} >= ${params.salaryMin}`);
    if (params.tags && params.tags.length > 0) {
      conditions.push(sql`${jobMeta.techTags} && ${sql.raw(`ARRAY[${params.tags.map((t) => `'${t.replace(/'/g, "''")}'`).join(",")}]::text[]`)}`);
    }
    const where = and(...conditions);
    const result = await db
      .select({ c: count() })
      .from(topics)
      .innerJoin(jobMeta, eq(jobMeta.topicId, topics.id))
      .where(where);
    return Number(result[0]?.c || 0);
  },

  async facetLocations(): Promise<string[]> {
    const db = getDb();
    const result = await db
      .selectDistinct({ location: jobMeta.location })
      .from(jobMeta)
      .innerJoin(topics, eq(jobMeta.topicId, topics.id))
      .where(and(eq(topics.tab, "job"), boolEq(topics.deleted, false)));
    return result.map((r: any) => r.location).filter(Boolean);
  },
};

export const tabQueries = {
  async listAll() {
    const db = getDb();
    return db.select().from(tabs).orderBy(tabs.sortOrder);
  },

  async listVisible() {
    const db = getDb();
    return db
      .select()
      .from(tabs)
      .where(boolEq(tabs.visible, true))
      .orderBy(tabs.sortOrder);
  },

  async updateById(id: number, data: { label?: string; visible?: boolean; sortOrder?: number }) {
    const db = getDb();
    const update: any = { updateAt: new Date() };
    if (data.label !== undefined) update.label = data.label;
    if (data.visible !== undefined) update.visible = boolValue(data.visible);
    if (data.sortOrder !== undefined) update.sortOrder = data.sortOrder;
    await db.update(tabs).set(update).where(eq(tabs.id, id));
    const result = await db.select().from(tabs).where(eq(tabs.id, id)).limit(1);
    return result[0] || null;
  },
};

export const zoneQueries = {
  async listAll() {
    const db = getDb();
    return db.select().from(zones).orderBy(zones.sortOrder);
  },

  async listVisible() {
    const db = getDb();
    return db.select().from(zones).where(boolEq(zones.visible, true)).orderBy(zones.sortOrder);
  },

  async updateById(id: number, data: { name?: string; description?: string; icon?: string; visible?: boolean; sortOrder?: number }) {
    const db = getDb();
    const update: any = { updateAt: new Date() };
    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) update.description = data.description;
    if (data.icon !== undefined) update.icon = data.icon;
    if (data.visible !== undefined) update.visible = boolValue(data.visible);
    if (data.sortOrder !== undefined) update.sortOrder = data.sortOrder;
    await db.update(zones).set(update).where(eq(zones.id, id));
    const result = await db.select().from(zones).where(eq(zones.id, id)).limit(1);
    return result[0] || null;
  },
};
