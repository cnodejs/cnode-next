import { z } from "zod";

export const createReportBodySchema = z.object({
  targetType: z.enum(["topic", "reply"]),
  targetId: z.coerce.number().int().positive(),
  type: z.string().trim().max(50).default("other"),
  description: z.string().trim().max(1000).optional(),
});

export const reportIdParamSchema = z.object({
  id: z.string(),
});

export const reportActionParamSchema = z.object({
  id: z.string(),
  action: z.string(),
});

export const topicActionParamSchema = z.object({
  action: z.string(),
});

export const adminTopicIdParamSchema = z.object({
  tid: z.string(),
});

export const nameParamSchema = z.object({
  name: z.string(),
});

export const keywordIdParamSchema = z.object({
  id: z.string(),
});

export const jobIdParamSchema = z.object({
  id: z.string(),
});

export const jobActionParamSchema = z.object({
  id: z.string(),
  action: z.string(),
});

export const moderationIdActionParamSchema = z.object({
  id: z.string(),
  action: z.string(),
});

export const ipBanIdParamSchema = z.object({
  id: z.string(),
});

export const keywordBodySchema = z.object({
  word: z.string().min(1).max(100),
  category: z.string().max(50).optional(),
});

export const keywordBulkBodySchema = z.object({
  words: z.array(z.string().min(1).max(100)),
  category: z.string().max(50).optional(),
});

export const ipBanBodySchema = z.object({
  ip: z.string().min(1),
  reason: z.string().max(500).optional(),
  source: z.string().max(50).optional(),
});

export const adminPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const adminTopicsQuerySchema = adminPaginationQuerySchema.extend({
  tab: z.string().optional(),
  status: z.string().optional(),
});

export const adminUsersQuerySchema = adminPaginationQuerySchema.extend({
  search: z.string().optional(),
});

export const adminAuditQuerySchema = adminPaginationQuerySchema.extend({
  action: z.string().optional(),
  targetType: z.string().optional(),
});

export const adminSettingsBodySchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

export const adminSettingsQuerySchema = z.object({
  key: z.string().optional(),
});
