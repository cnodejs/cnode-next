import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { apiFetch } from "~/lib/api-client";
import { Form, useLocation, useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import { useAsyncAction } from "~/hooks/use-async-action";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { EmptyState } from "~/components/EmptyState";
import { AdminPage, AdminPageHeader, AdminPanel } from "~/components/AdminPage";
import { Pagination } from "~/components/Pagination";
import { NativeSelect } from "~/components/ui/native-select";
import { useRef, useState } from "react";
import { ConfirmationDialog } from "~/components/ConfirmationDialog";
import { previousPageAfterRemoval } from "~/lib/post-mutation-navigation";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemHeader, ItemTitle } from "~/components/ui/item";

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
  const location = useLocation();
  const navigate = useNavigate();
  const [confirmTarget, setConfirmTarget] = useState<any | null>(null);
  const confirmTriggerRef = useRef<HTMLElement | null>(null);

  const { run: handleAction, pending: handling } = useAsyncAction(
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
          if (result.action === "confirm") setConfirmTarget(null);
          const fallback = previousPageAfterRemoval({ pathname: location.pathname, search: location.search, page, currentItemCount: reports.length, removedCount: 1 });
          if (fallback) navigate(fallback, { replace: true });
          else revalidate();
        } else {
          toast.error(result.error_msg || "操作失败");
        }
      },
    },
  );

  return (
    <AdminLayout>
      <AdminPage archetype="workflow">
        <AdminPageHeader title="举报队列" description="集中确认用户举报，区分违规内容和误报反馈。" />
        <AdminPanel title="举报记录" description={`当前显示 ${reports.length} / ${total} 条举报记录`}>
          <Form method="get" className="mb-4 flex max-w-xs gap-2">
            <NativeSelect name="status" defaultValue={status} aria-label="举报状态" className="flex-1">
              <option value="pending">待处理</option>
              <option value="confirmed">已确认</option>
              <option value="dismissed">已驳回</option>
            </NativeSelect>
            <Button type="submit" variant="outline">筛选</Button>
          </Form>
          {reports.length === 0 ? (
            <EmptyState message="暂无举报" />
          ) : (
            <ItemGroup>
              {reports.map((r: any) => (
                <Item key={r.id} variant="outline">
                  <ItemContent>
                    <ItemHeader>
                      <ItemTitle>
                        <Badge variant="destructive">{r.type}</Badge>
                        <a href={r.topic_id ? `/topic/${r.topic_id}` : "#"}>{r.topic_title || "目标内容已不可见"}</a>
                      </ItemTitle>
                    </ItemHeader>
                    <ItemDescription>{r.reporter_count || 0} 人举报 · {r.target_type} #{r.target_id}</ItemDescription>
                    {r.target_type === "reply" && <p className="break-words text-sm text-muted-foreground">{r.target_summary}</p>}
              {r.description && (
                    <p className="border-l-2 pl-3 text-sm break-words text-muted-foreground">{r.description}</p>
              )}
                  </ItemContent>
                  <ItemActions className="basis-full flex-wrap sm:basis-auto">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(event) => {
                    confirmTriggerRef.current = event.currentTarget;
                    setConfirmTarget(r);
                  }}
                >
                  确认违规
                </Button>
                <Button size="sm" variant="outline" disabled={handling} onClick={() => handleAction(r.id, "dismiss")}>
                  {handling ? "处理中" : "驳回"}
                </Button>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          )}
          <ConfirmationDialog
            open={confirmTarget !== null}
            onOpenChange={(open) => !open && setConfirmTarget(null)}
            title="确认违规并删除内容"
            description={<>将确认举报 #{confirmTarget?.id} 违规，并删除{confirmTarget?.target_type === "reply" ? "回复" : "话题"} #{confirmTarget?.target_id}：{confirmTarget?.topic_title || "目标内容"}。</>}
            confirmLabel="确认违规并删除"
            pendingLabel="处理中"
            pending={handling}
            finalFocus={confirmTriggerRef}
            onConfirm={() => confirmTarget && handleAction(confirmTarget.id, "confirm")}
          />
          <Pagination page={page} total={total} limit={limit} basePath="/admin/reports" searchParams={{ status }} />
        </AdminPanel>
      </AdminPage>
    </AdminLayout>
  );
}
