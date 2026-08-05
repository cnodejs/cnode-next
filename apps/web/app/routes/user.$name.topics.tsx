import type { Route } from "../../.react-router/types/app/routes/+types/user.$name.topics";
import { Layout } from "~/components/Layout";
import { TopicList } from "~/components/TopicList";
import { apiFetch } from "~/lib/api-client";
import { FeedPage } from "~/components/PageShell";
import { UserHero, UserTabs } from "./user.$name";
import { Pagination } from "~/components/Pagination";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { seoMeta } from "~/lib/seo";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.loginname) return [{ title: "用户话题 · CNode" }];
  return seoMeta({
    title: `${data.loginname} 的话题 · CNode`,
    description: `查看 ${data.loginname} 在 CNode 发布的话题。`,
    path: `/user/${encodeURIComponent(data.loginname)}/topics`,
    type: "profile",
  });
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const name = params.name!;
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = 20;
  const res = await apiFetch<{ success: boolean; data: any[]; total?: number; user?: any }>(
    `/api/v1/user/${name}/topics?page=${page}&limit=${limit}`,
  );
  return {
    topics: res.success ? res.data || [] : [],
    user: res.success ? res.user : null,
    loginname: name,
    page,
    limit,
    total: res.total || 0,
  };
}

export default function UserTopics({ loaderData }: Route.ComponentProps) {
  const { topics, user, loginname, page, limit, total } = loaderData as any;

  return (
    <Layout>
      <FeedPage>
        {user && <UserHero user={user} />}
        <UserTabs loginname={loginname} active="topics" />
        <Card>
          <CardHeader>
            <CardTitle>{loginname} 的话题</CardTitle>
          </CardHeader>
          <CardContent>
            <TopicList topics={topics} />
          </CardContent>
        </Card>
        <Pagination
          page={page}
          total={total}
          limit={limit}
          basePath={`/user/${loginname}/topics`}
        />
      </FeedPage>
    </Layout>
  );
}
