import { requireMod } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { apiFetch } from "~/lib/api-client";
import { useState } from "react";
import { Form, Link, useRevalidator } from "react-router";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

export function meta() {
  return [{ title: "话题管理 · CNode Admin" }];
}

export async function loader({ request }: any) {
  const user = await requireMod(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Number(url.searchParams.get("limit")) || 50);
  const q = url.searchParams.get("q") || "";
  const tab = url.searchParams.get("tab") || "";
  const visibility = url.searchParams.get("visibility") || "all";
  const flag = url.searchParams.get("flag") || "all";
  const dateField = url.searchParams.get("date_field") || "create_at";
  const dateFrom = url.searchParams.get("date_from") || "";
  const dateTo = url.searchParams.get("date_to") || "";
  const sort = url.searchParams.get("sort") || "create_at_desc";
  const cookie = request.headers.get("cookie") || "";
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) params.set("q", q);
  if (tab) params.set("tab", tab);
  if (visibility && visibility !== "all") params.set("visibility", visibility);
  if (flag && flag !== "all") params.set("flag", flag);
  if (dateField && dateField !== "create_at") params.set("date_field", dateField);
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  if (sort && sort !== "create_at_desc") params.set("sort", sort);
  const res = await apiFetch<{ success: boolean; data: any[]; total?: number; page?: number; limit?: number }>(
    `/api/v1/admin/topics?${params.toString()}`,
    { headers: { cookie } },
  );
  return { topics: res.success ? res.data || [] : [], total: res.total ?? 0, page, limit, q, tab, visibility, flag, dateField, dateFrom, dateTo, sort, user };
}

