import { z } from "zod";

export const userRoleSchema = z.enum(["moderator", "recruiter"]);

export const roleAssignmentSchema = z.object({
  role: userRoleSchema,
  reason: z.string().max(500).optional(),
});

export const userRoleDTOSchema = z.object({
  role: userRoleSchema,
  reason: z.string().nullable().optional(),
  granted_by: z.number().nullable().optional(),
  create_at: z.string().nullable().optional(),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type RoleAssignment = z.infer<typeof roleAssignmentSchema>;
export type UserRoleDTO = z.infer<typeof userRoleDTOSchema>;
