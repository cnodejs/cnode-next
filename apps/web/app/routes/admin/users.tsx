import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { apiFetch } from "~/lib/api-client";
import { useState } from "react";
import { Form, Link, useRevalidator } from "react-router";
import { toast } from "sonner";
import { useAsyncAction } from "~/hooks/use-async-action";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export function meta() {
  return [{ title: "用户管理 · CNode Admin" }];
}

export const USER_MANAGEMENT_GROUP_LABELS = {
  governance: "用户治理",
  roles: "角色权限",
  security: "账号安全",
  danger: "危险操作",
} as const;

export function userBlockActionLabel(isBlocked: boolean) {
  return isBlocked ? "恢复用户内容" : "屏蔽用户内容";
}

export async function loader({ request }: any) {
  const currentUser = await requireAdmin(request);
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
  return { users: res.success ? res.data || [] : [], total: res.total ?? 0, page, limit, q, currentUser };
}

export default function AdminUsers({ loaderData }: any) {
  const { users: initialUsers, total, page, limit, q, currentUser } = loaderData;
  const [users] = useState<any[]>(initialUsers);
  const [resetTarget, setResetTarget] = useState<{ id: number; loginname: string } | null>(null);
  const [deleteAllTarget, setDeleteAllTarget] = useState<string | null>(null);
  const { revalidate } = useRevalidator();

  const handleBlock = async (name: string, block: boolean) => {
    const res = await apiFetch<{ success: boolean; error_msg?: string }>(
      `/api/v1/user/${name}/${block ? "block" : "unblock"}`,
      { method: "POST" },
    );
    if (res.success) {
      toast.success(block ? "已屏蔽用户内容" : "已恢复用户内容");
      revalidate();
    } else {
      toast.error(res.error_msg || "操作失败");
    }
  };

  const handleMute = async (name: string, mute: boolean) => {
    const res = await apiFetch<{ success: boolean; error_msg?: string }>(
      `/api/v1/user/${name}/${mute ? "mute" : "unmute"}`,
      { method: "POST" },
    );
    if (res.success) {
      toast.success(mute ? "已禁言" : "已解除禁言");
      revalidate();
    } else {
      toast.error(res.error_msg || "操作失败");
    }
  };

  const handleRole = async (userId: number, role: "moderator" | "recruiter", enabled: boolean) => {
    const roleLabel = role === "moderator" ? "版主" : "猎头";
    if (!window.confirm(`确认${enabled ? "授予" : "撤销"}${roleLabel}角色？`)) return;
    const res = await apiFetch<{ success: boolean; error_msg?: string }>(
      enabled ? `/api/v1/admin/users/${userId}/roles` : `/api/v1/admin/users/${userId}/roles/${role}`,
      {
        method: enabled ? "POST" : "DELETE",
        ...(enabled ? { body: JSON.stringify({ role }) } : {}),
      },
    );
    if (res.success) {
      toast.success(enabled ? "角色已授予" : "角色已撤销");
      revalidate();
    } else {
      toast.error(res.error_msg || "角色操作失败");
    }
  };

  const { run: runDeleteAll, pending: deletingAll } = useAsyncAction(
    () =>
      apiFetch<{ success: boolean; error_msg?: string }>(
        `/api/v1/user/${deleteAllTarget}/delete_all`,
        { method: "POST" },
      ),
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success("已删除该用户所有发言");
          setDeleteAllTarget(null);
          revalidate();
        } else {
          toast.error(res.error_msg || "删除失败");
        }
      },
    },
  );

  const handleDeleteAll = () => {
    if (!deleteAllTarget) return;
    runDeleteAll();
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
        <AdminPageHeader title="用户管理" description="查看社区用户状态，执行内容屏蔽、禁言、密码重置和清理操作。" />
        <AdminPanel title="用户列表" description={`当前显示 ${users.length} / ${total} 个用户`}>
          <AdminToolbar>
            <Form method="get" className="flex w-full gap-2 sm:max-w-md">
              <Input name="q" defaultValue={q} placeholder="搜索用户名/邮箱" className="flex-1" />
              <Button type="submit" variant="outline">搜索</Button>
            </Form>
          </AdminToolbar>
          <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead>用户</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>角色</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const isSelf = currentUser?.loginname === u.loginname || String(currentUser?.id || "") === String(u.id);
              return (
              <TableRow key={u.id}>
                <TableCell className="max-w-md break-all">
                  <Link to={`/user/${u.loginname}`} className="font-medium text-primary hover:underline">
                    {u.loginname}
                  </Link>
                  <div className="mt-1 text-xs text-muted-foreground">{u.email}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {u.is_block && <Badge variant="destructive">内容已屏蔽</Badge>}
                    {u.is_muted && <Badge variant="destructive">禁言</Badge>}
                    {!u.is_block && !u.is_muted && <Badge variant="success">正常</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(u.roles || []).includes("moderator") && <Badge variant="secondary">版主</Badge>}
                    {(u.roles || []).includes("recruiter") && <Badge variant="secondary">猎头</Badge>}
                    {!(u.roles || []).length && <span className="text-xs text-muted-foreground">无</span>}
                  </div>
                </TableCell>
                <TableCell className="w-36 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/user/${u.loginname}`}>查看</Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">管理</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>{USER_MANAGEMENT_GROUP_LABELS.governance}</DropdownMenuLabel>
                        <DropdownMenuItem disabled={isSelf} onSelect={() => handleBlock(u.loginname, !u.is_block)}>
                          {userBlockActionLabel(u.is_block)}
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={isSelf} onSelect={() => handleMute(u.loginname, !u.is_muted)}>
                          {u.is_muted ? "解除禁言" : "禁言"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>{USER_MANAGEMENT_GROUP_LABELS.roles}</DropdownMenuLabel>
                        <DropdownMenuItem disabled={isSelf} onSelect={() => handleRole(u.id, "moderator", !(u.roles || []).includes("moderator"))}>
                          {(u.roles || []).includes("moderator") ? "撤销版主" : "授予版主"}
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={isSelf} onSelect={() => handleRole(u.id, "recruiter", !(u.roles || []).includes("recruiter"))}>
                          {(u.roles || []).includes("recruiter") ? "撤销猎头" : "授予猎头"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>{USER_MANAGEMENT_GROUP_LABELS.security}</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => setResetTarget({ id: u.id, loginname: u.loginname })}>
                          重置密码
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>{USER_MANAGEMENT_GROUP_LABELS.danger}</DropdownMenuLabel>
                        <DropdownMenuItem disabled={isSelf} className="text-destructive focus:text-destructive" onSelect={() => setDeleteAllTarget(u.loginname)}>
                          删除所有发言
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );})}
          </TableBody>
          </Table>
          </div>
          <div className="px-4 pb-4">
            <Pagination page={page} total={total} limit={limit} basePath="/admin/users" searchParams={{ ...(q ? { q } : {}) }} />
          </div>
          <Dialog open={!!deleteAllTarget} onOpenChange={(open) => !deletingAll && !open && setDeleteAllTarget(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>确认删除用户所有发言</DialogTitle>
                <DialogDescription>
                  将删除 {deleteAllTarget} 的所有话题和回复，此操作会写入审计日志。请确认目标用户无误。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDeleteAllTarget(null)} disabled={deletingAll}>
                  取消
                </Button>
                <Button type="button" variant="destructive" onClick={handleDeleteAll} disabled={deletingAll}>
                  {deletingAll ? "删除中" : "确认删除所有发言"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
