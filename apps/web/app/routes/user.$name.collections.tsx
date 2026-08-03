import type { Route } from "../../.react-router/types/app/routes/+types/user.$name.collections";
import { Layout } from "~/components/Layout";
import { TopicList } from "~/components/TopicList";
import { apiFetch } from "~/lib/api-client";
import { FeedPage } from "~/components/PageShell";
import { UserHero, UserTabs } from "./user.$name";
import { Pagination } from "~/components/Pagination";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { seoMeta } from "~/lib/seo";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.loginname) return [{ title: "用户收藏 · CNode" }];
  return seoMeta({
    title: `${data.loginname} 的收藏 · CNode`,
    description: `查看 ${data.loginname} 在 CNode 收藏的话题。`,
    path: `/user/${encodeURIComponent(data.loginname)}/collections`,
    type: "profile",
  });
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
      <FeedPage>
        {user && <UserHero user={user} />}
        <UserTabs loginname={loginname} active="collections" />
        <Card>
          <CardHeader><CardTitle>{loginname} 的收藏</CardTitle></CardHeader>
          <CardContent><TopicList topics={topics} /></CardContent>
        </Card>
        <Pagination page={page} total={total} limit={limit} basePath={`/user/${loginname}/collections`} />
      </FeedPage>
    </Layout>
  );
}
