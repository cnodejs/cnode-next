import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import {
  Search,
  Pencil,
  Bell,
  Menu,
  Info,
  HelpCircle,
  Code,
  Shield,
  User,
  Settings,
  LogOut,
  Rss,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useAuthStore } from "~/lib/stores";
import { useRouteLoaderData } from "react-router";
import { apiFetch } from "~/lib/api-client";
import { getAvatarFallback, getAvatarUrl } from "~/lib/brand";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { CNodeLogo } from "./CNodeLogo";
import { CommandPalette } from "./CommandPalette";
import { PageContainer } from "./PageShell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <PageContainer className="py-6">{children}</PageContainer>
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <PageContainer className="flex h-16 items-center justify-between">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <CNodeLogo />
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="hidden h-9 w-[280px] items-center gap-2 rounded-xl border border-input bg-card px-3 text-sm text-muted-foreground shadow-sm transition-colors hover:border-cnode-green/40 hover:bg-accent hover:text-accent-foreground md:inline-flex lg:w-[340px]"
            aria-label="搜索话题和用户"
          >
            <Search className="h-4 w-4" />
            <span className="min-w-0 flex-1 truncate text-left">搜索话题、用户...</span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <nav className="hidden items-center gap-1 text-sm lg:flex">
            <NavLink to="/getstart">
              <HelpCircle className="h-4 w-4" />
              入门
            </NavLink>
            <NavLink to="/api">
              <Code className="h-4 w-4" />
              API
            </NavLink>
            <NavLink to="/about">
              <Info className="h-4 w-4" />
              关于
            </NavLink>
          </nav>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setCommandOpen(true)}
            aria-label="搜索"
          >
            <Search className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          <Button asChild size="sm" className="hidden h-9 px-3 sm:inline-flex">
            <Link to="/topic/create">
              <Pencil className="h-4 w-4" />
              发布话题
            </Link>
          </Button>
          <HeaderUserArea />
          <MobileNavTrigger />
        </div>
      </PageContainer>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={
        active
          ? "inline-flex h-9 items-center gap-1 rounded-lg bg-accent px-3 text-accent-foreground"
          : "inline-flex h-9 items-center gap-1 rounded-lg px-3 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      }
    >
      {children}
    </Link>
  );
}

export function HeaderUserArea() {
  const user = useAuthStore((s) => s.user);
  const unreadCount = useAuthStore((s) => s.unreadCount);
  const clear = useAuthStore((s) => s.clear);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const rootData = useRouteLoaderData("root") as { user: any } | undefined;
  const ssrUser = rootData?.user;
  const effectiveUser = user || ssrUser;

  if (!mounted && ssrUser === undefined) return null;
  if (!effectiveUser) {
    return (
      <Link
        to="/signin"
        className="inline-flex h-9 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        登录
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
      >
        <Link to="/my/messages" aria-label="消息">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full p-0"
            aria-label="用户菜单"
          >
            <Avatar className="h-7 w-7 ring-1 ring-cnode-green/30">
              <AvatarImage
                src={getAvatarUrl(effectiveUser.avatar_url, 32)}
                alt={effectiveUser.loginname}
              />
              <AvatarFallback>{getAvatarFallback(effectiveUser.loginname)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel className="flex items-center gap-2 px-2 py-2 font-normal">
            <Avatar className="h-8 w-8 ring-1 ring-cnode-green/30">
              <AvatarImage
                src={getAvatarUrl(effectiveUser.avatar_url, 32)}
                alt={effectiveUser.loginname}
              />
              <AvatarFallback>{getAvatarFallback(effectiveUser.loginname)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">
                {effectiveUser.loginname}
              </div>
              <div className="text-xs text-muted-foreground">已登录</div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link to={`/user/${effectiveUser.loginname}`}>
                <User />
                我的主页
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/setting">
                <Settings />
                设置
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          {(effectiveUser.is_admin || effectiveUser.is_mod) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link to="/admin">
                    <Shield />
                    管理后台
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              await apiFetch("/api/v1/auth/signout", { method: "POST" });
              clear();
              window.location.href = "/";
            }}
            className="text-destructive focus:text-destructive"
          >
            <LogOut />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function MobileNavTrigger() {
  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="打开导航">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="pb-[env(safe-area-inset-bottom)]">
          <SheetHeader>
            <SheetTitle>导航</SheetTitle>
          </SheetHeader>
          <nav className="grid grid-cols-4 gap-2 py-2">
            <Link
              to="/getstart"
              className="flex flex-col items-center gap-1 rounded-lg p-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <HelpCircle className="h-5 w-5" /> 入门
            </Link>
            <Link
              to="/topic/create"
              className="flex flex-col items-center text-xs text-muted-foreground"
            >
              <Pencil className="h-5 w-5" /> 发帖
            </Link>
            <Link
              to="/my/messages"
              className="flex flex-col items-center text-xs text-muted-foreground"
            >
              <Bell className="h-5 w-5" /> 消息
            </Link>
            <Link
              to="/about"
              className="flex flex-col items-center gap-1 rounded-lg p-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Info className="h-5 w-5" /> 关于
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-background">
      <PageContainer className="py-10">
        <div className="overflow-hidden rounded-3xl border border-cnode-green/20 bg-card shadow-card">
          <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(520px,1fr)]">
            <section className="relative bg-cnode-ink p-8 text-white sm:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(128,189,1,0.26),transparent_32%),radial-gradient(circle_at_88%_78%,rgba(128,189,1,0.14),transparent_34%)]" />
              <div className="relative max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-white/70">
                  <span className="h-2 w-2 rounded-full bg-cnode-green" />
                  Node.js 中文技术社区
                </div>
                <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">CNode Next</h2>
                <p className="mt-4 text-sm leading-6 text-white/70">
                  连接中文 Node.js 开发者，沉淀问题解法、项目实践、招聘机会和生态资源。
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild variant="inverse" size="sm">
                    <Link to="/topic/create">发布话题</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="border-white/20 bg-white/8 text-white hover:bg-white/12 hover:text-white"
                  >
                    <Link to="/getstart">新手指南</Link>
                  </Button>
                </div>
              </div>
            </section>
            <section className="grid divide-y divide-border bg-surface-subtle sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <FooterGroup
                title="社区"
                links={[
                  ["新手指南", "/getstart"],
                  ["FAQ", "/faq"],
                  ["关于", "/about"],
                  ["发布话题", "/topic/create"],
                ]}
              />
              <FooterGroup
                title="资源"
                links={[
                  ["API", "/api"],
                  ["搜索", "/search"],
                  ["RSS", "/rss"],
                ]}
              />
              <div className="p-6 sm:p-8">
                <h3 className="text-sm font-semibold text-foreground">开发者</h3>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <a
                    className="flex items-center gap-2 hover:text-primary"
                    href="https://github.com/cnodejs/nodeclub"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Code className="h-4 w-4" />
                    GitHub
                  </a>
                  <a className="flex items-center gap-2 hover:text-primary" href="/rss">
                    <Rss className="h-4 w-4" />
                    RSS 订阅
                  </a>
                  <Link className="flex items-center gap-2 hover:text-primary" to="/about">
                    <Info className="h-4 w-4" />
                    社区介绍
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </PageContainer>
      <div className="border-t border-border/80">
        <PageContainer className="flex flex-col gap-2 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CNode Next. Node.js 中文技术社区。</p>
          <p>
            Inspired by CNode 社区，内容版权归原作者所有。
          </p>
        </PageContainer>
      </div>
    </footer>
  );
}

function FooterGroup({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div className="p-6 sm:p-8">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link to={href} className="hover:text-primary">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
