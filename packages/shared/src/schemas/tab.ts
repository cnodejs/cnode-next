import { z } from "zod";

export const topicTabDefinitions = [
  { key: "share", label: "分享", sortOrder: 10, scope: "public" },
  { key: "ask", label: "问答", sortOrder: 20, scope: "public" },
  { key: "tech", label: "技术", sortOrder: 30, scope: "public" },
  { key: "ai", label: "AI", sortOrder: 40, scope: "public" },
  { key: "ideas", label: "创意", sortOrder: 50, scope: "public" },
  { key: "career", label: "职场", sortOrder: 60, scope: "public" },
  { key: "life", label: "生活", sortOrder: 70, scope: "public" },
  { key: "event", label: "活动", sortOrder: 80, scope: "public" },
  { key: "job", label: "招聘", sortOrder: 90, scope: "public" },
  { key: "dev", label: "开发", sortOrder: 100, scope: "admin" },
  { key: "good", label: "精华", sortOrder: 110, scope: "public" },
] as const;

export const topicTabKeys = topicTabDefinitions.map((tab) => tab.key) as [
  (typeof topicTabDefinitions)[number]["key"],
  ...(typeof topicTabDefinitions)[number]["key"][],
];

export const writableTopicTabKeys = [
  "share",
  "ask",
  "tech",
  "ai",
  "ideas",
  "career",
  "life",
  "event",
  "job",
] as const;

export const topicListTabKeys = ["all", ...topicTabKeys] as const;
export const nonPublicTopicTabKeys = ["dev"] as const;

export const writableTopicTabSchema = z.enum(writableTopicTabKeys);
export const topicListTabSchema = z.enum(topicListTabKeys);

export type TopicTabKey = (typeof topicTabKeys)[number];
export type WritableTopicTabKey = (typeof writableTopicTabKeys)[number];

export const tabSchema = z.object({
  id: z.number(),
  key: z.string(),
  label: z.string(),
  visible: z.boolean(),
  sort_order: z.number(),
  scope: z.enum(["public", "admin"]).default("public"),
});

export type Tab = z.infer<typeof tabSchema>;
