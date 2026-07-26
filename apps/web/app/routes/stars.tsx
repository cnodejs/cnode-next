import type { Route } from "../../.react-router/types/app/routes/+types/stars";
import { Link } from "react-router";
import { Layout } from "~/components/Layout";
import { ContentPage } from "~/components/PageShell";
import { apiFetch } from "~/lib/api-client";
import { getAvatarFallback, getAvatarUrl } from "~/lib/brand";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";

export function meta() {
  return [{ title: "社区达人 · CNode" }];
}

export async function loader() {
  const res = await apiFetch<{ success: boolean; data: any[] }>("/api/v1/users/stars");
  return { users: res.success ? res.data || [] : [] };
}

export default function Stars({ loaderData }: Route.ComponentProps) {
  const { users } = loaderData as any;
  return (
    <Layout>
      <ContentPage className="space-y-6">
        <section className="rounded-3xl border border-cnode-green/20 bg-cnode-soft p-6 sm:p-8">
          <p className="text-sm font-medium text-primary">STARS</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">社区达人</h1>
          <p className="mt-2 text-sm text-muted-foreground">由管理员标记的 CNode 社区活跃成员。</p>
        </section>
        <UserGrid users={users} empty="暂无达人" />
      </ContentPage>
    </Layout>
  );
}

export function UserGrid({ users, empty }: { users: any[]; empty: string }) {
  if (users.length === 0) {
    return <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">{empty}</CardContent></Card>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {users.map((user, index) => (
        <Link key={user.id || user.loginname} to={`/user/${user.loginname}`} className="group">
          <Card className="h-full transition-colors hover:border-cnode-green/40">
            <CardContent className="flex items-center gap-4 p-5">
              <Avatar className="h-12 w-12 border border-border">
                <AvatarImage src={getAvatarUrl(user.avatar_url, 48)} alt={user.loginname} />
                <AvatarFallback>{getAvatarFallback(user.loginname)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold group-hover:text-primary">{user.loginname}</div>
                <div className="mt-1 text-sm text-muted-foreground">积分 {user.score || 0}</div>
              </div>
              <Badge variant="secondary">#{index + 1}</Badge>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
