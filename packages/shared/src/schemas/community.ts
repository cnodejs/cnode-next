import { z } from "zod";
import { authorSchema, topicDTOSchema } from "./topic";

export const sidebarHomeResponseSchema = z.object({
  latest_replies: z.array(
    z.object({
      id: z.string(),
      topic_id: z.string(),
      topic_title: z.string(),
      author: authorSchema,
      create_at: z.string(),
      excerpt: z.string(),
    }),
  ),
  no_reply_topics: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      tab: z.string(),
      create_at: z.string(),
    }),
  ),
  top_users: z.array(
    z.object({
      id: z.string(),
      loginname: z.string(),
      avatar_url: z.string(),
      score: z.number(),
    }),
  ),
  partners: z.array(
    z.object({
      name: z.string(),
      url: z.string(),
      description: z.string(),
    }),
  ),
  resources: z.array(
    z.object({
      name: z.string(),
      url: z.string(),
    }),
  ),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  engine: z.string().optional(),
});

export const searchResultSchema = z.array(topicDTOSchema);
