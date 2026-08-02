import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useRouteLoaderData } from "react-router";
import {
  FileText,
  Info,
  LayoutDashboard,
  MessageSquare,
  Pencil,
  Search,
  User,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

const quickActions = [
  { label: "发布话题", to: "/topic/create", icon: Pencil },
  { label: "我的消息", to: "/my/messages", icon: MessageSquare },
  { label: "API", to: "/api", icon: FileText },
  { label: "关于 CNode", to: "/about", icon: Info },
  { label: "管理后台", to: "/admin", icon: LayoutDashboard, adminOnly: true },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const rootData = useRouteLoaderData("root") as { user?: { is_admin?: boolean; is_mod?: boolean } } | undefined;
  const canAccessAdmin = !!(rootData?.user?.is_admin || rootData?.user?.is_mod);
  const actions = useMemo(
    () =>
      quickActions.filter(
        (item) =>
          (!item.adminOnly || canAccessAdmin) &&
          item.label.toLowerCase().includes(query.toLowerCase()),
      ),
    [canAccessAdmin, query],
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onOpenChange]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    onOpenChange(false);
    navigate(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="top-24 translate-y-0 gap-3 overflow-hidden border-cnode-green/20 bg-popover p-0 shadow-floating sm:max-w-2xl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>搜索和快速操作</DialogTitle>
          <DialogDescription>搜索话题、用户，或跳转到常用页面。</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="border-b border-border p-3 pr-14">
          <div className="flex h-11 items-center gap-2 rounded-xl border border-input bg-background px-3 shadow-inner">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索话题、用户，或输入关键词..."
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              autoFocus
            />
            <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
              Enter
            </kbd>
          </div>
        </form>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 inline-flex h-11 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="关闭搜索面板"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="grid gap-1 p-2">
          {actions.map(({ label, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          <Button
            type="button"
            variant="ghost"
            className="justify-start gap-3 px-3 text-muted-foreground"
            onClick={submit}
            disabled={!query.trim()}
          >
            <User className="h-4 w-4" /> 搜索 “{query || "关键词"}”
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
