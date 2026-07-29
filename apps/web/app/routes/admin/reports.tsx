import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { apiFetch } from "~/lib/api-client";
import { Form, useRevalidator } from "react-router";
import { toast } from "sonner";
import { useAsyncAction } from "~/hooks/use-async-action";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { EmptyState } from "~/components/EmptyState";
import { AdminPage, AdminPageHeader, AdminPanel } from "~/components/AdminPage";
import { Pagination } from "~/components/Pagination";

export function meta() {
  return [{ title: "举报队列 · CNode Admin" }];
}

export async function loader({ request }: any) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Number(url.searchParams.get("limit")) || 50);
  const status = url.searchParams.get("status") || "pending";
  const cookie = request.headers.get("cookie") || "";
  const res = await apiFetch<{ success: boolean; data: any[]; total?: number }>(
    `/api/v1/admin/reports?page=${page}&limit=${limit}&status=${encodeURIComponent(status)}`,
    { headers: { cookie } },
  );
  return { reports: res.success ? res.data || [] : [], total: res.total ?? 0, page, limit, status };
}

export default function AdminReports({ loaderData }: any) {
  const { reports, total, page, limit, status } = loaderData;
  const { revalidate } = useRevalidator();

  const { run: handleAction } = useAsyncAction(
    async (id: number, action: string) => {
      const res = await apiFetch<{ success: boolean; error_msg?: string }>(
        `/api/v1/admin/reports/${id}/${action}`,
        { method: "POST" },
      );
      return { ...res, action };
    },
    {
      onSuccess: (result) => {
        if (result.success) {
          toast.success(result.action === "confirm" ? "已确认违规" : "已驳回");
          revalidate();
        } else {
          toast.error(result.error_msg || "操作失败");
        }
      },
    },
  );

  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader title="举报队列" description="集中确认用户举报，区分违规内容和误报反馈。" />
        <AdminPanel title="举报记录" description={`当前显示 ${reports.length} / ${total} 条举报记录`} contentClassName="p-4">
          <Form method="get" className="mb-4 flex max-w-xs gap-2">
            <select name="status" defaultValue={status} className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm">
              <option value="pending">待处理</option>
              <option value="confirmed">已确认</option>
              <option value="dismissed">已驳回</option>
            </select>
            <Button type="submit" variant="outline">筛选</Button>
          </Form>
          {reports.length === 0 ? (
            <EmptyState message="暂无举报" />
          ) : (
            <div className="space-y-3">
              {reports.map((r: any) => (
                <div key={r.id} className="rounded-2xl border border-border bg-background p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm">
                <Badge variant="destructive">{r.type}</Badge>
                <span className="text-muted-foreground">{r.reporter_count || 0} 人举报</span>
                <span className="text-muted-foreground">{r.target_type} #{r.target_id}</span>
                  </div>
                  <div className="mb-2 text-sm">
                <a href={r.topic_id ? `/topic/${r.topic_id}` : "#"} className="break-words font-medium text-cnode-ink hover:text-cnode-green">
                  {r.topic_title || "目标内容已不可见"}
                </a>
                {r.target_type === "reply" && <p className="mt-1 break-words text-muted-foreground">{r.target_summary}</p>}
                  </div>
              {r.description && (
                    <p className="mb-3 rounded-xl bg-surface-subtle p-3 text-sm break-words text-muted-foreground">{r.description}</p>
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
          <Pagination page={page} total={total} limit={limit} basePath="/admin/reports" searchParams={{ status }} />
        </AdminPanel>
      </AdminPage>
    </AdminLayout>
  );
}
