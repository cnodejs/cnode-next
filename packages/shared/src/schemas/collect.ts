import { z } from "zod";

export const collectBodySchema = z.object({
  accesstoken: z.string().optional(),
  topic_id: z.string().min(1),
});

export const collectLoginNameParamSchema = z.object({
  loginname: z.string(),
});
