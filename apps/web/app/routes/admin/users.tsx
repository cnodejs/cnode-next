import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { apiFetch } from "~/lib/api-client";
import { useRef, useState } from "react";
import { Form, Link, useRevalidator } from "react-router";
import { toast } from "sonner";
import { useAsyncAction } from "~/hooks/use-async-action";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { AdminPage, AdminPageHeader, AdminPanel, AdminToolbar } from "~/components/AdminPage";
import { Pagination } from "~/components/Pagination";
import { ConfirmationDialog } from "~/components/ConfirmationDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
  return {
    users: res.success ? res.data || [] : [],
    total: res.total ?? 0,
    page,
    limit,
    q,
    currentUser,
  };
}

export default function AdminUsers({ loaderData }: any) {
  const { users, total, page, limit, q, currentUser } = loaderData;
  const [resetTarget, setResetTarget] = useState<{ id: number; loginname: string } | null>(null);
  const [deleteAllTarget, setDeleteAllTarget] = useState<string | null>(null);
  const [governanceTarget, setGovernanceTarget] = useState<{
    name: string;
    kind: "block" | "mute";
    enabled: boolean;
  } | null>(null);
  const [roleTarget, setRoleTarget] = useState<{
    id: number;
    name: string;
    role: "moderator" | "recruiter";
    enabled: boolean;
    currentRoles: string[];
  } | null>(null);
  const managementTriggerRef = useRef<HTMLElement | null>(null);
  const { revalidate } = useRevalidator();

  const { run: runGovernance, pending: governancePending } = useAsyncAction(
    async () => {
      if (!governanceTarget) return { success: false, error_msg: "未选择用户" };
      const action =
        governanceTarget.kind === "block"
          ? governanceTarget.enabled
            ? "block"
            : "unblock"
          : governanceTarget.enabled
            ? "mute"
            : "unmute";
      return apiFetch<{ success: boolean; error_msg?: string }>(
        `/api/v1/user/${governanceTarget.name}/${action}`,
        { method: "POST" },
      );
    },
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success("用户治理状态已更新");
          setGovernanceTarget(null);
          revalidate();
        } else toast.error(res.error_msg || "操作失败");
      },
    },
  );

  const { run: runRoleChange, pending: rolePending } = useAsyncAction(
    async () => {
      if (!roleTarget) return { success: false, error_msg: "未选择用户" };
      return apiFetch<{ success: boolean; error_msg?: string }>(
        roleTarget.enabled
          ? `/api/v1/admin/users/${roleTarget.id}/roles`
          : `/api/v1/admin/users/${roleTarget.id}/roles/${roleTarget.role}`,
        {
          method: roleTarget.enabled ? "POST" : "DELETE",
          ...(roleTarget.enabled ? { body: JSON.stringify({ role: roleTarget.role }) } : {}),
        },
      );
    },
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success("用户角色已更新");
          setRoleTarget(null);
          revalidate();
        } else toast.error(res.error_msg || "角色操作失败");
      },
    },
  );

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

  const { run: handleResetPass, pending: resetting } = useAsyncAction(
    async () => {
      if (!resetTarget) return { success: false, error_msg: "未选择用户" };
      return apiFetch<{ success: boolean; newPassword?: string; error_msg?: string }>(
        `/api/v1/user/${resetTarget.loginname}/reset_password`,
        { method: "POST" },
      );
    },
    {
      errorMessage: "重置失败，请重试",
      onSuccess: (res) => {
        if (res.success && res.newPassword) {
          toast.success("密码已重置", { description: `新密码: ${res.newPassword}` });
          setResetTarget(null);
        } else {
          toast.error(res.error_msg || "重置失败");
        }
      },
    },
  );

  return (
    <AdminLayout>
      <AdminPage archetype="data-list">
        <AdminPageHeader
          title="用户管理"
          description="查看社区用户状态，执行内容屏蔽、禁言、密码重置和清理操作。"
        />
        <AdminPanel
          title="用户列表"
          description={`当前显示 ${users.length} / ${total} 个用户`}
          flush
        >
          <AdminToolbar>
            <Form method="get" className="flex w-full gap-2 sm:max-w-md">
              <Input name="q" defaultValue={q} placeholder="搜索用户名/邮箱" className="flex-1" />
              <Button type="submit" variant="outline">
                搜索
              </Button>
            </Form>
          </AdminToolbar>
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
              {users.map((u: any) => {
                const isSelf =
                  currentUser?.loginname === u.loginname ||
                  String(currentUser?.id || "") === String(u.id);
                return (
                  <TableRow key={u.id}>
                    <TableCell className="max-w-md break-all">
                      <Link
                        to={`/user/${u.loginname}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {u.loginname}
                      </Link>
                      <div className="mt-1 text-xs text-muted-foreground">{u.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.is_block && <Badge variant="destructive">内容已屏蔽</Badge>}
                        {u.is_muted && <Badge variant="destructive">禁言</Badge>}
                        {!u.is_block && !u.is_muted && <Badge variant="secondary">正常</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(u.roles || []).includes("moderator") && (
                          <Badge variant="secondary">版主</Badge>
                        )}
                        {(u.roles || []).includes("recruiter") && (
                          <Badge variant="secondary">猎头</Badge>
                        )}
                        {!(u.roles || []).length && (
                          <span className="text-xs text-muted-foreground">无</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-36 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          render={<Link to={`/user/${u.loginname}`} />}
                          size="sm"
                          variant="ghost"
                        >
                          查看
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(event) => {
                                  managementTriggerRef.current = event.currentTarget;
                                }}
                              />
                            }
                          >
                            管理
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>
                                {USER_MANAGEMENT_GROUP_LABELS.governance}
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                disabled={isSelf}
                                onClick={() =>
                                  setGovernanceTarget({
                                    name: u.loginname,
                                    kind: "block",
                                    enabled: !u.is_block,
                                  })
                                }
                              >
                                {userBlockActionLabel(u.is_block)}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={isSelf}
                                onClick={() =>
                                  setGovernanceTarget({
                                    name: u.loginname,
                                    kind: "mute",
                                    enabled: !u.is_muted,
                                  })
                                }
                              >
                                {u.is_muted ? "解除禁言" : "禁言"}
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>
                                {USER_MANAGEMENT_GROUP_LABELS.roles}
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                disabled={isSelf}
                                onClick={() =>
                                  setRoleTarget({
                                    id: u.id,
                                    name: u.loginname,
                                    role: "moderator",
                                    enabled: !(u.roles || []).includes("moderator"),
                                    currentRoles: u.roles || [],
                                  })
                                }
                              >
                                {(u.roles || []).includes("moderator") ? "撤销版主" : "授予版主"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={isSelf}
                                onClick={() =>
                                  setRoleTarget({
                                    id: u.id,
                                    name: u.loginname,
                                    role: "recruiter",
                                    enabled: !(u.roles || []).includes("recruiter"),
                                    currentRoles: u.roles || [],
                                  })
                                }
                              >
                                {(u.roles || []).includes("recruiter") ? "撤销猎头" : "授予猎头"}
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>
                                {USER_MANAGEMENT_GROUP_LABELS.security}
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => setResetTarget({ id: u.id, loginname: u.loginname })}
                              >
                                重置密码
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>
                                {USER_MANAGEMENT_GROUP_LABELS.danger}
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                disabled={isSelf}
                                className="text-destructive data-[highlighted]:text-destructive"
                                onClick={() => setDeleteAllTarget(u.loginname)}
                              >
                                删除所有发言
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            total={total}
            limit={limit}
            basePath="/admin/users"
            searchParams={{ ...(q ? { q } : {}) }}
          />
          <ConfirmationDialog
            open={deleteAllTarget !== null}
            onOpenChange={(open) => !open && setDeleteAllTarget(null)}
            title="删除用户所有发言"
            description={
              <>将删除 {deleteAllTarget} 的全部话题和回复并写入审计日志；用户账号本身不会删除。</>
            }
            confirmLabel="确认删除所有发言"
            pendingLabel="删除中"
            pending={deletingAll}
            finalFocus={managementTriggerRef}
            onConfirm={handleDeleteAll}
          />
        </AdminPanel>
      </AdminPage>

      <ConfirmationDialog
        open={governanceTarget !== null}
        onOpenChange={(open) => !open && setGovernanceTarget(null)}
        title={
          governanceTarget?.kind === "block"
            ? governanceTarget.enabled
              ? "屏蔽用户内容"
              : "恢复用户内容可见"
            : governanceTarget?.enabled
              ? "禁言用户"
              : "解除用户禁言"
        }
        description={
          governanceTarget?.kind === "block"
            ? governanceTarget.enabled
              ? `将隐藏 ${governanceTarget.name} 的公开内容；这不等同于禁言，不会单独阻止其发布新内容。`
              : `将恢复 ${governanceTarget.name} 的内容可见性；不会解除禁言或恢复已删除内容。`
            : governanceTarget?.enabled
              ? `将禁止 ${governanceTarget.name} 新增话题和回复；已有内容不会因此自动隐藏。`
              : `将恢复 ${governanceTarget?.name} 新增话题和回复的能力；不会取消内容屏蔽。`
        }
        confirmLabel="确认变更用户状态"
        pending={governancePending}
        destructive={!!governanceTarget?.enabled}
        finalFocus={managementTriggerRef}
        onConfirm={runGovernance}
      />
      <ConfirmationDialog
        open={roleTarget !== null}
        onOpenChange={(open) => !open && setRoleTarget(null)}
        title={roleTarget?.enabled ? "授予用户角色" : "撤销用户角色"}
        description={
          roleTarget
            ? `${roleTarget.name} 当前角色：${roleTarget.currentRoles.join("、") || "无"}。变更后${roleTarget.enabled ? "将拥有" : "将失去"}${roleTarget.role === "moderator" ? "版主内容治理" : "招聘发布"}权限。`
            : ""
        }
        confirmLabel={roleTarget?.enabled ? "确认授予角色" : "确认撤销角色"}
        pending={rolePending}
        destructive={!roleTarget?.enabled}
        finalFocus={managementTriggerRef}
        onConfirm={runRoleChange}
      />
      <ConfirmationDialog
        open={resetTarget !== null}
        onOpenChange={(open) => !open && setResetTarget(null)}
        title="重置用户密码"
        description={
          <>
            将重置用户 {resetTarget?.loginname}{" "}
            的登录凭证；现有密码将立即失效，新凭证仅在成功后显示。
          </>
        }
        confirmLabel="确认重置密码"
        pendingLabel="重置中"
        pending={resetting}
        finalFocus={managementTriggerRef}
        onConfirm={handleResetPass}
      />
    </AdminLayout>
  );
}
