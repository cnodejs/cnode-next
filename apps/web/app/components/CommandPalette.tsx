import { useEffect, useRef, useState, type RefObject } from "react";
import { useNavigate, useRouteLoaderData } from "react-router";
import {
  FileText,
  Info,
  LayoutDashboard,
  MessageSquare,
  Pencil,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

const quickActions = [
  { label: "发布话题", to: "/topic/create", icon: Pencil },
  { label: "我的消息", to: "/my/messages", icon: MessageSquare },
  { label: "API", to: "/api", icon: FileText },
  { label: "关于 CNode", to: "/about", icon: Info },
];

export function CommandPalette({
  open,
  onOpenChange,
  finalFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finalFocus?: RefObject<HTMLElement | null>;
}) {
  const [query, setQuery] = useState("");
  const fallbackFinalFocusRef = useRef<HTMLElement | null>(null);
  const finalFocusRef = finalFocus ?? fallbackFinalFocusRef;
  const navigate = useNavigate();
  const rootData = useRouteLoaderData("root") as { user?: { is_admin?: boolean; is_mod?: boolean } } | undefined;
  const managementAction = rootData?.user?.is_admin
    ? { label: "管理后台", to: "/admin", icon: LayoutDashboard }
    : rootData?.user?.is_mod
      ? { label: "内容管理", to: "/admin/topics", icon: LayoutDashboard }
      : null;
  const actions = managementAction ? [...quickActions, managementAction] : quickActions;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (!open && document.activeElement instanceof HTMLElement) {
          finalFocusRef.current = document.activeElement;
        }
        onOpenChange(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [finalFocusRef, onOpenChange, open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    onOpenChange(false);
    navigate(`/search?q=${encodeURIComponent(value)}`);
  }

  function go(to: string) {
    onOpenChange(false);
    navigate(to);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        finalFocus={finalFocusRef}
        className="top-24 max-h-[calc(100dvh-7rem)] -translate-y-0 gap-3 overflow-hidden p-0 sm:max-w-2xl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>搜索和快速操作</DialogTitle>
          <DialogDescription>搜索话题、用户，或跳转到常用页面。</DialogDescription>
        </DialogHeader>
        <Command label="搜索命令">
          <form onSubmit={submit}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="搜索话题、用户，或输入关键词..."
              aria-label="搜索命令"
              autoFocus
            />
          </form>
          <CommandList>
            <CommandEmpty>
              <span role="status">没有匹配的快捷命令，可按 Enter 搜索“{query}”</span>
            </CommandEmpty>
            <CommandGroup heading="快捷操作">
              {actions.map(({ label, to, icon: Icon }) => (
                <CommandItem key={to} value={label} onSelect={() => go(to)}>
                  <Icon />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <div className="bg-muted p-2 text-xs text-muted-foreground">
            {query.trim() ? `按 Enter 搜索“${query.trim()}”` : "使用方向键选择，Enter 打开，Escape 关闭"}
          </div>
        </Command>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 inline-flex h-11 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="关闭搜索面板"
        >
          <X className="h-4 w-4" />
        </button>
      </DialogContent>
    </Dialog>
  );
}
