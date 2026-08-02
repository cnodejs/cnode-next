import type { Route } from "../../.react-router/types/app/routes/+types/user.$name.collections";
import { Layout } from "~/components/Layout";
import { TopicList } from "~/components/TopicList";
import { apiFetch } from "~/lib/api-client";
import { ContentPage } from "~/components/PageShell";
import { UserHero, UserTabs } from "./user.$name";
import { Pagination } from "~/components/Pagination";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.loginname) return [{ title: "用户收藏 · CNode" }];
  return [{ title: `${data.loginname} 的收藏 · CNode` }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const name = params.name!;
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = 20;
  const collectionsRes = await apiFetch<{ success: boolean; data: any[]; total?: number; user?: any }>(
    `/api/v1/user/${name}/collections?page=${page}&limit=${limit}`,
  );
  return {
    topics: collectionsRes.success ? collectionsRes.data : [],
    user: collectionsRes.success ? collectionsRes.user : null,
    loginname: name,
    page,
    limit,
    total: collectionsRes.total || 0,
  };
}

export default function UserCollections({ loaderData }: Route.ComponentProps) {
  const { topics, user, loginname, page, limit, total } = loaderData as any;

  return (
    <Layout>
      <ContentPage className="space-y-6">
        {user && <UserHero user={user} />}
        <UserTabs loginname={loginname} active="collections" />
        <Card className="overflow-hidden">
          <CardHeader className="p-4 pb-3"><CardTitle className="text-base">{loginname} 的收藏</CardTitle></CardHeader>
          <CardContent className="p-0"><TopicList topics={topics} /></CardContent>
        </Card>
        <Pagination page={page} total={total} limit={limit} basePath={`/user/${loginname}/collections`} />
      </ContentPage>
    </Layout>
  );
}
