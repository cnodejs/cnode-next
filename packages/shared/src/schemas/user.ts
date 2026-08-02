import { z } from "zod";
import { authorSchema } from "./topic";

export const publicIdentitySchema = z.enum(["admin", "moderator", "recruiter"]);

export const publicIdentitiesSchema = z
  .array(publicIdentitySchema)
  .refine((identities) => new Set(identities).size === identities.length, {
    message: "identities must be unique",
  });

export const publicUserSchema = z.object({
  id: z.string(),
  loginname: z.string(),
  avatar_url: z.string(),
  githubUsername: z.string(),
  create_at: z.string(),
  score: z.number(),
  topic_count: z.number(),
  reply_count: z.number(),
  is_star: z.boolean(),
});

export const userDetailSchema = z.object({
  loginname: z.string(),
  avatar_url: z.string(),
  githubUsername: z.string(),
  location: z.string().nullable(),
  url: z.string().nullable(),
  signature: z.string().nullable(),
  identities: publicIdentitiesSchema,
  create_at: z.string(),
  score: z.number(),
  topic_count: z.number(),
  reply_count: z.number(),
  collect_topic_count: z.number(),
  is_block: z.boolean(),
  is_muted: z.boolean(),
  recent_topics: z.array(
    z.object({
      id: z.string(),
      author: authorSchema,
      title: z.string(),
      last_reply_at: z.string().nullable(),
    }),
  ),
  recent_replies: z.array(
    z.object({
      id: z.string(),
      author: authorSchema,
      title: z.string(),
      last_reply_at: z.string().nullable(),
    }),
  ),
});

export const loginNameParamSchema = z.object({
  loginname: z.string(),
});

export type PublicUserDTO = z.infer<typeof publicUserSchema>;
export type UserDetailDTO = z.infer<typeof userDetailSchema>;
export type PublicIdentity = z.infer<typeof publicIdentitySchema>;
