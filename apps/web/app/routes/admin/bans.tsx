import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { apiFetch } from "~/lib/api-client";
import { Link, useLocation, useNavigate, useRevalidator, useSearchParams } from "react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAsyncAction } from "~/hooks/use-async-action";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { AdminPage, AdminPageHeader, AdminPanel, AdminToolbar } from "~/components/AdminPage";
import { Pagination } from "~/components/Pagination";
import { ConfirmationDialog } from "~/components/ConfirmationDialog";
import { previousPageAfterRemoval } from "~/lib/post-mutation-navigation";
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

export function bulkUserGovernanceFeedback(
  actionLabel: string,
  result: { processed?: number; skipped_ids?: number[] },
) {
  const skippedIds = result.skipped_ids || [];
  const processed = result.processed || 0;
  return {
    message: `${actionLabel}结果：成功 ${processed} 个，跳过 ${skippedIds.length} 个，失败 0 个`,
    description: skippedIds.length ? `可重试目标：${skippedIds.join("、")}` : undefined,
  };
}

function userGovernanceApiAction(status: UserGovernanceStatus) {
  return status === "muted" ? "unmute" : "unblock";
}

export async function loader({ request }: any) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Number(url.searchParams.get("limit")) || 50);
  const tab = url.searchParams.get("tab") === "ips" ? "ips" : "users";
  const userStatus: UserGovernanceStatus =
    url.searchParams.get("status") === "blocked" ? "blocked" : "muted";
  const cookie = request.headers.get("cookie") || "";
  const userParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    status: userStatus,
  });
  const [usersRes, ipsRes] = await Promise.all([
    apiFetch<{ success: boolean; data: any[]; total?: number }>(
      `/api/v1/admin/bans/users?${userParams.toString()}`,
      {
        headers: { cookie },
      },
    ),
    apiFetch<{ success: boolean; data: any[]; total?: number }>(
      `/api/v1/admin/bans/ips?page=${page}&limit=${limit}`,
      { headers: { cookie } },
    ),
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
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [removeIpTarget, setRemoveIpTarget] = useState<{ id: number; ip: string } | null>(null);
  const [singleUserTarget, setSingleUserTarget] = useState<string | null>(null);
  const [bulkUserConfirmOpen, setBulkUserConfirmOpen] = useState(false);
  const [addIpConfirmOpen, setAddIpConfirmOpen] = useState(false);
  const removeIpTriggerRef = useRef<HTMLElement | null>(null);
  const addIpTriggerRef = useRef<HTMLElement | null>(null);
  const userActionTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setSelectedUserIds([]);
  }, [page, userStatus]);

  const currentUserIds = bannedUsers.map((user: any) => Number(user.id));
  const selectedCurrentUserIds = selectedUserIds.filter((id) => currentUserIds.includes(id));
  const allCurrentUsersSelected =
    currentUserIds.length > 0 && selectedCurrentUserIds.length === currentUserIds.length;
  const userAction = userGovernanceApiAction(userStatus);
  const userActionLabel = userGovernanceActionLabel(userStatus);
  const userStatusLabel = USER_GOVERNANCE_STATUS_LABELS[userStatus];

  const toggleUserSelection = (id: number, checked: boolean) => {
    setSelectedUserIds((ids) =>
      checked ? Array.from(new Set([...ids, id])) : ids.filter((item) => item !== id),
    );
  };

  const toggleAllCurrentUsers = (checked: boolean) => {
    setSelectedUserIds((ids) =>
      checked
        ? Array.from(new Set([...ids, ...currentUserIds]))
        : ids.filter((id) => !currentUserIds.includes(id)),
    );
  };

  const { run: handleSingleUserGovernance, pending: singleUserPending } = useAsyncAction(
    async () => {
      const res = await apiFetch<{ success: boolean; error_msg?: string }>(
        `/api/v1/user/${singleUserTarget}/${userAction}`,
        { method: "POST" },
      );
      return { ...res, name: singleUserTarget };
    },
    {
      onSuccess: (result) => {
        if (result.success) {
          toast.success(`已${userActionLabel} ${result.name}`);
          setSingleUserTarget(null);
          const fallback = previousPageAfterRemoval({
            pathname: location.pathname,
            search: location.search,
            page,
            currentItemCount: bannedUsers.length,
            removedCount: 1,
          });
          if (fallback) navigate(fallback, { replace: true });
          else revalidate();
        } else {
          toast.error(result.error_msg || `${userActionLabel}失败`);
        }
      },
    },
  );

  const { run: handleBulkUserGovernance, pending: bulkUserPending } = useAsyncAction(
    async () => {
      const res = await apiFetch<{
        success: boolean;
        error_msg?: string;
        processed?: number;
        skipped_ids?: number[];
      }>("/api/v1/admin/users/bulk-governance", {
        method: "POST",
        body: JSON.stringify({ action: userAction, ids: selectedCurrentUserIds }),
      });
      return res;
    },
    {
      onSuccess: (result) => {
        if (result.success) {
          const feedback = bulkUserGovernanceFeedback(userActionLabel, result);
          toast.success(
            feedback.message,
            feedback.description ? { description: feedback.description } : undefined,
          );
          setSelectedUserIds(result.skipped_ids || []);
          setBulkUserConfirmOpen(false);
          const fallback = previousPageAfterRemoval({
            pathname: location.pathname,
            search: location.search,
            page,
            currentItemCount: bannedUsers.length,
            removedCount: result.processed || 0,
          });
          if (fallback) navigate(fallback, { replace: true });
          else revalidate();
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
      errorMessage: "添加 IP 规则失败",
      onSuccess: (result) => {
        if (result.success) {
          toast.success("IP 规则已添加");
          setIp("");
          setReason("");
          setAddIpConfirmOpen(false);
          revalidate();
        } else {
          toast.error(result.error_msg || "添加 IP 规则失败");
        }
      },
    },
  );

  const { run: handleRemoveIp, pending: removingIp } = useAsyncAction(
    (id: number) =>
      apiFetch<{ success: boolean; error_msg?: string }>(`/api/v1/admin/bans/ips/${id}`, {
        method: "DELETE",
      }).catch(() => ({ success: false, error_msg: "移除失败" })),
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success("IP 规则已移除");
          setRemoveIpTarget(null);
          const fallback = previousPageAfterRemoval({
            pathname: location.pathname,
            search: location.search,
            page,
            currentItemCount: bannedIps.length,
            removedCount: 1,
          });
          if (fallback) navigate(fallback, { replace: true });
          else revalidate();
        } else {
          toast.error(res.error_msg || "移除失败");
        }
      },
    },
  );

  return (
    <AdminLayout>
      <AdminPage archetype="data-list">
        <AdminPageHeader
          title="封禁管理"
          description="管理用户禁言、内容屏蔽和 IP 风控规则，保持社区秩序。"
        />
        <Tabs
          value={tab}
          onValueChange={(value) => {
            if (!value || value === tab) return;
            const next = new URLSearchParams(searchParams);
            next.set("tab", value);
            next.delete("page");
            if (value === "ips") next.delete("status");
            setSearchParams(next);
          }}
        >
          <TabsList>
            <TabsTrigger value="users">用户治理</TabsTrigger>
            <TabsTrigger value="ips">IP 封禁</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <AdminPanel
              title={userStatusLabel}
              description={`当前显示 ${bannedUsers.length} / ${bannedUsersTotal} 个${userStatusLabel}`}
              flush
            >
              <AdminToolbar>
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-2">
                    <Button
                      render={<Link to={`/admin/bans?tab=users&status=muted&limit=${limit}`} />}
                      size="sm"
                      variant={userStatus === "muted" ? "default" : "outline"}
                    >
                      禁言用户
                    </Button>
                    <Button
                      render={<Link to={`/admin/bans?tab=users&status=blocked&limit=${limit}`} />}
                      size="sm"
                      variant={userStatus === "blocked" ? "default" : "outline"}
                    >
                      内容已屏蔽用户
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    onClick={(event) => {
                      userActionTriggerRef.current = event.currentTarget;
                      setBulkUserConfirmOpen(true);
                    }}
                    disabled={bulkUserPending || selectedCurrentUserIds.length === 0}
                  >
                    {bulkUserPending
                      ? "处理中"
                      : `批量${userActionLabel} (${selectedCurrentUserIds.length})`}
                  </Button>
                </div>
              </AdminToolbar>
              <Table className="min-w-[680px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allCurrentUsersSelected}
                        onCheckedChange={(checked) => toggleAllCurrentUsers(checked === true)}
                        aria-label={`选择当前页${userStatusLabel}`}
                      />
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
                        <Checkbox
                          checked={selectedUserIds.includes(Number(u.id))}
                          onCheckedChange={(checked) =>
                            toggleUserSelection(Number(u.id), checked === true)
                          }
                          aria-label={`选择 ${u.loginname}`}
                        />
                      </TableCell>
                      <TableCell>{u.loginname}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.is_muted && <Badge variant="destructive">禁言</Badge>}
                          {u.is_block && <Badge variant="destructive">内容已屏蔽</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={singleUserPending}
                          onClick={(event) => {
                            userActionTriggerRef.current = event.currentTarget;
                            setSingleUserTarget(u.loginname);
                          }}
                        >
                          {singleUserPending ? "处理中" : userActionLabel}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {bannedUsers.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        暂无{userStatusLabel}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <Pagination
                page={page}
                total={bannedUsersTotal}
                limit={limit}
                basePath="/admin/bans"
                searchParams={{ tab: "users", status: userStatus }}
              />
              <ConfirmationDialog
                open={singleUserTarget !== null}
                onOpenChange={(open) => !open && setSingleUserTarget(null)}
                title={userStatus === "muted" ? "解除用户禁言" : "恢复用户内容可见"}
                description={
                  userStatus === "muted"
                    ? `将恢复 ${singleUserTarget} 发布话题和回复的能力；不会取消内容屏蔽或恢复已删除内容。`
                    : `将恢复 ${singleUserTarget} 的内容可见性；不会解除禁言或恢复已删除内容。`
                }
                confirmLabel={userActionLabel}
                pending={singleUserPending}
                destructive={false}
                finalFocus={userActionTriggerRef}
                onConfirm={handleSingleUserGovernance}
              />
              <ConfirmationDialog
                open={bulkUserConfirmOpen}
                onOpenChange={setBulkUserConfirmOpen}
                title={`批量${userActionLabel}`}
                description={
                  userStatus === "muted"
                    ? `将为 ${selectedCurrentUserIds.length} 个用户解除禁言；不会取消内容屏蔽或恢复已删除内容。`
                    : `将为 ${selectedCurrentUserIds.length} 个用户恢复内容可见；不会解除禁言或恢复已删除内容。`
                }
                confirmLabel={`确认${userActionLabel} ${selectedCurrentUserIds.length} 个用户`}
                pending={bulkUserPending}
                destructive={false}
                finalFocus={userActionTriggerRef}
                onConfirm={handleBulkUserGovernance}
              />
            </AdminPanel>
          </TabsContent>
          <TabsContent value="ips">
            <AdminPanel
              title="IP 封禁"
              description={`当前显示 ${bannedIps.length} / ${bannedIpsTotal} 条 IP 规则`}
              flush
            >
              <AdminToolbar>
                <Input
                  value={ip}
                  onChange={(event) => setIp(event.target.value)}
                  placeholder="IP 或 CIDR (如 1.2.3.4 或 1.2.3.0/24)"
                  className="w-full sm:max-w-md"
                />
                <Input
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="原因"
                  className="w-full sm:max-w-sm"
                />
                <Button
                  onClick={(event) => {
                    addIpTriggerRef.current = event.currentTarget;
                    setAddIpConfirmOpen(true);
                  }}
                  disabled={savingIp || !ip.trim()}
                >
                  {savingIp ? "添加中" : "添加"}
                </Button>
              </AdminToolbar>
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
                      <TableCell className="break-words text-muted-foreground">
                        {ip.reason}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(event) => {
                            removeIpTriggerRef.current = event.currentTarget;
                            setRemoveIpTarget({ id: ip.id, ip: ip.ip });
                          }}
                        >
                          移除
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={page}
                total={bannedIpsTotal}
                limit={limit}
                basePath="/admin/bans"
                searchParams={{ tab: "ips" }}
              />
              <ConfirmationDialog
                open={addIpConfirmOpen}
                onOpenChange={setAddIpConfirmOpen}
                title="确认添加 IP 封禁规则"
                description={
                  <>
                    将封禁 {ip.trim()} 匹配的请求。原因：{reason.trim() || "未填写"}
                    。该规则生效后，匹配请求将被阻止。
                  </>
                }
                confirmLabel="确认添加 IP 规则"
                pendingLabel="添加中"
                pending={savingIp}
                finalFocus={addIpTriggerRef}
                onConfirm={handleAddIp}
              />
              <ConfirmationDialog
                open={removeIpTarget !== null}
                onOpenChange={(open) => !open && setRemoveIpTarget(null)}
                title="删除 IP 封禁规则"
                description={
                  <>
                    将删除规则 {removeIpTarget?.ip}。删除后匹配该 IP
                    或网段的请求将不再被此规则阻止。
                  </>
                }
                confirmLabel="确认删除 IP 规则"
                pendingLabel="删除中"
                pending={removingIp}
                finalFocus={removeIpTriggerRef}
                onConfirm={() => removeIpTarget && handleRemoveIp(removeIpTarget.id)}
              />
            </AdminPanel>
          </TabsContent>
        </Tabs>
      </AdminPage>
    </AdminLayout>
  );
}
