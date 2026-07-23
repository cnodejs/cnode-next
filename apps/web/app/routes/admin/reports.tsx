import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { apiFetch } from "~/lib/api-client";
import { useRevalidator } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { EmptyState } from "~/components/EmptyState";
import { AdminPage, AdminPageHeader, AdminPanel } from "~/components/AdminPage";

export function meta() {
  return [{ title: "举报队列 · CNode Admin" }];
}

export async function loader({ request }: any) {
  await requireAdmin(request);
  const cookie = request.headers.get("cookie") || "";
  const res = await apiFetch<{ success: boolean; data: any[] }>("/api/v1/admin/reports", {
    headers: { cookie },
  });
  return { reports: res.success ? res.data || [] : [] };
}

export default function AdminReports({ loaderData }: any) {
  const { reports } = loaderData;
  const { revalidate } = useRevalidator();

  const handleAction = async (id: number, action: string) => {
    const res = await apiFetch<{ success: boolean; error_msg?: string }>(
      `/api/v1/admin/reports/${id}/${action}`,
      { method: "POST" },
    );
    if (res.success) {
      toast.success(action === "confirm" ? "已确认违规" : "已驳回");
      revalidate();
    } else {
      toast.error(res.error_msg || "操作失败");
    }
  };

  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader title="举报队列" description="集中确认用户举报，区分违规内容和误报反馈。" />
        <AdminPanel title="待处理举报" description={`共 ${reports.length} 条举报记录`} contentClassName="p-4">
          {reports.length === 0 ? (
            <EmptyState message="暂无举报" />
          ) : (
            <div className="space-y-3">
              {reports.map((r: any) => (
                <div key={r.id} className="rounded-2xl border border-border bg-background p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm">
                <Badge variant="destructive">{r.type}</Badge>
                <span className="text-muted-foreground">{r.reporters?.length || 0} 人举报</span>
                  </div>
                  <div className="mb-2 text-sm">
                <a href={`/topic/${r.topic_id}`} className="font-medium text-cnode-ink hover:text-cnode-green">
                  {r.topic_title}
                </a>
                  </div>
              {r.description && (
                    <p className="mb-3 rounded-xl bg-surface-subtle p-3 text-sm text-muted-foreground">{r.description}</p>
              )}
                  <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleAction(r.id, "confirm")}
                >
                  确认违规
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAction(r.id, "dismiss")}>
                  驳回
                </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>
      </AdminPage>
    </AdminLayout>
  );
}
