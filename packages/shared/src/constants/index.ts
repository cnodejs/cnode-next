export const TABS = [
  ["share", "分享"],
  ["ask", "问答"],
  ["job", "招聘"],
] as const;

export const SCORES = {
  CREATE_TOPIC: 5,
  CREATE_REPLY: 5,
  DELETE_TOPIC: -5,
  DELETE_REPLY: -5,
} as const;

export const RATE_LIMITS = {
  CREATE_TOPIC_PER_DAY: 1000,
  CREATE_REPLY_PER_DAY: 1000,
  CREATE_USER_PER_IP: 1000,
} as const;

export const NEW_USER_LIMITS = {
  MIN_HOURS_BEFORE_POST: 24,
  MIN_REPLIES_BEFORE_POST: 3,
  MIN_SCORE_BEFORE_POST: 15,
} as const;

export const CONTENT_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  MUTED: "muted",
  DELETED: "deleted",
} as const;

export const MESSAGE_TYPES = {
  REPLY: "reply",
  REPLY2: "reply2",
  AT: "at",
} as const;
