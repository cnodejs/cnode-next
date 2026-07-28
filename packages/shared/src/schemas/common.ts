import { z } from "zod";

export const successEnvelopeSchema = z.object({
  success: z.literal(true),
});

export const errorEnvelopeSchema = z.object({
  success: z.literal(false),
  error_msg: z.string().optional(),
  message: z.string().optional(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const mdrenderQuerySchema = z.object({
  mdrender: z.coerce.boolean().default(true),
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error_msg: z.string().optional(),
  message: z.string().optional(),
});

export function withErrorResponse(status: number, description: string) {
  return {
    [status]: {
      description,
      content: { "application/json": { schema: errorResponseSchema } },
    },
  } as const;
}

export const topicListQuerySchema = paginationQuerySchema.extend({
  tab: z.string().optional().default("all"),
});
