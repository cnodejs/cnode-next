import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { apiFetch } from "~/lib/api-client";
import { Link, useRevalidator } from "react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAsyncAction } from "~/hooks/use-async-action";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { EmptyState } from "~/components/EmptyState";
import { AdminPage, AdminPageHeader, AdminPanel } from "~/components/AdminPage";
import { Pagination } from "~/components/Pagination";
import { ConfirmationDialog } from "~/components/ConfirmationDialog";

export function meta() {
  return [{ title: "巡检结果 · CNode Admin" }];
}

export async function loader({ request }: any) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Number(url.searchParams.get("limit")) || 50);
  const status = url.searchParams.get("status") || "pending";
  const type = url.searchParams.get("type") || "";
  const jobId = Math.max(0, Number(url.searchParams.get("job_id")) || 0);
  const cookie = request.headers.get("cookie") || "";
  const params = new URLSearchParams({ page: String(page), limit: String(limit), status });
  if (type) params.set("type", type);
  if (jobId > 0) params.set("job_id", String(jobId));
  const [res, jobsRes] = await Promise.all([
    apiFetch<{ success: boolean; data: any[]; total?: number; summary?: any }>(`/api/v1/admin/moderation?${params.toString()}`, { headers: { cookie } }),
    apiFetch<{ success: boolean; data: any[] }>("/api/v1/admin/moderation/jobs", { headers: { cookie } }),
  ]);
  return { results: res.success ? res.data || [] : [], total: res.total ?? 0, summary: res.summary || {}, jobs: jobsRes.success ? jobsRes.data || [] : [], page, limit, status, type, jobId };
}

