import type { Route } from "../../.react-router/types/app/routes/+types/users.top100";
import { Layout } from "~/components/Layout";
import { ContentPage } from "~/components/PageShell";
import { apiFetch } from "~/lib/api-client";
import { UserGrid } from "./stars";

export function meta() {
  return [{ title: "积分榜 · CNode" }];
}

export async function loader() {
  const res = await apiFetch<{ success: boolean; data: any[] }>("/api/v1/users/top100");
  return { users: res.success ? res.data || [] : [] };
}

export default function Top100({ loaderData }: Route.ComponentProps) {
  const { users } = loaderData as any;
  return (
    <Layout>
      <ContentPage className="space-y-6">
        <section className="rounded-3xl border border-cnode-green/20 bg-cnode-soft p-6 sm:p-8">
          <p className="text-sm font-medium text-primary">TOP 100</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">积分榜</h1>
          <p className="mt-2 text-sm text-muted-foreground">未禁言用户按积分排序的前 100 名。</p>
        </section>
        <UserGrid users={users} empty="暂无用户" />
      </ContentPage>
    </Layout>
  );
}
