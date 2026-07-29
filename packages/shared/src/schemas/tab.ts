import { z } from "zod";

export const tabSchema = z.object({
  id: z.number(),
  key: z.string(),
  label: z.string(),
  visible: z.boolean(),
  sort_order: z.number(),
  scope: z.enum(["public", "admin"]).default("public"),
});

export type Tab = z.infer<typeof tabSchema>;