export default function AdminTopics({ loaderData }: any) {
  const { topics, total, page, limit, q, tab, visibility, flag, dateField, dateFrom, dateTo, sort, user } = loaderData;
  const isAdmin = !!user?.is_admin;
  const [selected, setSelected] = useState<number[]>([]);
  const [permanentDeleteIds, setPermanentDeleteIds] = useState<number[]>([]);
  const { revalidate } = useRevalidator();
  const paginationParams = {
    ...(q ? { q } : {}),
    ...(tab ? { tab } : {}),
    ...(visibility && visibility !== "all" ? { visibility } : {}),
    ...(flag && flag !== "all" ? { flag } : {}),
    ...(dateField && dateField !== "create_at" ? { date_field: dateField } : {}),
    ...(dateFrom ? { date_from: dateFrom } : {}),
    ...(dateTo ? { date_to: dateTo } : {}),
    ...(sort && sort !== "create_at_desc" ? { sort } : {}),
  };

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

  const { run: runPermanentDelete, pending: permanentDeletePending } = useAsyncAction(
    (ids: number[]) =>
      apiFetch<{ success: boolean; error_msg?: string; deleted?: number }>(
        "/api/v1/admin/topics/permanent-delete",
        { method: "POST", body: JSON.stringify({ ids }) },
      ),
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success(`已永久删除 ${res.deleted || permanentDeleteIds.length} 个话题`);
          setSelected([]);
          setPermanentDeleteIds([]);
          revalidate();
        } else {
          toast.error(res.error_msg || "永久删除失败");
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
            <Form method="get" className="grid w-full gap-3 lg:grid-cols-[minmax(180px,1.4fr)_repeat(4,minmax(120px,1fr))_auto]">
              <Input name="q" defaultValue={q} placeholder="搜索标题" />
              <select name="tab" defaultValue={tab || "all"} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="all">全部 Tab</option>
                <option value="share">分享</option>
                <option value="ask">问答</option>
                <option value="job">招聘</option>
                <option value="dev">dev</option>
                <option value="test">test</option>
              </select>
              <select name="visibility" defaultValue={visibility} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="all">全部状态</option>
                <option value="normal">正常</option>
                <option value="muted">已隐藏</option>
                <option value="deleted">已删除</option>
              </select>
              <select name="flag" defaultValue={flag} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="all">全部标记</option>
                <option value="top">置顶</option>
                <option value="good">精华</option>
                <option value="locked">锁定</option>
                <option value="archived">归档</option>
              </select>
              <select name="sort" defaultValue={sort} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="create_at_desc">最新创建</option>
                <option value="update_at_desc">最近更新</option>
                <option value="last_reply_at_desc">最近回复</option>
                <option value="reply_count_desc">回复最多</option>
                <option value="visit_count_desc">浏览最多</option>
                <option value="collect_count_desc">收藏最多</option>
              </select>
              <div className="flex gap-2">
                <Button type="submit" variant="outline">筛选</Button>
                <Button asChild type="button" variant="ghost">
                  <Link to="/admin/topics">重置</Link>
                </Button>
              </div>
              <div className="grid gap-2 sm:col-span-2 sm:grid-cols-[minmax(120px,0.8fr)_minmax(120px,1fr)_minmax(120px,1fr)] lg:col-span-6 lg:grid-cols-[minmax(120px,180px)_minmax(120px,180px)_minmax(120px,180px)]">
                <select name="date_field" defaultValue={dateField} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="create_at">创建时间</option>
                  <option value="update_at">更新时间</option>
                  <option value="last_reply_at">最后回复</option>
                </select>
                <Input type="date" name="date_from" defaultValue={dateFrom} aria-label="开始日期" />
                <Input type="date" name="date_to" defaultValue={dateTo} aria-label="结束日期" />
              </div>
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
                    <Button size="sm" variant="destructive" onClick={() => setPermanentDeleteIds(selected)}>
                      永久删除
                    </Button>
                  </>
                )}
              </div>
            )}
          </AdminToolbar>
          <div className="overflow-x-auto">
          <Table className="min-w-[1180px]">
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
              <TableHead className="w-20">浏览</TableHead>
              <TableHead className="w-20">收藏</TableHead>
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
                  {t.lock > 0 && <StatusBadge type="lock" />}
                  {t.archived > 0 && <StatusBadge type="archived" />}
                  {t.status === "muted" && <StatusBadge type="muted" />}
                  {t.deleted > 0 && <span className="text-destructive text-xs">已删除</span>}
                </TableCell>
                <TableCell>{t.reply_count}</TableCell>
                <TableCell>{t.visit_count}</TableCell>
                <TableCell>{t.collect_count}</TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  <div>创建 <TimeAgo date={t.create_at} /></div>
                  {t.update_at ? <div>更新 <TimeAgo date={t.update_at} /></div> : null}
                  {t.last_reply_at ? <div>回复 <TimeAgo date={t.last_reply_at} /></div> : null}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => handleAction("top", t.id)}>
                    切换置顶
                  </Button>
                  {isAdmin ? (
                    <Button size="sm" variant="destructive" onClick={() => setPermanentDeleteIds([t.id])}>
                      永久删除
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
          </div>
          <div className="px-4 pb-4">
            <Pagination page={page} total={total} limit={limit} basePath="/admin/topics" searchParams={paginationParams} />
          </div>
          <Dialog open={permanentDeleteIds.length > 0} onOpenChange={(open) => !permanentDeletePending && !open && setPermanentDeleteIds([])}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>确认从数据库永久删除话题</DialogTitle>
                <DialogDescription>
                  将永久删除 {permanentDeleteIds.length} 个话题及其回复、收藏、招聘扩展、巡检命中和消息引用。该操作不同于普通删除，无法通过系统自动恢复。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPermanentDeleteIds([])} disabled={permanentDeletePending}>
                  取消
                </Button>
                <Button type="button" variant="destructive" onClick={() => runPermanentDelete(permanentDeleteIds)} disabled={permanentDeletePending}>
                  {permanentDeletePending ? "删除中" : `确认永久删除 ${permanentDeleteIds.length} 个话题`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </AdminPanel>
      </AdminPage>
    </AdminLayout>
  );
}
