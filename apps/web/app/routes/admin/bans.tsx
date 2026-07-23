import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { apiFetch } from "~/lib/api-client";
import { useRevalidator } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { AdminPage, AdminPageHeader, AdminPanel, AdminToolbar } from "~/components/AdminPage";
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
  const cookie = request.headers.get("cookie") || "";
  const [usersRes, ipsRes] = await Promise.all([
    apiFetch<{ success: boolean; data: any[] }>("/api/v1/admin/bans/users", {
      headers: { cookie },
    }),
    apiFetch<{ success: boolean; data: any[] }>("/api/v1/admin/bans/ips", { headers: { cookie } }),
  ]);
  return {
    bannedUsers: usersRes.success ? usersRes.data || [] : [],
    bannedIps: ipsRes.success ? ipsRes.data || [] : [],
  };
}

export default function AdminBans({ loaderData }: any) {
  const { bannedUsers, bannedIps } = loaderData;
  const { revalidate } = useRevalidator();

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

  return (
    <AdminLayout>
      <AdminPage>
      <AdminPageHeader title="封禁管理" description="管理用户禁言和 IP 风控规则，保持社区秩序。" />
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-card shadow-card">
          <TabsTrigger value="users">用户封禁</TabsTrigger>
          <TabsTrigger value="ips">IP 封禁</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <AdminPanel title="用户封禁" description={`当前 ${bannedUsers.length} 个用户处于禁言状态`}>
            <Table>
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
          </AdminPanel>
        </TabsContent>
        <TabsContent value="ips">
          <AdminPanel title="IP 封禁" description={`当前 ${bannedIps.length} 条 IP 规则`}>
            <AdminToolbar>
              <Input placeholder="IP 或 CIDR (如 1.2.3.4 或 1.2.3.0/24)" className="w-full sm:max-w-md" />
              <Button disabled title="IP 封禁添加接口尚未接入">
                添加
              </Button>
            </AdminToolbar>
            <Table>
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
                    <TableCell>{ip.ip}</TableCell>
                    <TableCell className="text-muted-foreground">{ip.reason}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="text-destructive">
                        移除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminPanel>
        </TabsContent>
      </Tabs>
      </AdminPage>
    </AdminLayout>
  );
}
