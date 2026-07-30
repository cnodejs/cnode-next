import type { ReactNode } from "react";
import { AdminLayout } from "~/components/AdminLayout";
import { TimeAgo } from "~/components/TimeAgo";
import { apiFetch } from "~/lib/api-client";
import { requireAdmin } from "~/lib/auth";
import { Link } from "react-router";
import { AdminPage, AdminPageHeader, AdminPanel } from "~/components/AdminPage";
import { Card, CardContent } from "~/components/ui/card";

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
      <AdminPage>
      <AdminPageHeader title="管理概览" description="社区运行状态、近期内容和新用户的统一工作台。" />
      <div className="grid gap-3 lg:grid-cols-3">
        <SummaryCard
          title="社区规模"
          items={[
            ["用户", stats?.userCount ?? "-"],
            ["话题", stats?.topicCount ?? "-"],
            ["回复", stats?.replyCount ?? "-"],
          ]}
        />
        <SummaryCard
          title="今日动态"
          items={[
            ["发帖", stats?.todayTopics ?? "-"],
            ["回复", stats?.todayReplies ?? "-"],
            ["注册", stats?.todayUsers ?? "-"],
          ]}
        />
        <SummaryCard
          title="待处理事项"
          items={[
            ["举报", stats?.pendingReports ?? "-", "/admin/reports?status=pending"],
            ["巡检", stats?.moderationPending ?? "-", "/admin/moderation"],
          ]}
          emphasis
        />
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

function SummaryCard({
  title,
  items,
  emphasis = false,
}: {
  title: string;
  items: Array<[string, ReactNode, string?]>;
  emphasis?: boolean;
}) {
  return (
    <Card className={emphasis ? "border-cnode-green/30 bg-cnode-soft" : "border-cnode-green/15 bg-card"}>
      <CardContent className="p-4">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-none xl:grid-cols-3">
          {items.map(([label, value, href]) => {
            const body = (
              <>
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mt-1 text-2xl font-semibold tracking-tight text-cnode-ink">{value}</div>
              </>
            );
            return href ? (
              <Link key={label} to={href} className="rounded-xl p-2 transition-colors hover:bg-background/70">
                {body}
              </Link>
            ) : (
              <div key={label} className="rounded-xl p-2">
                {body}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
