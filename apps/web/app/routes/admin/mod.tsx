import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { apiFetch } from "~/lib/api-client";
import { Link, useRevalidator } from "react-router";
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
  const [res, jobsRes] = await Promise.all([
    apiFetch<{ success: boolean; data: any[] }>("/api/v1/admin/moderation", { headers: { cookie } }),
    apiFetch<{ success: boolean; data: any[] }>("/api/v1/admin/moderation/jobs", { headers: { cookie } }),
  ]);
  return { results: res.success ? res.data || [] : [], jobs: jobsRes.success ? jobsRes.data || [] : [] };
}

export default function AdminMod({ loaderData }: any) {
  const { results, jobs } = loaderData;
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

  const createJob = async (scope: string) => {
    const res = await apiFetch<{ success: boolean; error_msg?: string }>("/api/v1/admin/moderation/jobs", {
      method: "POST",
      body: JSON.stringify({ scope, mode: "historical" }),
    });
    if (res.success) {
      toast.success("扫描任务已创建");
      revalidate();
    } else {
      toast.error(res.error_msg || "创建任务失败");
    }
  };

  const updateJob = async (id: number, action: string) => {
    const res = await apiFetch<{ success: boolean; error_msg?: string }>(
      `/api/v1/admin/moderation/jobs/${id}/${action}`,
      { method: "POST" },
    );
    if (res.success) {
      toast.success("任务已更新");
      revalidate();
    } else {
      toast.error(res.error_msg || "更新任务失败");
    }
  };

  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader title="巡检结果" description="处理敏感词和自动审核命中的内容，保留人工复核入口。" />
        <AdminPanel
          title="扫描任务"
          description={`共 ${jobs.length} 个任务`}
          action={
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => createJob("topics")}>扫描话题</Button>
              <Button size="sm" variant="outline" onClick={() => createJob("replies")}>扫描回复</Button>
              <Button size="sm" onClick={() => createJob("all")}>扫描全部</Button>
            </div>
          }
          contentClassName="p-4"
        >
          {jobs.length === 0 ? (
            <EmptyState message="暂无扫描任务" />
          ) : (
            <div className="space-y-3">
              {jobs.map((job: any) => (
                <div key={job.id} className="rounded-2xl border border-border bg-background p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-medium">任务 #{job.id}</div>
                      <div className="text-muted-foreground">
                        {job.scope} · {job.mode} · {job.reason} · {job.status}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {job.status === "running" ? <Button size="sm" variant="outline" onClick={() => updateJob(job.id, "pause")}>暂停</Button> : null}
                      {job.status === "paused" || job.status === "failed" ? <Button size="sm" variant="outline" onClick={() => updateJob(job.id, "resume")}>恢复</Button> : null}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-muted-foreground sm:grid-cols-4">
                    <span>已扫描 {job.scannedCount || 0}</span>
                    <span>命中 {job.hitCount || 0}</span>
                    <span>topic cursor {job.cursorTopicId || 0}</span>
                    <span>reply cursor {job.cursorReplyId || 0}</span>
                  </div>
                  {job.error ? <div className="mt-2 text-destructive">{job.error}</div> : null}
                </div>
              ))}
            </div>
          )}
        </AdminPanel>
        <AdminPanel title="待复核内容" description={`共 ${results.length} 条巡检记录`} contentClassName="p-4">
          {results.length === 0 ? (
            <EmptyState message="暂无巡检结果" />
          ) : (
            <div className="space-y-3">
              {results.map((r: any) => (
                <div key={r.id} className="rounded-2xl border border-border bg-background p-4">
                  <div className="mb-2 text-sm text-muted-foreground">
                    {r.type === "topic" ? "话题" : "回复"} #{r.target_id} · 字段 {r.field || "content"} · 巡检时间 {r.scanned_at}
                  </div>
                  <div className="mb-2 text-sm text-muted-foreground">
                    所属话题: <Link className="text-cnode-green hover:underline" to={`/topic/${r.topic_id || r.target_id}`}>#{r.topic_id || r.target_id}</Link>
                    {r.author_id ? <span> · 作者 ID {r.author_id}</span> : null}
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
                    <Button size="sm" variant="destructive" onClick={() => handleAction(r.id, "confirm")}>确认删除</Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction(r.id, "ignore")}>忽略</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleAction(r.id, "falsepositive")}>标记误报</Button>
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
