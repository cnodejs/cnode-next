import { z } from "zod";

export const signinBodySchema = z.object({
  name: z.string().min(1),
  pass: z.string().min(1),
});

export const signupBodySchema = z.object({
  loginname: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-zA-Z0-9\-_]+$/),
  pass: z
    .string()
    .min(8)
    .regex(/[a-zA-Z]/, "密码必须包含字母")
    .regex(/[0-9]/, "密码必须包含数字"),
  email: z.string().email(),
  turnstileToken: z.string().optional(),
});

export const authErrorCodeSchema = z.enum([
  "account_created_email_failed",
  "account_inactive",
  "activation_email_failed",
  "password_reset_email_failed",
]);

export const resendActivationBodySchema = z.object({
  name: z.string().trim().min(1),
  pass: z.string().min(1),
  turnstileToken: z.string().optional(),
});

export const searchPassBodySchema = z.object({
  email: z.string().email(),
  turnstileToken: z.string().optional(),
});

export const resetPassBodySchema = z.object({
  key: z.string().min(1),
  psw: z
    .string()
    .min(8)
    .regex(/[a-zA-Z]/)
    .regex(/[0-9]/),
});

export const githubCreateBodySchema = z.object({
  isnew: z.boolean().optional(),
  name: z.string().optional(),
  pass: z.string().optional(),
});

export const githubUnbindSchema = z
  .object({
    password: z.string().min(1, "请输入当前密码"),
  })
  .strict();

export type GithubUnbindInput = z.infer<typeof githubUnbindSchema>;
export type AuthErrorCode = z.infer<typeof authErrorCodeSchema>;
export type ResendActivationInput = z.infer<typeof resendActivationBodySchema>;
