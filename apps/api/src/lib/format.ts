export function normalizeAvatarUrl(value?: string | null) {
  if (!value) return "";
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return value;
  return `https://gravatar.com/avatar/${encodeURIComponent(value)}?size=48`;
}

export function userSummary(user: any) {
  if (!user) return { loginname: "", avatar_url: "" };
  return {
    loginname: user.loginname || "",
    avatar_url: normalizeAvatarUrl(user.avatar),
  };
}

export function excerptMarkdown(value?: string | null, length = 96) {
  const plain = (value || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^\)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^\)]*\)/g, "$1")
    .replace(/[#>*_~\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > length ? `${plain.slice(0, length)}...` : plain;
}
