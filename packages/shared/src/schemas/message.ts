import { z } from "zod";
import { authorSchema } from "./topic";

export const messageDTOSchema = z.object({
  id: z.string(),
  type: z.enum(["reply", "reply2", "at"]),
  has_read: z.boolean(),
  create_at: z.string(),
  author: authorSchema,
  topic: z.object({
    id: z.string(),
    author: authorSchema,
    title: z.string(),
    last_reply_at: z.string().nullable(),
  }),
  reply: z.object({
    id: z.string(),
    content: z.string(),
    ups: z.array(z.string()),
    create_at: z.string(),
  }),
});

export const markAllBodySchema = z.object({
  accesstoken: z.string().optional(),
});

export const markOneBodySchema = z.object({
  accesstoken: z.string().optional(),
});

export const msgIdParamSchema = z.object({
  msg_id: z.string(),
});

export type MessageDTO = z.infer<typeof messageDTOSchema>;
