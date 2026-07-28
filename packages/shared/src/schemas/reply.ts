import { z } from "zod";

export const createReplyBodySchema = z.object({
  accesstoken: z.string().optional(),
  content: z.string().min(1),
  reply_id: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export const editReplyBodySchema = z.object({
  accesstoken: z.string().optional(),
  content: z.string().min(1),
});

export const deleteReplyBodySchema = z.object({
  accesstoken: z.string().optional(),
});

export const upsBodySchema = z.object({
  accesstoken: z.string().optional(),
});

export const replyIdParamSchema = z.object({
  reply_id: z.string(),
});

export const replyDTOSchema = z.object({
  id: z.string(),
  topic_id: z.string(),
  content: z.string(),
  create_at: z.string(),
  update_at: z.string().nullable(),
});

export type ReplyDTO = z.infer<typeof replyDTOSchema>;
