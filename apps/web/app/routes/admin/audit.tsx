import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { apiFetch } from "~/lib/api-client";
import { TimeAgo } from "~/components/TimeAgo";
import { AdminMetricCard, AdminPage, AdminPageHeader, AdminPanel, AdminToolbar } from "~/components/AdminPage";
import { Pagination } from "~/components/Pagination";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Form, Link } from "react-router";

type AuditLog = {
  id: number;
  operator_id: number | null;
  operator_name: string;
  action: string;
  category: string;
  risk: "low" | "medium" | "high" | "critical";
  label: string;
  target_type: string | null;
  target_id: string | null;
  target_name: string | null;
  result: string | null;
  detail: string | null;
  create_at: string;
};

type AuditSummary = {
  high_risk: number;
  content_deletions: number;
  role_changes: number;
  account_security: number;
  failures: number;
};

const categoryLabels: Record<string, string> = {
  content: "内容治理",
  user: "用户治理",
  role: "角色权限",
  account: "账号安全",
  security: "安全策略",
  moderation: "举报巡检",
  system: "系统设置",
};

const riskLabels = { low: "低风险", medium: "中风险", high: "高风险", critical: "极高风险" } as const;

export function meta() {
  return [{ title: "审计中心 · CNode Admin" }];
}

function riskVariant(risk: AuditLog["risk"]) {
  if (risk === "critical") return "destructive";
  if (risk === "high") return "warning";
  if (risk === "medium") return "secondary";
  return "outline";
}

function targetHref(log: AuditLog) {
  if (log.target_type === "user" && log.target_name) return `/user/${log.target_name}`;
  if ((log.target_type === "topic" || log.target_type === "topics") && log.target_id) return `/topic/${log.target_id.split(",")[0]}`;
  if (log.target_type === "report") return "/admin/reports";
  if (log.target_type === "scan_job" || log.target_type === "moderation_hit") return "/admin/moderation";
  return null;
}

function DetailBlock({ detail }: { detail: string | null }) {
  if (!detail) return <span className="text-muted-foreground">无</span>;
  try {
    return <pre className="overflow-auto rounded-xl bg-surface-subtle p-3 text-xs">{JSON.stringify(JSON.parse(detail), null, 2)}</pre>;
  } catch {
    return <pre className="overflow-auto rounded-xl bg-surface-subtle p-3 text-xs whitespace-pre-wrap">{detail}</pre>;
  }
}

export default function AdminAudit({ loaderData }: any) {
  const { logs, total, page, limit, filters, summary } = loaderData as {
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
    filters: Record<string, string>;
    summary: AuditSummary;
  };

  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader title="审计中心" description="追踪后台关键操作、权限变更、内容治理和系统设置变更。" />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <AdminMetricCard label="高风险操作" value={summary.high_risk} />
          <AdminMetricCard label="内容删除" value={summary.content_deletions} />
          <AdminMetricCard label="权限变更" value={summary.role_changes} />
          <AdminMetricCard label="账号安全" value={summary.account_security} />
          <AdminMetricCard label="失败/异常" value={summary.failures} />
        </div>

        <AdminPanel title="审计事件" description={`当前显示 ${logs.length} / ${total} 条记录`}>
          <AdminToolbar>
            <Form method="get" className="grid w-full gap-2 md:grid-cols-4 xl:grid-cols-7">
              <Input type="date" name="date_from" defaultValue={filters.date_from || ""} aria-label="开始日期" />
              <Input type="date" name="date_to" defaultValue={filters.date_to || ""} aria-label="结束日期" />
              <select name="category" defaultValue={filters.category || ""} className="h-9 rounded-xl border border-input bg-card px-3 text-sm">
                <option value="">全部类型</option>
                {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <select name="risk" defaultValue={filters.risk || ""} className="h-9 rounded-xl border border-input bg-card px-3 text-sm">
                <option value="">全部风险</option>
                {Object.entries(riskLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <Input name="operator" defaultValue={filters.operator || ""} placeholder="操作人" />
              <Input name="q" defaultValue={filters.q || ""} placeholder="搜索 action/目标/detail" />
              <Button type="submit" variant="outline">筛选</Button>
            </Form>
          </AdminToolbar>

          <div className="space-y-3 p-4">
            {logs.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">暂无审计记录</div>}
            {logs.map((log) => {
              const href = targetHref(log);
              return (
                <article key={log.id} className="rounded-2xl border border-cnode-green/15 bg-card p-4 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={riskVariant(log.risk)}>{riskLabels[log.risk]}</Badge>
                        <Badge variant="secondary">{categoryLabels[log.category] || log.category}</Badge>
                        <span className="font-semibold text-cnode-ink">{log.label}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {log.operator_name || "system"} · <TimeAgo date={log.create_at} /> · {log.result || "unknown"}
                      </div>
                      <div className="text-sm">
                        目标：{href ? <Link to={href} className="text-primary hover:underline">{log.target_name || log.target_id}</Link> : <span>{log.target_name || log.target_id || "无"}</span>}
                        {log.target_type && <span className="ml-2 text-xs text-muted-foreground">{log.target_type}</span>}
                      </div>
                    </div>
                  </div>

                  <details className="mt-3 rounded-xl bg-surface-subtle p-3 text-sm">
                    <summary className="cursor-pointer font-medium text-cnode-ink">展开原始记录</summary>
                    <div className="mt-3 grid gap-3 lg:grid-cols-[16rem_minmax(0,1fr)]">
                      <dl className="space-y-1 text-xs text-muted-foreground">
                        <div><dt className="inline font-semibold">id: </dt><dd className="inline">{log.id}</dd></div>
                        <div><dt className="inline font-semibold">action: </dt><dd className="inline">{log.action}</dd></div>
                        <div><dt className="inline font-semibold">operator_id: </dt><dd className="inline">{log.operator_id ?? ""}</dd></div>
                        <div><dt className="inline font-semibold">target_type: </dt><dd className="inline">{log.target_type || ""}</dd></div>
                        <div><dt className="inline font-semibold">target_id: </dt><dd className="inline">{log.target_id || ""}</dd></div>
                      </dl>
                      <DetailBlock detail={log.detail} />
                    </div>
                  </details>
                </article>
              );
            })}
          </div>

          <div className="px-4 pb-4">
            <Pagination page={page} total={total} limit={limit} basePath="/admin/audit" searchParams={filters} />
          </div>
        </AdminPanel>
      </AdminPage>
    </AdminLayout>
  );
}

export async function loader({ request }: any) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Number(url.searchParams.get("limit")) || 50);
  const cookie = request.headers.get("cookie") || "";
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const filters: Record<string, string> = {};
  for (const key of ["date_from", "date_to", "operator", "category", "risk", "target_type", "result", "q"]) {
    const value = url.searchParams.get(key)?.trim();
    if (value) {
      params.set(key, value);
      filters[key] = value;
    }
  }
  const res = await apiFetch<{ success: boolean; data: AuditLog[]; total?: number; summary?: AuditSummary }>(
    `/api/v1/admin/audit?${params.toString()}`,
    { headers: { cookie } },
  );
  return {
    logs: res.success ? res.data || [] : [],
    total: res.total ?? 0,
    page,
    limit,
    filters,
    summary: res.summary || { high_risk: 0, content_deletions: 0, role_changes: 0, account_security: 0, failures: 0 },
  };
}
