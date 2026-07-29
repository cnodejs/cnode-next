import { z } from "zod";

export const zoneSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  visible: z.boolean(),
  sort_order: z.number(),
});

export type Zone = z.infer<typeof zoneSchema>;
