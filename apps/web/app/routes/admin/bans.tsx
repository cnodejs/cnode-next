import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { apiFetch } from "~/lib/api-client";
import { Link, useRevalidator } from "react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAsyncAction } from "~/hooks/use-async-action";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
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

export function meta() {
  return [{ title: "封禁管理 · CNode Admin" }];
}

export type UserGovernanceStatus = "muted" | "blocked";

export const USER_GOVERNANCE_STATUS_LABELS: Record<UserGovernanceStatus, string> = {
  muted: "禁言用户",
  blocked: "内容已屏蔽用户",
};

export function userGovernanceActionLabel(status: UserGovernanceStatus) {
  return status === "muted" ? "解除禁言" : "恢复内容可见";
}

function userGovernanceApiAction(status: UserGovernanceStatus) {
  return status === "muted" ? "unmute" : "unblock";
}

export async function loader({ request }: any) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Number(url.searchParams.get("limit")) || 50);
  const tab = url.searchParams.get("tab") || "users";
  const userStatus: UserGovernanceStatus = url.searchParams.get("status") === "blocked" ? "blocked" : "muted";
  const cookie = request.headers.get("cookie") || "";
  const userParams = new URLSearchParams({ page: String(page), limit: String(limit), status: userStatus });
  const [usersRes, ipsRes] = await Promise.all([
    apiFetch<{ success: boolean; data: any[]; total?: number }>(`/api/v1/admin/bans/users?${userParams.toString()}`, {
      headers: { cookie },
    }),
    apiFetch<{ success: boolean; data: any[]; total?: number }>(`/api/v1/admin/bans/ips?page=${page}&limit=${limit}`, { headers: { cookie } }),
  ]);
  return {
    bannedUsers: usersRes.success ? usersRes.data || [] : [],
    bannedUsersTotal: usersRes.total ?? 0,
    bannedIps: ipsRes.success ? ipsRes.data || [] : [],
    bannedIpsTotal: ipsRes.total ?? 0,
    page,
    limit,
    tab,
    userStatus,
  };
}

