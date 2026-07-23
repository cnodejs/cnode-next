// @mention parsing — port from nodeclub common/at.js

const IGNORE_REGEXES = [
  /```[\s\S]+?```/g, // code blocks
  /`[\s\S]+?`/g, // inline code
  /^ {4}.*/gm, // 4-space pre
  /\b\S*?@[^\s]*?\..+?\b/g, // email
  /\[@.+?\]\(\/.+?\)/g, // already linked @user
  /\/@/g, // url path
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
