import type { Route } from "../../.react-router/types/app/routes/+types/user.$name.replies";
import { Layout } from "~/components/Layout";
import { apiFetch } from "~/lib/api-client";
import { Link } from "react-router";
import { TimeAgo } from "~/components/TimeAgo";
import { ContentPage } from "~/components/PageShell";
import { UserHero, UserTabs } from "./user.$name";
import { Pagination } from "~/components/Pagination";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { EmptyState } from "~/components/EmptyState";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.loginname) return [{ title: "用户回复 · CNode" }];
  return [{ title: `${data.loginname} 的回复 · CNode` }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const name = params.name!;
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = 50;
  const res = await apiFetch<{ success: boolean; data: any[]; total?: number; user?: any }>(
    `/api/v1/user/${name}/replies?page=${page}&limit=${limit}`,
  );
  return { replies: res.success ? res.data || [] : [], user: res.success ? res.user : null, loginname: name, page, limit, total: res.total || 0 };
}

export default function UserReplies({ loaderData }: Route.ComponentProps) {
  const { replies, user, loginname, page, limit, total } = loaderData as any;

  return (
    <Layout>
      <ContentPage className="space-y-6">
        {user && <UserHero user={user} />}
        <UserTabs loginname={loginname} active="replies" />
        <Card className="overflow-hidden">
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-base">{loginname} 参与的话题</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {replies.length > 0 ? (
              <div className="flex flex-col gap-1 p-2">
                {replies.map((topic: any) => (
                  <article key={topic.id} className="rounded-xl p-3 transition-colors hover:bg-surface-subtle sm:p-4">
                    <div className="text-sm text-muted-foreground">
                      在话题中回复 · {topic.last_reply_at ? <TimeAgo date={topic.last_reply_at} /> : null}
                    </div>
                    <Link
                      to={`/topic/${topic.id}`}
                      className="mt-1 block truncate font-medium text-foreground hover:text-primary"
                    >
                      {topic.title}
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState message="该用户还没有参与回复" />
            )}
          </CardContent>
        </Card>
        <Pagination page={page} total={total} limit={limit} basePath={`/user/${loginname}/replies`} />
      </ContentPage>
    </Layout>
  );
}
