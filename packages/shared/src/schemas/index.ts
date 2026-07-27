import { z } from "zod";

export const createTopicSchema = z.object({
  accesstoken: z.string().min(1),
  title: z.string().min(5).max(100),
  tab: z.enum(["share", "ask", "job"]),
  content: z.string().min(1),
});

export const updateTopicSchema = z.object({
  accesstoken: z.string().min(1),
  topic_id: z.string().min(1),
  title: z.string().min(5).max(100),
  tab: z.enum(["share", "ask", "job"]),
  content: z.string().min(1),
});

export const createReplySchema = z.object({
  accesstoken: z.string().min(1),
  content: z.string().min(1),
  reply_id: z.string().optional(),
});

export const signupSchema = z.object({
  loginname: z.string().min(1).max(50),
  pass: z
    .string()
    .min(8)
    .regex(/[a-zA-Z]/)
    .regex(/[0-9]/),
  email: z.string().email(),
});

export const signinSchema = z.object({
  name: z.string().min(1),
  pass: z.string().min(1),
});

export const githubUnbindSchema = z
  .object({
    password: z.string().min(1, "请输入当前密码"),
  })
  .strict();

export type GithubUnbindInput = z.infer<typeof githubUnbindSchema>;
