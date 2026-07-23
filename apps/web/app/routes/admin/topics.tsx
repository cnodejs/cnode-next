import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { apiFetch } from "~/lib/api-client";
import { useState } from "react";
import { useRevalidator } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { TagBadge, StatusBadge } from "~/components/TagBadge";
import { TimeAgo } from "~/components/TimeAgo";
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
  return [{ title: "话题管理 · CNode Admin" }];
}

export async function loader({ request }: any) {
  await requireAdmin(request);
  const cookie = request.headers.get("cookie") || "";
  const res = await apiFetch<{ success: boolean; data: any[] }>("/api/v1/admin/topics?limit=50", {
    headers: { cookie },
  });
  return { topics: res.success ? res.data || [] : [] };
}

export default function AdminTopics({ loaderData }: any) {
  const { topics } = loaderData;
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const { revalidate } = useRevalidator();

  const toggleSelect = (id: number) => {
    setSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  const handleAction = async (action: string, topicId?: number) => {
    const ids = topicId ? [topicId] : selected;
    if (ids.length === 0) return;
    const res = await apiFetch<{ success: boolean; error_msg?: string }>(
      `/api/v1/admin/topics/${action}`,
      {
        method: "POST",
        body: JSON.stringify({ ids }),
      },
    );
    if (res.success) {
      toast.success("操作成功");
      setSelected([]);
      revalidate();
    } else {
      toast.error(res.error_msg || "操作失败");
    }
  };

  const filtered = topics.filter(
    (t: any) =>
      !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.author?.loginname?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader title="话题管理" description="集中处理置顶、加精、隐藏和删除等内容运营动作。" />
        <AdminPanel title="话题列表" description={`当前显示 ${filtered.length} / ${topics.length} 个话题`}>
          <AdminToolbar>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索标题/作者"
              className="w-full sm:max-w-sm"
            />
            {selected.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-cnode-ink">已选 {selected.length} 项</span>
                <Button size="sm" variant="outline" onClick={() => handleAction("top")}>
                  置顶
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAction("good")}>
                  加精
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAction("mute")}>
                  隐藏
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleAction("delete")}>
                  删除
                </Button>
              </div>
            )}
          </AdminToolbar>
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <Checkbox
                  checked={selected.length === topics.length && topics.length > 0}
                  onCheckedChange={(checked) =>
                    setSelected(checked ? topics.map((t: any) => t.id) : [])
                  }
                />
              </TableHead>
              <TableHead>标题</TableHead>
              <TableHead>Tab</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>回复</TableHead>
              <TableHead>时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t: any) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.includes(t.id)}
                    onCheckedChange={() => toggleSelect(t.id)}
                  />
                </TableCell>
                <TableCell>
                  <a
                    href={`/topic/${t.id}`}
                    className="text-primary hover:underline truncate block max-w-xs"
                  >
                    {t.title}
                  </a>
                </TableCell>
                <TableCell>
                  <TagBadge tab={t.tab} />
                </TableCell>
                <TableCell>
                  {t.top > 0 && <StatusBadge type="top" />}
                  {t.good > 0 && <StatusBadge type="good" />}
                  {t.deleted > 0 && <span className="text-destructive text-xs">已删除</span>}
                </TableCell>
                <TableCell>{t.reply_count}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  <TimeAgo date={t.create_at} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </AdminPanel>
      </AdminPage>
    </AdminLayout>
  );
}
