import type { Route } from "../../.react-router/types/app/routes/+types/user.$name";
import { Link } from "react-router";
import { Layout } from "~/components/Layout";
import { TopicList } from "~/components/TopicList";
import { TimeAgo } from "~/components/TimeAgo";
import { ContentPage } from "~/components/PageShell";
import { apiFetch } from "~/lib/api-client";
import { getAvatarFallback, getAvatarUrl } from "~/lib/brand";
import { kvGet, kvSet } from "~/lib/kv-cache";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";

export async function loader({ params, context }: Route.LoaderArgs) {
  const name = params.name!;
  const kv = (context as any)?.cloudflare?.env?.KV;
  const cacheKey = `user:${name}`;
  const cached = await kvGet<any>(kv, cacheKey);
  if (cached) return { user: cached, kv };
  const res = await apiFetch<{ success: boolean; data: any }>(`/api/v1/user/${name}`);
  if (!res.success) return { user: null, kv };
  await kvSet(kv, cacheKey, res.data, 60);
  return { user: res.data, kv };
}

export function meta({ data }: Route.MetaArgs) {
  if (!data?.user) return [{ title: "用户不存在 · CNode" }];
  return [{ title: `${data.user.loginname} · CNode` }];
}

export default function UserProfile({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData as any;
  if (!user)
    return (
      <Layout>
        <Card className="mx-auto max-w-2xl text-center">
          <CardContent className="py-12 text-muted-foreground">用户不存在</CardContent>
        </Card>
      </Layout>
    );

  return (
    <Layout>
      <ContentPage className="space-y-6">
        <UserHero user={user} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0 space-y-6">
            <UserTabs loginname={user.loginname} active="home" />
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border/80 bg-surface-subtle">
                <CardTitle className="text-base">最近创建的话题</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {user.recent_topics?.length > 0 ? (
                  <TopicList topics={user.recent_topics} />
                ) : (
                  <div className="py-10 text-center text-sm text-muted-foreground">暂无话题</div>
                )}
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border/80 bg-surface-subtle">
                <CardTitle className="text-base">最近参与的话题</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {user.recent_replies?.length > 0 ? (
                  <TopicList topics={user.recent_replies} />
                ) : (
                  <div className="py-10 text-center text-sm text-muted-foreground">暂无回复</div>
                )}
              </CardContent>
            </Card>
          </div>
          <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader className="border-b border-border/80 bg-surface-subtle">
                <CardTitle className="text-base">社区资料</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex justify-between"><span>积分</span><span className="font-medium text-foreground">{user.score || 0}</span></div>
                <div className="flex justify-between"><span>话题</span><span className="font-medium text-foreground">{user.recent_topics?.length || 0}</span></div>
                <div className="flex justify-between"><span>参与</span><span className="font-medium text-foreground">{user.recent_replies?.length || 0}</span></div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </ContentPage>
    </Layout>
  );
}

function UserHero({ user }: { user: any }) {
  return (
    <section className="rounded-3xl border border-cnode-green/20 bg-cnode-soft p-6 shadow-card sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="h-20 w-20 border border-border ring-4 ring-cnode-green/10">
            <AvatarImage src={getAvatarUrl(user.avatar_url, 96)} alt={user.loginname} />
            <AvatarFallback>{getAvatarFallback(user.loginname)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{user.loginname}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              注册于 <TimeAgo date={user.create_at} />
            </p>
          </div>
        </div>
        <Badge className="w-fit">积分 {user.score || 0}</Badge>
      </div>
    </section>
  );
}

function UserTabs({ loginname, active }: { loginname: string; active: "home" | "topics" | "replies" | "collections" }) {
  const items = [
    ["home", "主页", `/user/${loginname}`],
    ["topics", "话题", `/user/${loginname}/topics`],
    ["replies", "回复", `/user/${loginname}/replies`],
    ["collections", "收藏", `/user/${loginname}/collections`],
  ] as const;
  return (
    <Card>
      <CardContent className="flex gap-1 overflow-x-auto p-2">
        {items.map(([key, label, to]) => (
          <Link
            key={key}
            to={to}
            className={
              active === key
                ? "rounded-lg bg-cnode-ink px-3 py-1.5 text-sm text-white shadow-sm"
                : "rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }
          >
            {label}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export { UserHero, UserTabs };
