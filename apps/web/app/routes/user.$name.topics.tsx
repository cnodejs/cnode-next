import type { Route } from "../../.react-router/types/app/routes/+types/user.$name.topics";
import { Layout } from "~/components/Layout";
import { TopicList } from "~/components/TopicList";
import { apiFetch } from "~/lib/api-client";
import { ContentPage } from "~/components/PageShell";
import { UserHero, UserTabs } from "./user.$name";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.loginname) return [{ title: "用户话题 · CNode" }];
  return [{ title: `${data.loginname} 的话题 · CNode` }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const name = params.name!;
  const res = await apiFetch<{ success: boolean; data: any }>(`/api/v1/user/${name}`);
  const topics = res.success && res.data?.recent_topics ? res.data.recent_topics : [];
  return { topics, user: res.success ? res.data : null, loginname: name };
}

export default function UserTopics({ loaderData }: Route.ComponentProps) {
  const { topics, user, loginname } = loaderData as any;

  return (
    <Layout>
      <ContentPage className="space-y-6">
        {user && <UserHero user={user} />}
        <UserTabs loginname={loginname} active="topics" />
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/80 bg-surface-subtle"><CardTitle className="text-base">{loginname} 的话题</CardTitle></CardHeader>
          <CardContent className="p-0"><TopicList topics={topics} /></CardContent>
        </Card>
      </ContentPage>
    </Layout>
  );
}
