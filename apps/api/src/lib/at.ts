import { fetchUsers, linkUsers } from "@cnode/shared";
import { userQueries } from "./db";
import { sendAtMessage } from "./message";

export { fetchUsers, linkUsers };

export async function sendMessageToMentionUsers(
  text: string,
  topicId: number,
  authorId: number,
  replyId?: number,
) {
  const names = fetchUsers(text);
  if (names.length === 0) return;

  const usersList = await Promise.all(names.map((n) => userQueries.getByLoginName(n)));
  const validUsers = usersList.filter((u): u is NonNullable<typeof u> => u !== undefined);

  const filtered = validUsers.filter((u) => u.id !== authorId);

  for (const user of filtered) {
    await sendAtMessage(user.id, authorId, topicId, replyId || 0);
  }
}
