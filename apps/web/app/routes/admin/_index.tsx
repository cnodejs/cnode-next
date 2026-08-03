import { AdminLayout } from "~/components/AdminLayout";
import { TimeAgo } from "~/components/TimeAgo";
import { apiFetch } from "~/lib/api-client";
import { requireAdmin } from "~/lib/auth";
import { Link } from "react-router";
import { AdminMetricCard, AdminPage, AdminPageHeader, AdminPanel } from "~/components/AdminPage";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "~/components/ui/item";

export function meta() {
  return [{ title: "管理概览 · CNode Admin" }];
}

export async function loader({ request }: any) {
  await requireAdmin(request);
  const cookie = request.headers.get("cookie") || "";
  const [statsRes, recentUsersRes, recentTopicsRes] = await Promise.all([
    apiFetch<{ success: boolean; data: any }>("/api/v1/admin/stats", { headers: { cookie } }).catch(() => null),
    apiFetch<{ success: boolean; data: any[] }>("/api/v1/admin/recent-users", { headers: { cookie } }).catch(() => null),
    apiFetch<{ success: boolean; data: any[] }>("/api/v1/admin/recent-topics", { headers: { cookie } }).catch(() => null),
  ]);
  return {
    stats: statsRes?.success ? statsRes.data : null,
    recentUsers: recentUsersRes?.success ? recentUsersRes.data : [],
    recentTopics: recentTopicsRes?.success ? recentTopicsRes.data : [],
  };
}

export default function AdminIndex({ loaderData }: any) {
  const { stats, recentUsers, recentTopics } = loaderData;
  return (
    <AdminLayout>
      <AdminPage archetype="dashboard">
      <AdminPageHeader title="管理概览" description="社区运行状态、近期内容和新用户的统一工作台。" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="用户总数" value={stats?.userCount ?? "-"} />
        <AdminMetricCard label="话题总数" value={stats?.topicCount ?? "-"} />
        <AdminMetricCard label="回复总数" value={stats?.replyCount ?? "-"} />
        <AdminMetricCard label="今日发帖" value={stats?.todayTopics ?? "-"} />
        <AdminMetricCard label="今日回复" value={stats?.todayReplies ?? "-"} />
        <AdminMetricCard label="今日注册" value={stats?.todayUsers ?? "-"} />
        <AdminMetricCard label="待处理举报" value={stats?.pendingReports ?? "-"} href="/admin/reports?status=pending" />
        <AdminMetricCard label="待处理巡检" value={stats?.moderationPending ?? "-"} href="/admin/moderation" />
      </div>
      <div className="grid items-start gap-4 md:grid-cols-2">
        <AdminPanel title="最近注册用户" description="快速发现新增成员">
          <ItemGroup>
          {recentUsers.length > 0 ? (
            recentUsers.map((u: any) => (
              <Item key={u.id} size="sm" render={<Link to={`/user/${u.loginname}`} />}>
                <ItemMedia>
                  <Avatar>
                    <AvatarImage src={u.avatar_url || "https://gravatar.com/avatar/?size=32"} alt="" />
                    <AvatarFallback>{String(u.loginname || "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{u.loginname}</ItemTitle>
                  <ItemDescription>注册于 <TimeAgo date={u.create_at} /></ItemDescription>
                </ItemContent>
              </Item>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">暂无数据</div>
          )}
          </ItemGroup>
        </AdminPanel>
        <AdminPanel title="最近发布话题" description="关注新增内容质量">
          <ItemGroup>
          {recentTopics.length > 0 ? (
            recentTopics.map((t: any) => (
              <Item key={t.id} size="sm" render={<Link to={`/topic/${t.id}`} />}>
                <ItemContent>
                  <ItemTitle>{t.title}</ItemTitle>
                  {t.create_at && <ItemDescription>发布于 <TimeAgo date={t.create_at} /></ItemDescription>}
                </ItemContent>
              </Item>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">暂无数据</div>
          )}
          </ItemGroup>
        </AdminPanel>
      </div>
      </AdminPage>
    </AdminLayout>
  );
}
