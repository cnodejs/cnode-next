import { requireMod } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { apiFetch } from "~/lib/api-client";
import { useState } from "react";
import { Form, useRevalidator } from "react-router";
import { toast } from "sonner";
import { useAsyncAction } from "~/hooks/use-async-action";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { TagBadge, StatusBadge } from "~/components/TagBadge";
import { TimeAgo } from "~/components/TimeAgo";
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
  return [{ title: "话题管理 · CNode Admin" }];
}

export async function loader({ request }: any) {
  const user = await requireMod(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Number(url.searchParams.get("limit")) || 50);
  const q = url.searchParams.get("q") || "";
  const cookie = request.headers.get("cookie") || "";
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) params.set("q", q);
  const res = await apiFetch<{ success: boolean; data: any[]; total?: number; page?: number; limit?: number }>(
    `/api/v1/admin/topics?${params.toString()}`,
    { headers: { cookie } },
  );
  return { topics: res.success ? res.data || [] : [], total: res.total ?? 0, page, limit, q, user };
}

export default function AdminTopics({ loaderData }: any) {
  const { topics, total, page, limit, q, user } = loaderData;
  const isAdmin = !!user?.is_admin;
  const [selected, setSelected] = useState<number[]>([]);
  const { revalidate } = useRevalidator();

  const toggleSelect = (id: number) => {
    setSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  const { run: runAction } = useAsyncAction(
    (action: string, ids: number[]) =>
      apiFetch<{ success: boolean; error_msg?: string }>(
        `/api/v1/admin/topics/${action}`,
        { method: "POST", body: JSON.stringify({ ids }) },
      ),
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success("操作成功");
          setSelected([]);
          revalidate();
        } else {
          toast.error(res.error_msg || "操作失败");
        }
      },
    },
  );

  const handleAction = (action: string, topicId?: number) => {
    const ids = topicId ? [topicId] : selected;
    if (ids.length === 0) return;
    runAction(action, ids);
  };

  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader title="话题管理" description="集中处理置顶、加精、隐藏和删除等内容运营动作。" />
        <AdminPanel title="话题列表" description={`当前显示 ${topics.length} / ${total} 个话题`}>
          <AdminToolbar>
            <Form method="get" className="flex w-full gap-2 sm:max-w-md">
              <Input name="q" defaultValue={q} placeholder="搜索标题" className="flex-1" />
              <Button type="submit" variant="outline">搜索</Button>
            </Form>
            {selected.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-cnode-ink">已选 {selected.length} 项</span>
                <Button size="sm" variant="outline" onClick={() => handleAction("top")}>
                  切换置顶
                </Button>
                {isAdmin && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleAction("good")}>
                      加精
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction("mute")}>
                      隐藏
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleAction("delete")}>
                      删除
                    </Button>
                  </>
                )}
              </div>
            )}
          </AdminToolbar>
          <div className="overflow-x-auto">
          <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <Checkbox
                  aria-label="选择全部话题"
                  checked={selected.length === topics.length && topics.length > 0}
                  onCheckedChange={(checked) =>
                    setSelected(checked ? topics.map((t: any) => t.id) : [])
                  }
                />
              </TableHead>
              <TableHead className="min-w-80">标题</TableHead>
              <TableHead className="w-24">Tab</TableHead>
              <TableHead className="w-32">状态</TableHead>
              <TableHead className="w-20">回复</TableHead>
              <TableHead className="w-32 whitespace-nowrap">时间</TableHead>
              <TableHead className="w-32 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topics.map((t: any) => (
              <TableRow key={t.id}>
                <TableCell className="max-w-lg">
                  <Checkbox
                    aria-label={`选择话题 ${t.title}`}
                    checked={selected.includes(t.id)}
                    onCheckedChange={() => toggleSelect(t.id)}
                  />
                </TableCell>
                <TableCell>
                  <a
                    href={`/topic/${t.id}`}
                    className="block truncate text-primary hover:underline"
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
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  <TimeAgo date={t.create_at} />
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => handleAction("top", t.id)}>
                    切换置顶
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
          </div>
          <div className="px-4 pb-4">
            <Pagination page={page} total={total} limit={limit} basePath="/admin/topics" searchParams={{ ...(q ? { q } : {}) }} />
          </div>
        </AdminPanel>
      </AdminPage>
    </AdminLayout>
  );
}
