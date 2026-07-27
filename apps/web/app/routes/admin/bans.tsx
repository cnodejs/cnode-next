import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { apiFetch } from "~/lib/api-client";
import { useRevalidator } from "react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
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

export async function loader({ request }: any) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Number(url.searchParams.get("limit")) || 50);
  const tab = url.searchParams.get("tab") || "users";
  const cookie = request.headers.get("cookie") || "";
  const [usersRes, ipsRes] = await Promise.all([
    apiFetch<{ success: boolean; data: any[]; total?: number }>(`/api/v1/admin/bans/users?page=${page}&limit=${limit}`, {
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
  };
}

export default function AdminBans({ loaderData }: any) {
  const { bannedUsers, bannedUsersTotal, bannedIps, bannedIpsTotal, page, limit, tab } = loaderData;
  const { revalidate } = useRevalidator();
  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const [savingIp, setSavingIp] = useState(false);

  const handleUnblock = async (name: string) => {
    const res = await apiFetch<{ success: boolean; error_msg?: string }>(
      `/api/v1/user/${name}/unblock`,
      { method: "POST" },
    );
    if (res.success) {
      toast.success(`已解禁 ${name}`);
      revalidate();
    } else {
      toast.error(res.error_msg || "解禁失败");
    }
  };

  const handleAddIp = async () => {
    setSavingIp(true);
    const res = await apiFetch<{ success: boolean; error_msg?: string }>("/api/v1/admin/bans/ips", {
      method: "POST",
      body: JSON.stringify({ ip, reason }),
    }).catch(() => ({ success: false, error_msg: "添加失败" }));
    setSavingIp(false);
    if (res.success) {
      toast.success("IP 规则已添加");
      setIp("");
      setReason("");
      revalidate();
    } else {
      toast.error(res.error_msg || "添加失败");
    }
  };

  const handleRemoveIp = async (id: number) => {
    const res = await apiFetch<{ success: boolean; error_msg?: string }>(`/api/v1/admin/bans/ips/${id}`, {
      method: "DELETE",
    }).catch(() => ({ success: false, error_msg: "移除失败" }));
    if (res.success) {
      toast.success("IP 规则已移除");
      revalidate();
    } else {
      toast.error(res.error_msg || "移除失败");
    }
  };

  return (
    <AdminLayout>
      <AdminPage>
      <AdminPageHeader title="封禁管理" description="管理用户禁言和 IP 风控规则，保持社区秩序。" />
      <Tabs defaultValue={tab} className="space-y-4">
        <TabsList className="bg-card shadow-card">
          <TabsTrigger value="users">用户封禁</TabsTrigger>
          <TabsTrigger value="ips">IP 封禁</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <AdminPanel title="用户封禁" description={`当前显示 ${bannedUsers.length} / ${bannedUsersTotal} 个禁言用户`}>
            <div className="overflow-x-auto">
            <Table className="min-w-[560px]">
              <TableHeader>
                <TableRow>
                  <TableHead>用户</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bannedUsers.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.loginname}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">禁言</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleUnblock(u.loginname)}>
                        解禁
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            <div className="px-4 pb-4">
              <Pagination page={page} total={bannedUsersTotal} limit={limit} basePath="/admin/bans" searchParams={{ tab: "users" }} />
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
