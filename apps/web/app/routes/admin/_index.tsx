import { AdminLayout } from "~/components/AdminLayout";
import { TimeAgo } from "~/components/TimeAgo";
import { apiFetch } from "~/lib/api-client";
import { requireAdmin } from "~/lib/auth";
import { Link } from "react-router";
import { AdminMetricCard, AdminPage, AdminPageHeader, AdminPanel } from "~/components/AdminPage";

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
  const statCards = [
    { label: "用户总数", value: stats?.userCount ?? "-" },
    { label: "话题总数", value: stats?.topicCount ?? "-" },
    { label: "回复总数", value: stats?.replyCount ?? "-" },
    { label: "今日发帖", value: stats?.todayTopics ?? "-" },
    { label: "今日回复", value: stats?.todayReplies ?? "-" },
    { label: "今日注册", value: stats?.todayUsers ?? "-" },
    { label: "待审举报", value: stats?.pendingReports ?? "-" },
    { label: "巡检待处理", value: stats?.moderationPending ?? "-" },
  ];
  return (
    <AdminLayout>
      <AdminPage>
      <AdminPageHeader title="管理概览" description="社区运行状态、近期内容和新用户的统一工作台。" />
       <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
        {statCards.map((card) => (
          <AdminMetricCard key={card.label} label={card.label} value={card.value} />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <AdminPanel title="最近注册用户" description="快速发现新增成员">
          <div className="space-y-1 p-4">
          {recentUsers.length > 0 ? (
            recentUsers.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-surface-subtle">
                <img
                  src={u.avatar_url || "https://gravatar.com/avatar/?size=24"}
                  className="h-8 w-8 rounded-full"
                  alt=""
                />
                <div className="min-w-0 flex-1">
                  <Link to={`/user/${u.loginname}`} className="font-medium text-cnode-ink hover:text-cnode-green">
                    {u.loginname}
                  </Link>
                </div>
                <span className="text-muted-foreground text-xs">
                  <TimeAgo date={u.create_at} />
                </span>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">暂无数据</div>
          )}
          </div>
        </AdminPanel>
        <AdminPanel title="最近发布话题" description="关注新增内容质量">
          <div className="space-y-1 p-4">
          {recentTopics.length > 0 ? (
            recentTopics.map((t: any) => (
              <div key={t.id} className="rounded-xl px-2 py-2 text-sm hover:bg-surface-subtle">
                <Link to={`/topic/${t.id}`} className="block truncate font-medium text-cnode-ink hover:text-cnode-green">
                  {t.title}
                </Link>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">暂无数据</div>
          )}
          </div>
        </AdminPanel>
      </div>
      </AdminPage>
    </AdminLayout>
  );
}
