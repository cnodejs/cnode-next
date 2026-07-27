import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { apiFetch } from "~/lib/api-client";
import { TimeAgo } from "~/components/TimeAgo";
import { AdminPage, AdminPageHeader, AdminPanel } from "~/components/AdminPage";
import { Pagination } from "~/components/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

export function meta() {
  return [{ title: "审计日志 · CNode Admin" }];
}

export default function AdminAudit({ loaderData }: any) {
  const { logs, total, page, limit } = loaderData;
  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader title="审计日志" description="记录后台关键操作，便于追溯审核和系统变更。" />
        <AdminPanel title="审计日志" description={`当前显示 ${logs.length} / ${total} 条记录`}>
          <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-32 whitespace-nowrap">时间</TableHead>
              <TableHead className="w-36">操作人</TableHead>
              <TableHead className="w-44">动作</TableHead>
              <TableHead>目标</TableHead>
              <TableHead className="w-28">结果</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log: any) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  <TimeAgo date={log.create_at} />
                </TableCell>
                <TableCell className="break-all">{log.operator}</TableCell>
                <TableCell className="break-all">{log.action}</TableCell>
                <TableCell className="max-w-xl break-words">{log.target}</TableCell>
                <TableCell className="whitespace-nowrap font-medium text-cnode-ink">{log.result}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
          </div>
          <div className="px-4 pb-4">
            <Pagination page={page} total={total} limit={limit} basePath="/admin/audit" />
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
  const res = await apiFetch<{ success: boolean; data: any[]; total?: number }>(
    `/api/v1/admin/audit?page=${page}&limit=${limit}`,
    { headers: { cookie } },
  );
  return { logs: res.success ? res.data || [] : [], total: res.total ?? 0, page, limit };
}
