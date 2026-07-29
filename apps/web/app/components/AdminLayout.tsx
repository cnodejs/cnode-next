import { Link, useLocation } from "react-router";
import {
  BadgeAlert,
  Ban,
  FileText,
  Flag,
  LayoutDashboard,
  LayoutGrid,
  ScrollText,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { HeaderUserArea } from "./Layout";
import { useNavTransition } from "./NavProgress";
import { Button } from "./ui/button";
import { cn } from "~/lib/utils";
import { CNodeLogo } from "./CNodeLogo";
import { CommandPalette } from "./CommandPalette";
import { PageContainer } from "./PageShell";
import { useState } from "react";

const NAV_GROUPS = [
  {
    label: "总览",
    items: [{ href: "/admin", icon: LayoutDashboard, label: "概览" }],
  },
  {
    label: "内容",
    items: [
      { href: "/admin/topics", icon: FileText, label: "话题管理" },
      { href: "/admin/moderation", icon: Search, label: "巡检结果" },
      { href: "/admin/reports", icon: Flag, label: "举报队列" },
      { href: "/admin/keywords", icon: BadgeAlert, label: "敏感词" },
    ],
  },
  {
    label: "用户",
    items: [
      { href: "/admin/users", icon: Users, label: "用户管理" },
      { href: "/admin/bans", icon: Ban, label: "封禁管理" },
    ],
  },
  {
    label: "系统",
    items: [
      { href: "/admin/audit", icon: ScrollText, label: "审计日志" },
      { href: "/admin/settings", icon: Settings, label: "系统设置" },
      { href: "/admin/zones", icon: LayoutGrid, label: "专区管理" },
      { href: "/admin/tabs", icon: LayoutGrid, label: "Tab 管理" },
    ],
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const isNavigating = useNavTransition();

  return (
    <div className="min-h-screen bg-surface-subtle text-foreground dark:bg-background">
      <header className="sticky top-0 z-40 border-b border-cnode-ink/10 bg-background/90 backdrop-blur-xl">
        <PageContainer className="flex h-16 max-w-screen-2xl items-center justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <CNodeLogo admin />
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden h-9 w-[260px] items-center gap-2 rounded-xl border border-input bg-card px-3 text-sm text-muted-foreground shadow-sm transition-colors hover:border-cnode-green/40 hover:bg-accent hover:text-accent-foreground lg:inline-flex"
              aria-label="搜索后台内容"
            >
              <Search className="h-4 w-4" />
              <span className="min-w-0 flex-1 truncate text-left">搜索后台内容...</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </button>
            <nav className="hidden md:flex items-center gap-1 text-sm">
              <AdminTopLink to="/admin">概览</AdminTopLink>
              <AdminTopLink
                to="/admin/topics"
                match={["/admin/topics", "/admin/moderation", "/admin/reports", "/admin/keywords"]}
              >
                内容
              </AdminTopLink>
              <AdminTopLink to="/admin/users" match={["/admin/users", "/admin/bans"]}>
                用户
              </AdminTopLink>
              <AdminTopLink to="/admin/settings" match={["/admin/audit", "/admin/settings"]}>
                系统
              </AdminTopLink>
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setCommandOpen(true)}
              aria-label="搜索后台"
            >
              <Search className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            <HeaderUserArea />
          </div>
        </PageContainer>
        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      </header>

      <PageContainer className="max-w-screen-2xl py-6">
        <AdminMobileNav />
        <div className="grid min-w-0 gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden md:block">
            <AdminSideNav />
          </aside>
          <main className={cn("min-h-[calc(100vh-8rem)] min-w-0 pb-8 transition-opacity duration-200", isNavigating ? "opacity-60" : "opacity-100")}>{children}</main>
        </div>
      </PageContainer>
    </div>
  );
}

function AdminTopLink({
  to,
  match,
  children,
}: {
  to: string;
  match?: string[];
  children: React.ReactNode;
}) {
  const { pathname } = useLocation();
  const active = match
    ? match.some((path) => pathname === path || pathname.startsWith(`${path}/`))
    : pathname === to;
  return (
    <Link
      to={to}
      className={cn(
        "box-border inline-flex h-9 items-center rounded-lg px-3 leading-none text-muted-foreground transition-colors hover:bg-cnode-soft hover:text-cnode-ink",
        active && "bg-cnode-ink text-white hover:bg-cnode-ink hover:text-white",
      )}
    >
      {children}
    </Link>
  );
}

function AdminSideNav() {
  return (
    <nav className="sticky top-24 rounded-2xl border border-cnode-ink/10 bg-card p-3 text-sm shadow-card">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="space-y-1 [&+&]:mt-4">
          <div className="box-border flex h-6 items-center px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {group.label}
          </div>
          {group.items.map((item) => (
            <AdminNavItem key={item.href} {...item} />
          ))}
        </div>
      ))}
    </nav>
  );
}

function AdminMobileNav() {
  return (
    <nav className="-mx-4 mb-4 flex gap-2 overflow-x-auto border-b border-border px-4 pb-3 md:hidden">
      {NAV_GROUPS.flatMap((group) => group.items).map((item) => (
        <AdminNavItem key={item.href} {...item} compact />
      ))}
    </nav>
  );
}

function AdminNavItem({
  href,
  icon: Icon,
  label,
  compact = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  compact?: boolean;
}) {
  const { pathname } = useLocation();
  const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
  return (
    <Link
      to={href}
      className={cn(
        "box-border flex items-center whitespace-nowrap rounded-xl text-muted-foreground transition-colors hover:bg-cnode-soft hover:text-cnode-ink",
        compact ? "h-9 shrink-0 gap-2 px-3 text-sm" : "h-10 gap-2 px-3 leading-none",
        active && "bg-cnode-ink text-white hover:bg-cnode-ink hover:text-white",
      )}
    >
      <span className="grid h-5 w-5 shrink-0 place-items-center">
        <Icon className="h-4 w-4" />
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
