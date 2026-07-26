import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { apiFetch } from "~/lib/api-client";
import { useState } from "react";
import { Form, useRevalidator } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { AdminPage, AdminPageHeader, AdminPanel, AdminToolbar } from "~/components/AdminPage";
import { Pagination } from "~/components/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

export function meta() {
  return [{ title: "用户管理 · CNode Admin" }];
}

export async function loader({ request }: any) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Number(url.searchParams.get("limit")) || 50);
  const q = url.searchParams.get("q") || "";
  const cookie = request.headers.get("cookie") || "";
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) params.set("q", q);
  const res = await apiFetch<{ success: boolean; data: any[]; total?: number }>(
    `/api/v1/admin/users?${params.toString()}`,
    { headers: { cookie } },
  );
  return { users: res.success ? res.data || [] : [], total: res.total ?? 0, page, limit, q };
}

export default function AdminUsers({ loaderData }: any) {
  const { users: initialUsers, total, page, limit, q } = loaderData;
  const [users] = useState<any[]>(initialUsers);
  const [resetTarget, setResetTarget] = useState<{ id: number; loginname: string } | null>(null);
  const { revalidate } = useRevalidator();

  const handleBlock = async (name: string, block: boolean) => {
    const res = await apiFetch<{ success: boolean; error_msg?: string }>(
      `/api/v1/user/${name}/${block ? "block" : "unblock"}`,
      { method: "POST" },
    );
    if (res.success) {
      toast.success(block ? "已禁言" : "已解禁");
      revalidate();
    } else {
      toast.error(res.error_msg || "操作失败");
    }
  };

  const handleDeleteAll = async (name: string) => {
    if (!confirm(`确认删除 ${name} 的所有发言?`)) return;
    const res = await apiFetch<{ success: boolean; error_msg?: string }>(
      `/api/v1/user/${name}/delete_all`,
      { method: "POST" },
    );
    if (res.success) {
      toast.success("已删除该用户所有发言");
      revalidate();
    } else {
      toast.error(res.error_msg || "删除失败");
    }
  };

  const handleResetPass = async () => {
    if (!resetTarget) return;
    const res = await apiFetch<{ success: boolean; newPassword?: string; error_msg?: string }>(
      `/api/v1/user/${resetTarget.loginname}/reset_password`,
      { method: "POST" },
    );
    if (res.success && res.newPassword) {
      toast.success("密码已重置", { description: `新密码: ${res.newPassword}` });
    } else {
      toast.error(res.error_msg || "重置失败");
    }
    setResetTarget(null);
  };

  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader title="用户管理" description="查看社区用户状态，执行禁言、解禁、密码重置和清理操作。" />
        <AdminPanel title="用户列表" description={`当前显示 ${users.length} / ${total} 个用户`}>
          <AdminToolbar>
            <Form method="get" className="flex w-full gap-2 sm:max-w-md">
              <Input name="q" defaultValue={q} placeholder="搜索用户名/邮箱" className="flex-1" />
              <Button type="submit" variant="outline">搜索</Button>
            </Form>
          </AdminToolbar>
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>积分</TableHead>
              <TableHead>话题</TableHead>
              <TableHead>回复</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <a href={`/user/${u.loginname}`} className="text-primary hover:underline">
                    {u.loginname}
                  </a>
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>{u.score}</TableCell>
                <TableCell>{u.topic_count}</TableCell>
                <TableCell>{u.reply_count}</TableCell>
                <TableCell>
                  {u.is_block ? (
                    <Badge variant="destructive">禁言</Badge>
                  ) : (
                    <Badge variant="success">正常</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleBlock(u.loginname, !u.is_block)}
                    >
                      {u.is_block ? "解禁" : "禁言"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setResetTarget({ id: u.id, loginname: u.loginname })}
                    >
                      重置密码
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDeleteAll(u.loginname)}
                    >
                      删除发言
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
          <div className="px-4 pb-4">
            <Pagination page={page} total={total} limit={limit} basePath="/admin/users" searchParams={{ ...(q ? { q } : {}) }} />
          </div>
        </AdminPanel>
      </AdminPage>

      <Dialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>
              确认重置用户 <strong>{resetTarget?.loginname}</strong> 的密码?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              取消
            </Button>
            <Button onClick={handleResetPass}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
