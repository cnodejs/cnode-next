export const CNODE_LOGO_LIGHT = "https://static2.cnodejs.org/public/images/cnodejs_light.svg";
export const CNODE_LOGO_DARK = "https://static2.cnodejs.org/public/images/cnodejs.svg";

export function getAvatarUrl(value?: string | null, size = 48) {
  if (!value) return "";
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return value;
  return `https://gravatar.com/avatar/${encodeURIComponent(value)}?size=${size}`;
}

export function getAvatarFallback(name?: string | null) {
  const value = (name || "CNode").trim();
  return value.slice(0, 1).toUpperCase();
}

export function getTabLabel(tab?: string | null) {
  const tabs: Record<string, string> = {
    all: "全部",
    share: "分享",
    ask: "问答",
    job: "招聘",
    good: "精华",
  };
  return tabs[tab || ""] || tab || "社区";
}
