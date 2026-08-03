import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import {
  Search,
  Pencil,
  Bell,
  Menu,
  Info,
  Code,
  Shield,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useNavTransition } from "./NavProgress";
import { useAuthStore } from "~/lib/stores";
import { useRouteLoaderData } from "react-router";
import { apiFetch } from "~/lib/api-client";
import { getAvatarFallback, getAvatarUrl } from "~/lib/brand";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { CNodeLogo } from "./CNodeLogo";
import { CommandPalette } from "./CommandPalette";
import { PageContainer } from "./PageShell";
import { ScrollTopButton } from "./ScrollTopButton";
import { cn } from "~/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";

export function Layout({ children }: { children: React.ReactNode }) {
  const isNavigating = useNavTransition();
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#main-content"
        onClick={() => document.getElementById("main-content")?.focus()}
        className="fixed left-4 top-4 z-[100] -translate-y-20 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-0 shadow-lg transition-[transform,opacity] focus:translate-y-0 focus:opacity-100"
      >
        跳到主要内容
      </a>
      <Header />
      <main id="main-content" tabIndex={-1} className={cn("flex-1 transition-opacity duration-200", isNavigating ? "opacity-60" : "opacity-100")}>
        <PageContainer className="py-6">{children}</PageContainer>
      </main>
      <Footer />
      <ScrollTopButton />
    </div>
  );
}

