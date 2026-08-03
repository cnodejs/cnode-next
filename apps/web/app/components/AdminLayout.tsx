import { Link, useLocation } from "react-router";
import {
  BadgeAlert,
  Ban,
  FileText,
  Flag,
  LayoutDashboard,
  LayoutGrid,
  Menu,
  ScrollText,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { HeaderUserArea } from "./Layout";
import { useNavTransition } from "./NavProgress";
import { Button, buttonVariants } from "./ui/button";
import { cn } from "~/lib/utils";
import { CNodeLogo } from "./CNodeLogo";
import { CommandPalette } from "./CommandPalette";
import { PageContainer } from "./PageShell";
import { ScrollTopButton } from "./ScrollTopButton";
import { useRef, useState } from "react";
import { useAuthStore } from "~/lib/stores/auth-store";
import { Card, CardContent } from "./ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";

const NAV_GROUPS = [
  {
    label: "总览",
    items: [{ href: "/admin", icon: LayoutDashboard, label: "概览", adminOnly: true }],
  },
  {
    label: "内容",
    items: [
      { href: "/admin/topics", icon: FileText, label: "话题管理" },
      { href: "/admin/moderation", icon: Search, label: "巡检结果" },
      { href: "/admin/reports", icon: Flag, label: "举报队列" },
      { href: "/admin/keywords", icon: BadgeAlert, label: "敏感词", adminOnly: true },
      { href: "/admin/zones", icon: LayoutGrid, label: "专区管理", adminOnly: true },
      { href: "/admin/tabs", icon: LayoutGrid, label: "Tab 管理", adminOnly: true },
    ],
  },
  {
    label: "用户",
    items: [
      { href: "/admin/users", icon: Users, label: "用户管理", adminOnly: true },
      { href: "/admin/bans", icon: Ban, label: "封禁管理", adminOnly: true },
    ],
  },
  {
    label: "审计",
    items: [
      { href: "/admin/audit", icon: ScrollText, label: "审计日志", adminOnly: true },
    ],
  },
  {
    label: "系统",
    items: [
      { href: "/admin/settings", icon: Settings, label: "系统设置", adminOnly: true },
    ],
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const commandFinalFocusRef = useRef<HTMLElement | null>(null);
  const isNavigating = useNavTransition();
  const isAdmin = !!useAuthStore((s) => s.user?.is_admin);

  return (
    <div data-admin-shell className="min-h-screen bg-muted/30 text-foreground">
      <a
        href="#main-content"
        onClick={() => document.getElementById("main-content")?.focus()}
        className="fixed left-4 top-4 z-[100] -translate-y-20 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-0 shadow-lg transition-[transform,opacity] focus:translate-y-0 focus:opacity-100"
      >
        跳到主要内容
      </a>
      <header className="sticky top-0 z-40 bg-background/90 shadow-sm backdrop-blur-xl">
        <PageContainer className="flex h-16 max-w-screen-2xl items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="打开后台导航" />}>
                  <Menu />
                </SheetTrigger>
                <SheetContent side="left" className="w-72 max-w-[calc(100%-2rem)]">
                  <SheetHeader>
                    <SheetTitle>后台导航</SheetTitle>
                  </SheetHeader>
                  <AdminNavigation isAdmin={isAdmin} />
                </SheetContent>
              </Sheet>
            </div>
            <CNodeLogo admin />
            <Button
                type="button"
                variant="secondary"
                className="hidden w-64 justify-start lg:inline-flex"
                onClick={(event) => {
                  commandFinalFocusRef.current = event.currentTarget;
                  setCommandOpen(true);
                }}
                aria-label="搜索后台内容"
              >
                <Search />
                <span className="min-w-0 flex-1 truncate text-left">搜索后台内容...</span>
                <kbd className="text-xs text-muted-foreground">⌘K</kbd>
              </Button>
            <AdminTopNavigation isAdmin={isAdmin} />
          </div>

          <div className="flex items-center gap-2 md:gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={(event) => {
                  commandFinalFocusRef.current = event.currentTarget;
                  setCommandOpen(true);
                }}
                aria-label="搜索后台"
              >
                <Search />
              </Button>
              <ThemeToggle />
              <HeaderUserArea />
          </div>
        </PageContainer>
        <CommandPalette
          open={commandOpen}
          onOpenChange={setCommandOpen}
          finalFocus={commandFinalFocusRef}
        />
      </header>

      <PageContainer className="max-w-screen-2xl py-4 sm:py-6">
        <div className="grid min-w-0 gap-4 md:grid-cols-[14rem_minmax(0,1fr)] lg:gap-6">
          <aside className="hidden md:block">
            <div className="sticky top-20">
              <Card size="sm">
                <CardContent>
                  <AdminNavigation isAdmin={isAdmin} />
                </CardContent>
              </Card>
            </div>
          </aside>
          <main
            id="main-content"
            tabIndex={-1}
            className={cn(
              "min-h-[calc(100vh-8rem)] min-w-0 pb-6 transition-opacity duration-200",
              isNavigating ? "opacity-60" : "opacity-100",
            )}
          >
            {children}
          </main>
        </div>
      </PageContainer>
      <ScrollTopButton />
    </div>
  );
}

function AdminNavigation({ isAdmin }: { isAdmin: boolean }) {
  const { pathname } = useLocation();

  return (
    <nav aria-label="后台导航" className="flex flex-col gap-4">
      {visibleGroups(isAdmin).map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-2 text-xs font-medium text-muted-foreground">{group.label}</p>
          <div className="flex flex-col gap-1">
              {group.items.map(({ href, icon: Icon, label }) => {
                const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));

                return (
                  <Link
                    key={href}
                    to={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(buttonVariants({ variant: active ? "default" : "ghost", size: "sm" }), "w-full justify-start")}
                  >
                    <Icon data-icon="inline-start" />
                    <span>{label}</span>
                  </Link>
                );
              })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function AdminTopNavigation({ isAdmin }: { isAdmin: boolean }) {
  const { pathname } = useLocation();

  return (
    <nav aria-label="后台分区" className="hidden items-center gap-1 xl:flex">
      {visibleGroups(isAdmin).map((group) => {
        const href = group.items[0].href;
        const active = group.items.some((item) => pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)));
        return (
          <Link
            key={group.label}
            to={href}
            aria-current={active ? "page" : undefined}
            className={buttonVariants({ variant: active ? "default" : "ghost", size: "sm" })}
          >
            {group.label}
          </Link>
        );
      })}
    </nav>
  );
}

function visibleGroups(isAdmin: boolean) {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => isAdmin || !("adminOnly" in item && item.adminOnly)),
  })).filter((group) => group.items.length > 0);
}
