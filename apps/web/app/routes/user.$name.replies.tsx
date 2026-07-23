import type { Route } from "../../.react-router/types/app/routes/+types/user.$name.replies";
import { Layout } from "~/components/Layout";
import { apiFetch } from "~/lib/api-client";
import { Link } from "react-router";
import { TimeAgo } from "~/components/TimeAgo";
import { ContentPage } from "~/components/PageShell";
import { UserHero, UserTabs } from "./user.$name";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.loginname) return [{ title: "用户回复 · CNode" }];
  return [{ title: `${data.loginname} 的回复 · CNode` }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const name = params.name!;
  const res = await apiFetch<{ success: boolean; data: any }>(`/api/v1/user/${name}`);
  const replies = res.success && res.data?.recent_replies ? res.data.recent_replies : [];
  return { replies, user: res.success ? res.data : null, loginname: name };
}

export default function UserReplies({ loaderData }: Route.ComponentProps) {
  const { replies, user, loginname } = loaderData as any;

  return (
    <Layout>
      <ContentPage className="space-y-6">
        {user && <UserHero user={user} />}
        <UserTabs loginname={loginname} active="replies" />
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/80 bg-surface-subtle">
            <CardTitle className="text-base">{loginname} 参与的话题</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {replies.length > 0 ? (
              <div className="divide-y divide-border">
                {replies.map((topic: any) => (
                  <article key={topic.id} className="p-4 sm:p-5">
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
              <div className="py-12 text-center text-sm text-muted-foreground">暂无回复</div>
            )}
          </CardContent>
        </Card>
      </ContentPage>
    </Layout>
  );
}
