import type { Route } from "../../.react-router/types/app/routes/+types/stars";
import { Link } from "react-router";
import { Layout } from "~/components/Layout";
import { DirectoryPage, PageHeader } from "~/components/PageShell";
import { apiFetch } from "~/lib/api-client";
import { getAvatarFallback, getAvatarUrl } from "~/lib/brand";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { EmptyState } from "~/components/EmptyState";
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from "~/components/ui/item";

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
      <DirectoryPage>
        <PageHeader breadcrumbs={[{ label: "首页", to: "/" }, { label: "社区达人" }]} title="社区达人" description="由管理员标记的 CNode 社区活跃成员。" />
        <UserGrid users={users} empty="暂无达人" />
      </DirectoryPage>
    </Layout>
  );
}

export function UserGrid({ users, empty }: { users: any[]; empty: string }) {
  if (users.length === 0) {
    return <EmptyState title="暂无用户" message={empty} />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {users.map((user, index) => (
        <Item key={user.id || user.loginname} render={<Link to={`/user/${user.loginname}`} />} variant="outline">
            <ItemMedia>
              <Avatar>
                <AvatarImage src={getAvatarUrl(user.avatar_url, 48)} alt={user.loginname} />
                <AvatarFallback>{getAvatarFallback(user.loginname)}</AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{user.loginname}</ItemTitle>
              <div className="text-sm text-muted-foreground">积分 {user.score || 0}</div>
            </ItemContent>
            <ItemActions>
              <Badge variant="secondary">#{index + 1}</Badge>
            </ItemActions>
        </Item>
      ))}
    </div>
  );
}
