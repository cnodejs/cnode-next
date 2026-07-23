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
  return [{ title: "巡检结果 · CNode Admin" }];
}

export async function loader({ request }: any) {
  await requireAdmin(request);
  const cookie = request.headers.get("cookie") || "";
  const res = await apiFetch<{ success: boolean; data: any[] }>("/api/v1/admin/moderation", {
    headers: { cookie },
  });
  return { results: res.success ? res.data || [] : [] };
}

export default function AdminMod({ loaderData }: any) {
  const { results } = loaderData;
  const { revalidate } = useRevalidator();

  const handleAction = async (id: number, action: string) => {
    const res = await apiFetch<{ success: boolean; error_msg?: string }>(
      `/api/v1/admin/moderation/${id}/${action}`,
      { method: "POST" },
    );
    if (res.success) {
      toast.success("操作成功");
      revalidate();
    } else {
      toast.error(res.error_msg || "操作失败");
    }
  };

  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader title="巡检结果" description="处理敏感词和自动审核命中的内容，保留人工复核入口。" />
        <AdminPanel title="待复核内容" description={`共 ${results.length} 条巡检记录`} contentClassName="p-4">
          {results.length === 0 ? (
            <EmptyState message="暂无巡检结果" />
          ) : (
            <div className="space-y-3">
              {results.map((r: any) => (
                <div key={r.id} className="rounded-2xl border border-border bg-background p-4">
                  <div className="mb-2 text-sm text-muted-foreground">
                {r.type === "topic" ? "话题" : "回复"} #{r.target_id} · 巡检时间 {r.scanned_at}
                  </div>
                  <div className="mb-2 text-sm">
                命中敏感词:{" "}
                {r.keywords?.map((kw: string) => (
                  <Badge key={kw} variant="destructive" className="mr-1">
                    {kw}
                  </Badge>
                ))}
                  </div>
                  <div className="mb-3 rounded-xl bg-surface-subtle p-3 text-sm text-muted-foreground">
                {r.preview}
                  </div>
                  <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => handleAction(r.id, "restore")}>
                  恢复显示
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleAction(r.id, "confirm")}
                >
                  确认删除
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAction(r.id, "falsepositive")}
                >
                  标记误报
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