export default function AdminMod({ loaderData }: any) {
  const { results, total, summary, jobs, page, limit, status, type, jobId } = loaderData;
  const [selected, setSelected] = useState<number[]>([]);
  const [cancelJobId, setCancelJobId] = useState<number | null>(null);
  const [confirmJobId, setConfirmJobId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ ids: number[]; label: string } | null>(null);
  const cancelJobFinalFocusRef = useRef<HTMLElement | null>(null);
  const confirmJobFinalFocusRef = useRef<HTMLElement | null>(null);
  const deleteFinalFocusRef = useRef<HTMLElement | null>(null);
  const { revalidate } = useRevalidator();

  const toggleSelect = (id: number) => {
    setSelected(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  };

  const { run: handleAction, pending: actionPending } = useAsyncAction(
    (id: number, action: string) =>
      apiFetch<{ success: boolean; error_msg?: string }>(`/api/v1/admin/moderation/${id}/${action}`, { method: "POST" }),
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success("操作成功");
          setDeleteTarget(null);
          revalidate();
        } else {
          toast.error(res.error_msg || "操作失败");
        }
      },
    },
  );

  const { run: runBulkAction, pending: bulkPending } = useAsyncAction(
    (action: string) =>
      apiFetch<{ success: boolean; error_msg?: string; handled?: number }>("/api/v1/admin/moderation/bulk", {
        method: "POST",
        body: JSON.stringify({ ids: selected, action }),
      }),
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success(`已处理 ${res.handled || selected.length} 条`);
          setSelected([]);
          setDeleteTarget(null);
          revalidate();
        } else {
          toast.error(res.error_msg || "批量操作失败");
        }
      },
    },
  );

  const { run: runJobBulkConfirm, pending: jobBulkPending } = useAsyncAction(
    (id: number) =>
      apiFetch<{ success: boolean; error_msg?: string; handled?: number }>("/api/v1/admin/moderation/bulk", {
        method: "POST",
        body: JSON.stringify({ job_id: id, action: "confirm" }),
      }),
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success(`已确认删除 ${res.handled || 0} 条命中内容`);
          setConfirmJobId(null);
          setSelected([]);
          revalidate();
        } else {
          toast.error(res.error_msg || "任务批量确认删除失败");
        }
      },
    },
  );

  const handleBulkAction = (action: string) => {
    if (selected.length === 0) return;
    runBulkAction(action);
  };

  const { run: createJob, pending: creatingJob } = useAsyncAction(
    (scope: string) =>
      apiFetch<{ success: boolean; error_msg?: string }>("/api/v1/admin/moderation/jobs", {
        method: "POST",
        body: JSON.stringify({ scope, mode: "historical" }),
      }),
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success("扫描任务已创建");
          revalidate();
        } else {
          toast.error(res.error_msg || "创建任务失败");
        }
      },
    },
  );

  const { run: updateJob, pending: jobPending } = useAsyncAction(
    async (id: number, action: string) => {
      const res = await apiFetch<{ success: boolean; error_msg?: string }>(`/api/v1/admin/moderation/jobs/${id}/${action}`, { method: "POST" });
      return { ...res, action };
    },
    {
      onSuccess: (result) => {
        if (result.success) {
          toast.success(result.action === "run" ? "已触发立即执行" : result.action === "cancel" ? "任务已取消" : "任务已更新");
          if (result.action === "cancel") setCancelJobId(null);
          revalidate();
        } else {
          toast.error(result.error_msg || "更新任务失败");
        }
      },
    },
  );

  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader title="巡检结果" description="处理敏感词和自动审核命中的内容，保留人工复核入口。" />
        <AdminPanel
          title="扫描任务"
          description={`共 ${jobs.length} 个任务`}
          action={
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={creatingJob} onClick={() => createJob("topics")}>扫描话题</Button>
              <Button size="sm" variant="outline" disabled={creatingJob} onClick={() => createJob("replies")}>扫描回复</Button>
              <Button size="sm" disabled={creatingJob} onClick={() => createJob("all")}>{creatingJob ? "创建中" : "扫描全部"}</Button>
            </div>
          }
        >
          {jobs.length === 0 ? (
            <EmptyState message="暂无扫描任务" />
          ) : (
            <div className="flex flex-col gap-3">
              {jobs.map((job: any) => (
                <div key={job.id} className="rounded-lg bg-surface-subtle p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="font-medium">任务 #{job.id}</div>
                      <div className="break-words text-muted-foreground">
                        {job.scope} · {job.mode} · {job.reason} · {job.status}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        render={<Link to={`/admin/moderation?status=${encodeURIComponent(status)}${type ? `&type=${encodeURIComponent(type)}` : ""}&job_id=${job.id}`} />}
                        size="sm"
                        variant={jobId === job.id ? "default" : "outline"}
                      >
                        查看命中
                      </Button>
                      {(job.pendingHitCount || 0) > 0 ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(event) => {
                            confirmJobFinalFocusRef.current = event.currentTarget;
                            setConfirmJobId(job.id);
                          }}
                        >批量确认删除</Button>
                      ) : null}
                      {job.status === "running" ? <Button size="sm" variant="outline" onClick={() => updateJob(job.id, "pause")}>暂停</Button> : null}
                      {job.status === "paused" || job.status === "failed" ? <Button size="sm" variant="outline" onClick={() => updateJob(job.id, "resume")}>恢复</Button> : null}
                      {job.status === "pending" || job.status === "paused" ? (
                        <Button size="sm" variant="outline" onClick={() => updateJob(job.id, "run")} disabled={jobPending}>立即执行</Button>
                      ) : null}
                      {["pending", "paused", "running"].includes(job.status) ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(event) => {
                            cancelJobFinalFocusRef.current = event.currentTarget;
                            setCancelJobId(job.id);
                          }}
                          disabled={jobPending}
                        >取消</Button>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-muted-foreground sm:grid-cols-4">
                    <span>已扫描 {job.scannedCount || 0}</span>
                    <span>命中 {job.hitCount || 0}</span>
                    <span>待处理 {job.pendingHitCount || 0}</span>
                    <span>topic cursor {job.cursorTopicId || 0}</span>
                    <span>reply cursor {job.cursorReplyId || 0}</span>
                  </div>
                  {job.error ? <div className="mt-2 break-words text-destructive">{job.error}</div> : null}
                </div>
              ))}
            </div>
          )}
          <ConfirmationDialog
            open={cancelJobId !== null}
            onOpenChange={(open) => !open && setCancelJobId(null)}
            title="确认取消巡检任务"
            description={<>取消任务 #{cancelJobId} 后将停止继续扫描；已经生成的巡检命中记录会保留。</>}
            confirmLabel="确认取消任务"
            pendingLabel="取消中"
            pending={jobPending}
            finalFocus={cancelJobFinalFocusRef}
            onConfirm={() => cancelJobId && updateJob(cancelJobId, "cancel")}
          />
          <ConfirmationDialog
            open={confirmJobId !== null}
            onOpenChange={(open) => !open && setConfirmJobId(null)}
            title="确认批量删除巡检命中的原始内容"
            description={<>将确认删除任务 #{confirmJobId} 下所有待处理命中的原始话题或回复。该操作会沿用现有软删除、计数器维护和处罚逻辑，不会从数据库物理删除内容。</>}
            confirmLabel={`确认删除任务 #${confirmJobId} 的待处理命中`}
            pending={jobBulkPending}
            finalFocus={confirmJobFinalFocusRef}
            onConfirm={() => confirmJobId && runJobBulkConfirm(confirmJobId)}
          />
        </AdminPanel>
        <AdminPanel title={jobId > 0 ? `任务 #${jobId} 待复核内容` : "待复核内容"} description={`当前页 ${results.length} 条 / 共 ${total} 条`} action={jobId > 0 ? <Button render={<Link to="/admin/moderation" />} size="sm" variant="outline">查看全部</Button> : null}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-subtle p-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">话题 {summary.by_type?.topic || 0}</Badge>
              <Badge variant="outline">回复 {summary.by_type?.reply || 0}</Badge>
              {Object.entries(summary.by_keyword || {}).slice(0, 6).map(([keyword, count]) => (
                <Badge key={String(keyword)} variant="secondary">{String(keyword)}: {String(count)}</Badge>
              ))}
            </div>
            {selected.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">已选 {selected.length} 条</span>
                <Button size="sm" variant="outline" disabled={bulkPending} onClick={() => handleBulkAction("ignore")}>批量忽略</Button>
                <Button size="sm" variant="outline" disabled={bulkPending} onClick={() => handleBulkAction("falsepositive")}>批量误报</Button>
                <Button size="sm" variant="destructive" onClick={(event) => {
                  deleteFinalFocusRef.current = event.currentTarget;
                  setDeleteTarget({ ids: selected, label: `${selected.length} 条巡检命中` });
                }}>删除选中</Button>
              </div>
            ) : null}
          </div>
          {results.length === 0 ? (
            <EmptyState message="暂无巡检结果" />
          ) : (
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  aria-label="选择当前页全部巡检记录"
                  checked={selected.length === results.length && results.length > 0}
                  onCheckedChange={(checked) => setSelected(checked ? results.map((r: any) => r.id) : [])}
                />
                选择当前页全部记录
              </label>
              {results.map((r: any) => (
                <div key={r.id} className="rounded-lg bg-surface-subtle p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox
                      aria-label={`选择巡检记录 ${r.id}`}
                      checked={selected.includes(r.id)}
                      onCheckedChange={() => toggleSelect(r.id)}
                    />
                    {r.scan_job_id ? <span>任务 #{r.scan_job_id}</span> : null}
                    <span>{r.type === "topic" ? "话题" : "回复"} #{r.target_id}</span>
                    <span>字段 {r.field || "content"}</span>
                    <span>巡检时间 {r.scanned_at}</span>
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
                  <div className="mb-3 rounded-xl bg-surface-subtle p-3 text-sm break-words text-muted-foreground">
                    {r.preview}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="destructive" onClick={(event) => {
                      deleteFinalFocusRef.current = event.currentTarget;
                      setDeleteTarget({ ids: [r.id], label: `${r.type === "topic" ? "话题" : "回复"} #${r.target_id}` });
                    }}>确认删除</Button>
                    <Button size="sm" variant="outline" disabled={actionPending} onClick={() => handleAction(r.id, "ignore")}>忽略</Button>
                    <Button size="sm" variant="ghost" disabled={actionPending} onClick={() => handleAction(r.id, "falsepositive")}>标记误报</Button>
                  </div>
                </div>
              ))}
              <Pagination page={page} total={total} limit={limit} basePath="/admin/moderation" searchParams={{ status, ...(type ? { type } : {}), ...(jobId > 0 ? { job_id: String(jobId) } : {}) }} />
            </div>
          )}
          <ConfirmationDialog
            open={deleteTarget !== null}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            title="确认违规并删除命中内容"
            description={<>将确认 {deleteTarget?.label} 违规并软删除对应原始内容。该操作会更新计数和处罚记录。</>}
            confirmLabel={`确认删除 ${deleteTarget?.ids.length || 0} 条内容`}
            pending={deleteTarget?.ids.length === 1 ? actionPending : bulkPending}
            finalFocus={deleteFinalFocusRef}
            onConfirm={() => {
              if (!deleteTarget) return;
              if (deleteTarget.ids.length === 1) handleAction(deleteTarget.ids[0], "confirm");
              else runBulkAction("confirm");
            }}
          />
        </AdminPanel>
      </AdminPage>
    </AdminLayout>
  );
}
