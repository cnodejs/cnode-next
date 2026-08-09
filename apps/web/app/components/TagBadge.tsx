import { useRouteLoaderData } from "react-router";
import { getTabLabel } from "~/lib/brand";
import { Badge } from "./ui/badge";

export function TagBadge({ tab }: { tab: string }) {
  const rootData = useRouteLoaderData("root") as
    | { tabs?: Array<{ key: string; label: string }> }
    | undefined;
  const label = getTabLabel(tab, rootData?.tabs);
  if (!label) return null;
  return <Badge variant="secondary">{label}</Badge>;
}

export function StatusBadge({ type }: { type: "top" | "good" | "lock" | "muted" | "archived" }) {
  const config = {
    top: { label: "置顶", variant: "outline" as const },
    good: { label: "精华", variant: "default" as const },
    lock: { label: "锁定", variant: "secondary" as const },
    muted: { label: "已隐藏", variant: "destructive" as const },
    archived: { label: "已归档", variant: "secondary" as const },
  };
  const c = config[type];
  return <Badge variant={c.variant}>{c.label}</Badge>;
}