export function Header() {
  const [commandOpen, setCommandOpen] = useState(false);
  const commandFinalFocusRef = useRef<HTMLElement | null>(null);
  const rootData = useRouteLoaderData("root") as { zones?: any[]; tabs?: any[] } | undefined;
  const visibleZones = (rootData?.zones || []).filter((z: any) => z.visible).sort((a: any, b: any) => a.sort_order - b.sort_order);

  return (
    <header className="sticky top-0 z-40 bg-background/90 shadow-sm backdrop-blur-xl">
      <PageContainer className="flex h-16 items-center justify-between">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <CNodeLogo className="hidden sm:inline-flex" />
          <CNodeLogo compact className="sm:hidden" />
          <button
            type="button"
            onClick={(event) => {
              commandFinalFocusRef.current = event.currentTarget;
              setCommandOpen(true);
            }}
            className="hidden h-9 w-[280px] items-center gap-2 rounded-md bg-muted px-3 text-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 md:inline-flex lg:w-[340px]"
            aria-label="搜索话题和用户"
          >
            <Search className="h-4 w-4" />
            <span className="min-w-0 flex-1 truncate text-left">搜索话题、用户...</span>
            <kbd className="rounded bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <nav className="hidden items-center gap-1 text-sm lg:flex">
            {visibleZones.map((z: any) => (
              <NavLink key={z.slug} to={`/zone/${z.slug}`}>
                <Code className="h-4 w-4" />
                {z.name}
              </NavLink>
            ))}
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
            onClick={(event) => {
              commandFinalFocusRef.current = event.currentTarget;
              setCommandOpen(true);
            }}
            aria-label="搜索"
          >
            <Search className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          <Button
            render={<Link to="/topic/create" />}
            size="sm"
            className="hidden h-9 px-3 sm:inline-flex"
          >
            <Pencil className="h-4 w-4" />
            发布话题
          </Button>
          <HeaderUserArea />
          <MobileNavTrigger visibleZones={visibleZones} />
        </div>
      </PageContainer>
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        finalFocus={commandFinalFocusRef}
      />
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
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

  if (!mounted) return null;
  if (!user) {
    return (
      <Link
        to="/signin"
        className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:px-3"
        aria-label="登录"
      >
        <User className="h-4 w-4 sm:hidden" />
        <span className="hidden sm:inline">登录</span>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        render={<Link to="/my/messages" aria-label="消息" />}
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full p-0"
            aria-label="用户菜单"
          />}
        >
          <Avatar className="size-7">
            <AvatarImage
              src={getAvatarUrl(user.avatar_url, 32)}
              alt={user.loginname}
            />
            <AvatarFallback>{getAvatarFallback(user.loginname)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 p-2">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="mb-1 flex items-center gap-2 rounded-lg bg-muted px-2 py-2 font-normal">
              <Avatar className="size-8">
                <AvatarImage
                  src={getAvatarUrl(user.avatar_url, 32)}
                  alt={user.loginname}
                />
                <AvatarFallback>{getAvatarFallback(user.loginname)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">
                  {user.loginname}
                </div>
                <div className="text-xs text-muted-foreground">已登录</div>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuItem render={<Link to={`/user/${user.loginname}`} />}>
              <User />
              我的主页
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link to="/setting" />}>
              <Settings />
              用户设置
            </DropdownMenuItem>
          </DropdownMenuGroup>
          {(user.is_admin || user.is_mod) && (
            <>
              <DropdownMenuGroup className="mt-1">
                <DropdownMenuItem render={<Link to={user.is_admin ? "/admin" : "/admin/topics"} />}>
                  <Shield />
                  {user.is_admin ? "管理后台" : "内容管理"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
          <DropdownMenuItem
            onClick={async () => {
              await apiFetch("/api/v1/auth/signout", { method: "POST" });
              clear();
              window.location.href = "/";
            }}
            className="mt-1 text-destructive data-[highlighted]:text-destructive"
          >
            <LogOut />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function MobileNavTrigger({ visibleZones = [] }: { visibleZones?: any[] }) {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="打开导航" />}>
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[82vh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <SheetHeader className="text-left">
            <SheetTitle>导航</SheetTitle>
          </SheetHeader>
          <nav className="grid grid-cols-2 gap-2 py-3">
            <Link
              to="/search"
              className="flex min-h-12 items-center gap-3 rounded-xl bg-muted px-3 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <Search className="h-5 w-5 text-primary" /> 搜索
            </Link>
            <Link
              to="/topic/create"
              className="flex min-h-12 items-center gap-3 rounded-xl bg-muted px-3 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <Pencil className="h-5 w-5 text-primary" /> 发布话题
            </Link>
            {visibleZones.map((z: any) => (
              <Link
                key={z.slug}
                to={`/zone/${z.slug}`}
                className="flex min-h-12 items-center gap-3 rounded-xl bg-muted px-3 text-sm text-foreground transition-colors hover:bg-accent"
              >
                <Code className="h-5 w-5 text-primary" /> {z.name}
              </Link>
            ))}
            <Link
              to="/my/messages"
              className="flex min-h-12 items-center gap-3 rounded-xl bg-muted px-3 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <Bell className="h-5 w-5 text-primary" /> 消息
            </Link>
            <Link
              to="/api"
              className="flex min-h-12 items-center gap-3 rounded-xl bg-muted px-3 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <Code className="h-5 w-5 text-primary" /> API
            </Link>
            <Link
              to="/about"
              className="flex min-h-12 items-center gap-3 rounded-xl bg-muted px-3 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <Info className="h-5 w-5 text-primary" /> 关于
            </Link>
            {user ? (
              <>
                <Link
                  to={`/user/${user.loginname}`}
                  className="flex min-h-12 items-center gap-3 rounded-xl bg-muted px-3 text-sm text-foreground transition-colors hover:bg-accent"
                >
                  <User className="h-5 w-5 text-primary" /> 我的主页
                </Link>
                <Link
                  to="/setting"
                  className="flex min-h-12 items-center gap-3 rounded-xl bg-muted px-3 text-sm text-foreground transition-colors hover:bg-accent"
                >
                  <Settings className="h-5 w-5 text-primary" /> 用户设置
                </Link>
                {(user.is_admin || user.is_mod) && (
                  <Link
                    to={user.is_admin ? "/admin" : "/admin/topics"}
                    className="col-span-2 flex min-h-12 items-center gap-3 rounded-xl bg-muted px-3 text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    <Shield className="h-5 w-5 text-primary" /> {user.is_admin ? "管理后台" : "内容管理"}
                  </Link>
                )}
              </>
            ) : (
              <Link
                to="/signin"
                className="flex min-h-12 items-center gap-3 rounded-xl bg-muted px-3 text-sm text-foreground transition-colors hover:bg-accent"
              >
                <User className="h-5 w-5 text-primary" /> 登录
              </Link>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 bg-muted/40">
      <PageContainer className="py-10">
        <div className="overflow-hidden rounded-xl bg-card shadow-lg">
          <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(520px,1fr)]">
            <section className="relative bg-brand p-8 text-brand-foreground sm:p-10">
              <div className="relative max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-foreground/10 bg-brand-foreground/5 px-3 py-1 text-xs text-brand-foreground/70">
                  <span className="size-2 rounded-full bg-brand-accent" />
                  Node.js 中文技术社区
                </div>
                <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">CNode Next</h2>
                <p className="mt-4 text-sm leading-6 text-brand-foreground/70">
                  连接中文 Node.js 开发者，沉淀问题解法、项目实践、招聘机会和生态资源。
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button render={<Link to="/topic/create" />} size="sm">
                    发布话题
                  </Button>
                  <Button
                    render={<Link to="/about" />}
                    variant="secondary"
                    size="sm"
                  >
                    了解社区
                  </Button>
                </div>
              </div>
            </section>
            <section className="grid bg-muted sm:grid-cols-3">
              <FooterGroup
                title="社区"
                links={[
                  ["关于", "/about"],
                  ["发布话题", "/topic/create"],
                  ["用户排行", "/users/top100"],
                  ["精华话题", "/stars"],
                ]}
              />
              <FooterGroup
                title="资源"
                links={[
                  ["API", "/api"],
                  ["RSS", "/rss"],
                ]}
              />
              <div className="p-6 sm:p-8">
                <h3 className="text-sm font-semibold text-foreground">开发者</h3>
                <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
                  <a
                    className="flex items-center gap-2 hover:text-primary"
                    href="https://github.com/cnodejs/cnode-next"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Code className="h-4 w-4" />
                    GitHub
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </PageContainer>
      <div>
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
      <ul className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
        {links.map(([label, href]) => (
          <li key={href}>
            {href === "/rss" ? (
              <a href={href} className="hover:text-primary">
                {label}
              </a>
            ) : (
              <Link to={href} className="hover:text-primary">
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
