import { getDefaultTopicTabLabel } from "./topic-tab-presentation";

export const CNODE_LOGO_LIGHT = "/cnodejs_light.svg";
export const CNODE_LOGO_DARK = "/cnodejs.svg";

export function getAvatarUrl(value?: string | null, size = 48) {
  if (!value) return "";
  if (value.startsWith("//")) return `https:${value}`;
  if (/^http:\/\/(?:www\.)?gravatar\.com\//i.test(value)) {
    return value.replace(/^http:\/\//i, "https://");
  }
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return value;
  return `https://gravatar.com/avatar/${encodeURIComponent(value)}?size=${size}`;
}

export function getAvatarFallback(name?: string | null) {
  const value = (name || "CNode").trim();
  return value.slice(0, 1).toUpperCase();
}

export function getTabLabel(
  tab?: string | null,
  tabs?: Array<{ key: string; label: string }>,
): string {
  if (tabs && tab) {
    const found = tabs.find((t) => t.key === tab);
    if (found) return found.label;
  }
  return getDefaultTopicTabLabel(tab);
}
