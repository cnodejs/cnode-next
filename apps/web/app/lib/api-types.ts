import type { z } from "zod";
import type {
  topicDTOSchema,
  fullTopicSchema,
  topicReplyDTOSchema,
  replyDTOSchema,
  userDetailSchema,
  publicUserSchema,
  messageDTOSchema,
  sidebarHomeResponseSchema,
  authorSchema,
} from "@cnode/shared";

export type TopicDTO = z.infer<typeof topicDTOSchema>;
export type FullTopicDTO = z.infer<typeof fullTopicSchema>;
export type TopicReplyDTO = z.infer<typeof topicReplyDTOSchema>;
export type ReplyDTO = z.infer<typeof replyDTOSchema>;
export type UserDetailDTO = z.infer<typeof userDetailSchema>;
export type PublicUserDTO = z.infer<typeof publicUserSchema>;
export type MessageDTO = z.infer<typeof messageDTOSchema>;
export type SidebarData = z.infer<typeof sidebarHomeResponseSchema>;
export type AuthorDTO = z.infer<typeof authorSchema>;

export type SuccessResponse<T> = { success: true; data: T };
export type ErrorResponse = { success: false; error_msg?: string; message?: string };
export type PaginatedResponse<T> = { success: true; data: T[]; total: number };