export default function AdminBans({ loaderData }: any) {
  const { bannedUsers, bannedUsersTotal, bannedIps, bannedIpsTotal, page, limit, tab } = loaderData;
  const userStatus = loaderData.userStatus as UserGovernanceStatus;
  const { revalidate } = useRevalidator();
  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  useEffect(() => {
    setSelectedUserIds([]);
  }, [page, userStatus]);

  const currentUserIds = bannedUsers.map((user: any) => Number(user.id));
  const selectedCurrentUserIds = selectedUserIds.filter((id) => currentUserIds.includes(id));
  const allCurrentUsersSelected = currentUserIds.length > 0 && selectedCurrentUserIds.length === currentUserIds.length;
  const userAction = userGovernanceApiAction(userStatus);
  const userActionLabel = userGovernanceActionLabel(userStatus);
  const userStatusLabel = USER_GOVERNANCE_STATUS_LABELS[userStatus];

  const toggleUserSelection = (id: number, checked: boolean) => {
    setSelectedUserIds((ids) => checked ? Array.from(new Set([...ids, id])) : ids.filter((item) => item !== id));
  };

  const toggleAllCurrentUsers = (checked: boolean) => {
    setSelectedUserIds((ids) => checked ? Array.from(new Set([...ids, ...currentUserIds])) : ids.filter((id) => !currentUserIds.includes(id)));
  };

  const { run: handleSingleUserGovernance } = useAsyncAction(
    async (name: string) => {
      const res = await apiFetch<{ success: boolean; error_msg?: string }>(`/api/v1/user/${name}/${userAction}`, { method: "POST" });
      return { ...res, name };
    },
    {
      onSuccess: (result) => {
        if (result.success) {
          toast.success(`已${userActionLabel} ${result.name}`);
          revalidate();
        } else {
          toast.error(result.error_msg || `${userActionLabel}失败`);
        }
      },
    },
  );

  const { run: handleBulkUserGovernance, pending: bulkUserPending } = useAsyncAction(
    async () => {
      const res = await apiFetch<{ success: boolean; error_msg?: string; processed?: number; skipped_ids?: number[] }>("/api/v1/admin/users/bulk-governance", {
        method: "POST",
        body: JSON.stringify({ action: userAction, ids: selectedCurrentUserIds }),
      });
      return res;
    },
    {
      onSuccess: (result) => {
        if (result.success) {
          const skipped = result.skipped_ids?.length || 0;
          toast.success(`已${userActionLabel} ${result.processed || 0} 个用户`, skipped ? { description: `已跳过 ${skipped} 个目标` } : undefined);
          setSelectedUserIds([]);
          revalidate();
        } else {
          toast.error(result.error_msg || `批量${userActionLabel}失败`);
        }
      },
    },
  );

  const { run: handleAddIp, pending: savingIp } = useAsyncAction(
    () =>
      apiFetch<{ success: boolean; error_msg?: string }>("/api/v1/admin/bans/ips", {
        method: "POST",
        body: JSON.stringify({ ip, reason }),
      }),
    {
      successMessage: "IP 规则已添加",
      onSuccess: () => {
        setIp("");
        setReason("");
        revalidate();
      },
    },
  );

  const { run: handleRemoveIp } = useAsyncAction(
    (id: number) =>
      apiFetch<{ success: boolean; error_msg?: string }>(`/api/v1/admin/bans/ips/${id}`, {
        method: "DELETE",
      }).catch(() => ({ success: false, error_msg: "移除失败" })),
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success("IP 规则已移除");
          revalidate();
        } else {
          toast.error(res.error_msg || "移除失败");
        }
      },
    },
  );

  return (
    <AdminLayout>
      <AdminPage>
      <AdminPageHeader title="封禁管理" description="管理用户禁言、内容屏蔽和 IP 风控规则，保持社区秩序。" />
      <Tabs defaultValue={tab} className="space-y-4">
        <TabsList className="bg-card shadow-card">
          <TabsTrigger value="users">用户治理</TabsTrigger>
          <TabsTrigger value="ips">IP 封禁</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <AdminPanel title={userStatusLabel} description={`当前显示 ${bannedUsers.length} / ${bannedUsersTotal} 个${userStatusLabel}`}>
            <AdminToolbar>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <Button asChild size="sm" variant={userStatus === "muted" ? "default" : "outline"}>
                    <Link to={`/admin/bans?tab=users&status=muted&limit=${limit}`}>禁言用户</Link>
                  </Button>
                  <Button asChild size="sm" variant={userStatus === "blocked" ? "default" : "outline"}>
                    <Link to={`/admin/bans?tab=users&status=blocked&limit=${limit}`}>内容已屏蔽用户</Link>
                  </Button>
                </div>
                <Button size="sm" onClick={handleBulkUserGovernance} disabled={bulkUserPending || selectedCurrentUserIds.length === 0}>
                  {bulkUserPending ? "处理中" : `批量${userActionLabel} (${selectedCurrentUserIds.length})`}
                </Button>
              </div>
            </AdminToolbar>
            <div className="overflow-x-auto">
            <Table className="min-w-[680px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={allCurrentUsersSelected} onCheckedChange={(checked) => toggleAllCurrentUsers(checked === true)} aria-label={`选择当前页${userStatusLabel}`} />
                  </TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bannedUsers.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Checkbox checked={selectedUserIds.includes(Number(u.id))} onCheckedChange={(checked) => toggleUserSelection(Number(u.id), checked === true)} aria-label={`选择 ${u.loginname}`} />
                    </TableCell>
                    <TableCell>{u.loginname}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.is_muted && <Badge variant="destructive">禁言</Badge>}
                        {u.is_block && <Badge variant="destructive">内容已屏蔽</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleSingleUserGovernance(u.loginname)}>
                        {userActionLabel}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {bannedUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      暂无{userStatusLabel}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
            <div className="px-4 pb-4">
              <Pagination page={page} total={bannedUsersTotal} limit={limit} basePath="/admin/bans" searchParams={{ tab: "users", status: userStatus }} />
            </div>
          </AdminPanel>
        </TabsContent>
        <TabsContent value="ips">
          <AdminPanel title="IP 封禁" description={`当前显示 ${bannedIps.length} / ${bannedIpsTotal} 条 IP 规则`}>
            <AdminToolbar>
              <Input value={ip} onChange={(event) => setIp(event.target.value)} placeholder="IP 或 CIDR (如 1.2.3.4 或 1.2.3.0/24)" className="w-full sm:max-w-md" />
              <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="原因" className="w-full sm:max-w-sm" />
              <Button onClick={handleAddIp} disabled={savingIp || !ip.trim()}>
                {savingIp ? "添加中" : "添加"}
              </Button>
            </AdminToolbar>
            <div className="overflow-x-auto">
            <Table className="min-w-[680px]">
              <TableHeader>
                <TableRow>
                  <TableHead>IP/段</TableHead>
                  <TableHead>原因</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bannedIps.map((ip: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="break-all">{ip.ip}</TableCell>
                    <TableCell className="break-words text-muted-foreground">{ip.reason}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleRemoveIp(ip.id)}>
                        移除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            <div className="px-4 pb-4">
              <Pagination page={page} total={bannedIpsTotal} limit={limit} basePath="/admin/bans" searchParams={{ tab: "ips" }} />
            </div>
          </AdminPanel>
        </TabsContent>
      </Tabs>
      </AdminPage>
    </AdminLayout>
  );
}
