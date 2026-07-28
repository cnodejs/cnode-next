import { z } from "zod";

export const authorSchema = z.object({
  loginname: z.string(),
  avatar_url: z.string(),
});

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

export const createTopicBodySchema = z.object({
  accesstoken: z.string().optional(),
  title: z.string().min(5).max(100),
  tab: z.enum(["share", "ask", "job"]),
  content: z.string().min(1),
  turnstileToken: z.string().optional(),
});

export const updateTopicBodySchema = z.object({
  accesstoken: z.string().optional(),
  topic_id: z.string().min(1),
  title: z.string().min(5).max(100),
  tab: z.enum(["share", "ask", "job"]),
  content: z.string().min(1),
});

export const topicIdParamSchema = z.object({
  topic_id: z.string(),
});

export type TopicDTO = z.infer<typeof topicDTOSchema>;
export type FullTopicDTO = z.infer<typeof fullTopicSchema>;
export type TopicReplyDTO = z.infer<typeof topicReplyDTOSchema>;
export type AuthorDTO = z.infer<typeof authorSchema>;
