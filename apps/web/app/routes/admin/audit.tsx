import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { useState, useEffect } from "react";
import { apiFetch } from "~/lib/api-client";
import { TimeAgo } from "~/components/TimeAgo";
import { AdminPage, AdminPageHeader, AdminPanel } from "~/components/AdminPage";
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

export default function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    apiFetch<{ success: boolean; data: any[] }>("/api/v1/admin/audit?limit=50").then((res) => {
      if (res.success) setLogs(res.data || []);
    });
  }, []);
  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader title="审计日志" description="记录后台关键操作，便于追溯审核和系统变更。" />
        <AdminPanel title="最近操作" description={`显示最近 ${logs.length} 条记录`}>
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>时间</TableHead>
              <TableHead>操作人</TableHead>
              <TableHead>动作</TableHead>
              <TableHead>目标</TableHead>
              <TableHead>结果</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs text-muted-foreground">
                  <TimeAgo date={log.create_at} />
                </TableCell>
                <TableCell>{log.operator}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.target}</TableCell>
                <TableCell className="font-medium text-cnode-ink">{log.result}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </AdminPanel>
      </AdminPage>
    </AdminLayout>
  );
}

export async function loader({ request }: any) {
  await requireAdmin(request);
  return {};
}
