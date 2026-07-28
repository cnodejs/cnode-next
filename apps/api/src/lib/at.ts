import { userQueries } from "./db";
import { sendAtMessage } from "./message";

const IGNORE_REGEXES = [
  /```[\s\S]+?```/g,
  /`[\s\S]+?`/g,
  /^ {4}.*/gm,
  /\b\S*?@[^\s]*?\..+?\b/g,
  /\[@.+?\]\(\/.+?\)/g,
  /\/@/g,
];

export function fetchUsers(text: string): string[] {
  if (!text) return [];
  let cleaned = text;
  for (const re of IGNORE_REGEXES) {
    cleaned = cleaned.replace(re, "");
  }
  const results = cleaned.match(/@[a-z0-9\-_]+\b/gim);
  if (!results) return [];
  const names = results.map((s) => s.slice(1));
  return [...new Set(names)];
}

export function linkUsers(text: string): string {
  const users = fetchUsers(text);
  for (const name of users) {
    text = text.replace(
      new RegExp("@" + name + "\\b(?!\\])", "g"),
      "[@" + name + "](/user/" + name + ")",
    );
  }
  return text;
}

export async function sendMessageToMentionUsers(
  text: string,
  topicId: number,
  authorId: number,
  replyId?: number,
  excludedUserIds: number[] = [],
) {
  const names = fetchUsers(text);
  if (names.length === 0) return;

  const usersList = await Promise.all(names.map((n) => userQueries.getByLoginName(n)));
  const validUsers = usersList.filter((u): u is NonNullable<typeof u> => u !== undefined);

  const excluded = new Set([authorId, ...excludedUserIds]);
  const seen = new Set<number>();
  const filtered = validUsers.filter((u) => {
    if (excluded.has(u.id) || seen.has(u.id)) return false;
    seen.add(u.id);
    return true;
  });

  for (const user of filtered) {
    await sendAtMessage(user.id, authorId, topicId, replyId || 0, text);
  }
}
