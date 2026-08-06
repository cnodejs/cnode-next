import type { Route } from "../../.react-router/types/app/routes/+types/user.$name.replies";
import { Layout } from "~/components/Layout";
import { apiFetch } from "~/lib/api-client";
import { Link } from "react-router";
import { TimeAgo } from "~/components/TimeAgo";
import { FeedPage } from "~/components/PageShell";
import { UserHero, UserTabs } from "./user.$name";
import { Pagination } from "~/components/Pagination";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { EmptyState } from "~/components/EmptyState";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "~/components/ui/item";
import { seoMeta } from "~/lib/seo";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.loginname) return [{ title: "用户回复 · CNode" }];
  return seoMeta({
    title: `${data.loginname} 的回复 · CNode`,
    description: `查看 ${data.loginname} 在 CNode 参与回复的话题。`,
    path: `/user/${encodeURIComponent(data.loginname)}/replies`,
    type: "profile",
  });
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const name = params.name!;
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = 50;
  const res = await apiFetch<{ success: boolean; data: any[]; total?: number; user?: any }>(
    `/api/v1/user/${name}/replies?page=${page}&limit=${limit}`,
  );
  return {
    replies: res.success ? res.data || [] : [],
    user: res.success ? res.user : null,
    loginname: name,
    page,
    limit,
    total: res.total || 0,
  };
}

export default function UserReplies({ loaderData }: Route.ComponentProps) {
  const { replies, user, loginname, page, limit, total } = loaderData as any;

  return (
    <Layout>
      <FeedPage>
        {user && <UserHero user={user} />}
        <UserTabs loginname={loginname} active="replies" />
        <Card>
          <CardHeader>
            <CardTitle>{loginname} 参与的话题</CardTitle>
          </CardHeader>
          <CardContent>
            {replies.length > 0 ? (
              <ItemGroup>
                {replies.map((topic: any) => (
                  <Item key={topic.id} render={<Link to={`/topic/${topic.id}`} />}>
                    <ItemContent>
                      <ItemDescription>
                        在话题中回复 ·{" "}
                        {topic.last_reply_at ? <TimeAgo date={topic.last_reply_at} /> : null}
                      </ItemDescription>
                      <ItemTitle>{topic.title}</ItemTitle>
                    </ItemContent>
                  </Item>
                ))}
              </ItemGroup>
            ) : (
              <EmptyState message="该用户还没有参与回复" />
            )}
          </CardContent>
        </Card>
        <Pagination
          page={page}
          total={total}
          limit={limit}
          basePath={`/user/${loginname}/replies`}
        />
      </FeedPage>
    </Layout>
  );
}
