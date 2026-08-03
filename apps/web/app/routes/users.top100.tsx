import type { Route } from "../../.react-router/types/app/routes/+types/users.top100";
import { Layout } from "~/components/Layout";
import { DirectoryPage, PageHeader } from "~/components/PageShell";
import { apiFetch } from "~/lib/api-client";
import { UserGrid } from "./stars";
import { seoMeta } from "~/lib/seo";

export function meta() {
  return seoMeta({
    title: "积分榜 · CNode",
    description: "查看 CNode 社区积分排名前 100 的活跃用户。",
    path: "/users/top100",
  });
}

export async function loader() {
  const res = await apiFetch<{ success: boolean; data: any[] }>("/api/v1/users/top100");
  return { users: res.success ? res.data || [] : [] };
}

export default function Top100({ loaderData }: Route.ComponentProps) {
  const { users } = loaderData as any;
  return (
    <Layout>
      <DirectoryPage>
        <PageHeader breadcrumbs={[{ label: "首页", to: "/" }, { label: "积分榜" }]} title="积分榜" description="未禁言用户按积分排序的前 100 名。" />
        <UserGrid users={users} empty="暂无用户" />
      </DirectoryPage>
    </Layout>
  );
}
