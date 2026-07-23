export interface TopicDTO {
  id: string;
  author_id: string;
  tab: string;
  content: string;
  title: string;
  last_reply_at: string;
  good: boolean;
  top: boolean;
  reply_count: number;
  visit_count: number;
  create_at: string;
  author: { loginname: string; avatar_url: string };
}

export interface UserDTO {
  loginname: string;
  avatar_url: string;
  githubUsername?: string;
  create_at: string;
  score: number;
  recent_topics: TopicDTO[];
  recent_replies: TopicDTO[];
}

export interface MessageDTO {
  id: string;
  type: "reply" | "reply2" | "at";
  has_read: boolean;
  create_at: string;
  author: { loginname: string; avatar_url: string };
  topic: {
    id: string;
    author: { loginname: string; avatar_url: string };
    title: string;
    last_reply_at: string;
  };
  reply: { id: string; content: string; ups: string[]; create_at: string };
}
