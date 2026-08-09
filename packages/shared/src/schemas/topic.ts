import { z } from "zod";
import { writableTopicTabSchema } from "./tab";

export const authorSchema = z.object({
  loginname: z.string(),
  avatar_url: z.string(),
});

export const jobMetaSchema = z.object({
  company: z.string().min(1),
  company_logo: z.string().nullable().optional(),
  position: z.string().min(1),
  location: z.string().min(1),
  remote: z.enum(["on-site", "hybrid", "remote"]),
  salary_min: z.number().nullable().optional(),
  salary_max: z.number().nullable().optional(),
  experience: z.string().nullable().optional(),
  tech_tags: z.array(z.string()).optional(),
  contact: z.string().min(1),
});

export type JobMeta = z.infer<typeof jobMetaSchema>;

export const topicDTOSchema = z.object({
  id: z.string(),
  author_id: z.string(),
  tab: z.string(),
  content: z.string(),
  title: z.string(),
  last_reply_at: z.string().nullable(),
  good: z.boolean(),
  top: z.boolean(),
  reply_count: z.number(),
  visit_count: z.number(),
  create_at: z.string(),
  author: authorSchema,
  job_meta: jobMetaSchema.nullable().optional(),
});

export const topicReplyDTOSchema = z.object({
  id: z.string(),
  author: authorSchema,
  content: z.string(),
  ups: z.array(z.string()),
  create_at: z.string(),
  reply_id: z.string().nullable(),
  reply_to: z
    .object({
      id: z.string(),
      author: authorSchema,
      content_excerpt: z.string(),
      deleted: z.boolean(),
    })
    .nullable(),
  is_uped: z.boolean(),
});

export const fullTopicSchema = topicDTOSchema.extend({
  collect_count: z.number().optional(),
  is_collect: z.boolean(),
  replies: z.array(topicReplyDTOSchema),
});

export const createTopicBodySchema = z
  .object({
    accesstoken: z.string().optional(),
    title: z.string().min(5).max(100),
    tab: writableTopicTabSchema,
    content: z.string().min(1),
    turnstileToken: z.string().optional(),
    job_meta: jobMetaSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tab === "job") {
      if (!data.job_meta) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["job_meta"],
          message: "tab 为 job 时 job_meta 必填",
        });
      }
    } else {
      if (data.job_meta !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["job_meta"],
          message: "tab 非 job 时不应传 job_meta",
        });
      }
    }
  });

export const updateTopicBodySchema = z
  .object({
    accesstoken: z.string().optional(),
    topic_id: z.string().min(1),
    title: z.string().min(5).max(100),
    tab: writableTopicTabSchema,
    content: z.string().min(1),
    job_meta: jobMetaSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tab === "job") {
      if (!data.job_meta) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["job_meta"],
          message: "tab 为 job 时 job_meta 必填",
        });
      }
    } else {
      if (data.job_meta !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["job_meta"],
          message: "tab 非 job 时不应传 job_meta",
        });
      }
    }
  });

export const topicIdParamSchema = z.object({
  topic_id: z.string(),
});

export type TopicDTO = z.infer<typeof topicDTOSchema>;
export type FullTopicDTO = z.infer<typeof fullTopicSchema>;
export type TopicReplyDTO = z.infer<typeof topicReplyDTOSchema>;
export type AuthorDTO = z.infer<typeof authorSchema>;
