import { requireMod } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { apiFetch } from "~/lib/api-client";
import { useRef, useState } from "react";
import { Form, Link, useLocation, useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import { useAsyncAction } from "~/hooks/use-async-action";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { NativeSelect } from "~/components/ui/native-select";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import { TagBadge, StatusBadge } from "~/components/TagBadge";
import { TimeAgo } from "~/components/TimeAgo";
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
  const [muteIds, setMuteIds] = useState<number[]>([]);
  const [permanentDeleteIds, setPermanentDeleteIds] = useState<number[]>([]);
  const [softDeleteIds, setSoftDeleteIds] = useState<number[]>([]);
  const muteFinalFocusRef = useRef<HTMLElement | null>(null);
  const permanentDeleteFinalFocusRef = useRef<HTMLElement | null>(null);
  const softDeleteFinalFocusRef = useRef<HTMLElement | null>(null);
  const { revalidate } = useRevalidator();
  const location = useLocation();
  const navigate = useNavigate();
  const activeFilterCount = [q, tab, visibility !== "all" ? visibility : "", flag !== "all" ? flag : "", dateFrom, dateTo, dateField !== "create_at" ? dateField : "", sort !== "create_at_desc" ? sort : ""].filter(Boolean).length;
  const visibleDeleted = topics.filter((topic: any) => topic.deleted > 0 || topic.status === "deleted").length;
  const visibleMuted = topics.filter((topic: any) => topic.status === "muted").length;
  const visibleFeatured = topics.filter((topic: any) => topic.top > 0 || topic.good > 0).length;
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

  const { run: runAction, pending: actionPending } = useAsyncAction(
    async (action: string, ids: number[]) => {
      const result = await apiFetch<{ success: boolean; error_msg?: string }>(
        `/api/v1/admin/topics/${action}`,
        { method: "POST", body: JSON.stringify({ ids }) },
      );
      return { ...result, action, ids };
    },
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success("操作成功");
          setSelected([]);
          setMuteIds([]);
          setSoftDeleteIds([]);
          const fallback = res.action === "delete" ? previousPageAfterRemoval({ pathname: location.pathname, search: location.search, page, currentItemCount: topics.length, removedCount: res.ids.length }) : null;
          if (fallback) navigate(fallback, { replace: true });
          else revalidate();
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
          const fallback = previousPageAfterRemoval({ pathname: location.pathname, search: location.search, page, currentItemCount: topics.length, removedCount: res.deleted || permanentDeleteIds.length });
          if (fallback) navigate(fallback, { replace: true });
          else revalidate();
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
        <AdminPanel title="内容治理队列" description={`当前页 ${topics.length} 条 / 共 ${total} 条`} flush>
          <div className="grid gap-1 bg-surface-subtle p-3 sm:grid-cols-4">
            <div className="rounded-md px-2 py-1.5">
              <div className="text-xs text-muted-foreground">筛选结果</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">{total}</div>
            </div>
            <div className="rounded-md px-2 py-1.5">
              <div className="text-xs text-muted-foreground">当前页重点</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">{visibleFeatured}</div>
            </div>
            <div className="rounded-md px-2 py-1.5">
              <div className="text-xs text-muted-foreground">隐藏 / 删除</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">{visibleMuted} / {visibleDeleted}</div>
            </div>
            <div className="rounded-md px-2 py-1.5">
              <div className="text-xs text-muted-foreground">活跃筛选</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">{activeFilterCount}</div>
            </div>
          </div>
          <AdminToolbar className="items-stretch bg-card/95 sm:flex-col sm:items-stretch">
            <Form method="get" className="grid gap-2 lg:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(112px,auto))_auto_auto]">
              <Input name="q" defaultValue={q} placeholder="搜索话题标题" className="h-9" />
              <NativeSelect name="tab" defaultValue={tab || "all"} selectSize="sm" aria-label="Tab 筛选">
                <option value="all">全部 Tab</option>
                <option value="share">分享</option>
                <option value="ask">问答</option>
                <option value="job">招聘</option>
                <option value="dev">dev</option>
                <option value="test">test</option>
              </NativeSelect>
              <NativeSelect name="visibility" defaultValue={visibility} selectSize="sm" aria-label="状态筛选">
                <option value="all">全部状态</option>
                <option value="normal">正常</option>
                <option value="muted">已隐藏</option>
                <option value="deleted">已删除</option>
              </NativeSelect>
              <NativeSelect name="flag" defaultValue={flag} selectSize="sm" aria-label="标记筛选">
                <option value="all">全部标记</option>
                <option value="top">置顶</option>
                <option value="good">精华</option>
                <option value="locked">锁定</option>
                <option value="archived">归档</option>
              </NativeSelect>
              <NativeSelect name="sort" defaultValue={sort} selectSize="sm" aria-label="排序方式">
                <option value="create_at_desc">最新创建</option>
                <option value="update_at_desc">最近更新</option>
                <option value="last_reply_at_desc">最近回复</option>
                <option value="reply_count_desc">回复最多</option>
                <option value="visit_count_desc">浏览最多</option>
                <option value="collect_count_desc">收藏最多</option>
              </NativeSelect>
              <Button type="submit" size="sm">筛选</Button>
              <Button render={<Link to="/admin/topics" />} size="sm" variant="ghost">
                重置
              </Button>
              <div className="grid gap-2 rounded-xl bg-surface-subtle p-2 lg:col-span-7 lg:grid-cols-[minmax(120px,160px)_minmax(120px,180px)_minmax(120px,180px)_1fr]">
                <NativeSelect name="date_field" defaultValue={dateField} selectSize="sm" aria-label="日期字段">
                  <option value="create_at">创建时间</option>
                  <option value="update_at">更新时间</option>
                  <option value="last_reply_at">最后回复</option>
                </NativeSelect>
                <Input type="date" name="date_from" defaultValue={dateFrom} aria-label="开始日期" className="h-8" />
                <Input type="date" name="date_to" defaultValue={dateTo} aria-label="结束日期" className="h-8" />
                <div className="flex items-center text-xs text-muted-foreground">日期是辅助筛选，默认按创建时间倒序。</div>
              </div>
            </Form>
            {selected.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-md bg-cnode-soft p-3 text-sm">
                <Badge variant="default">已选 {selected.length}</Badge>
                <Button size="sm" variant="outline" disabled={actionPending} onClick={() => handleAction("top")}>{actionPending ? "处理中" : "切换置顶"}</Button>
                {isAdmin && (
                  <>
                    <Button size="sm" variant="outline" disabled={actionPending} onClick={() => handleAction("good")}>加精</Button>
                    <Button size="sm" variant="outline" disabled={actionPending} onClick={(event) => {
                      muteFinalFocusRef.current = event.currentTarget;
                      setMuteIds(selected);
                    }}>隐藏</Button>
                    <Button size="sm" variant="destructive" onClick={(event) => {
                      softDeleteFinalFocusRef.current = event.currentTarget;
                      setSoftDeleteIds(selected);
                    }} disabled={actionPending}>删除</Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(event) => {
                        permanentDeleteFinalFocusRef.current = event.currentTarget;
                        setPermanentDeleteIds(selected);
                      }}
                    >永久删除</Button>
                  </>
                )}
              </div>
            )}
          </AdminToolbar>
          <div className="overflow-x-auto bg-card">
          <Table className="min-w-[1040px]">
          <TableHeader>
            <TableRow className="bg-surface-subtle/60">
              <TableHead className="w-10">
                <Checkbox
                  aria-label="选择全部话题"
                  checked={selected.length === topics.length && topics.length > 0}
                  onCheckedChange={(checked) => setSelected(checked ? topics.map((t: any) => t.id) : [])}
                />
              </TableHead>
              <TableHead>话题</TableHead>
              <TableHead className="w-32">状态</TableHead>
              <TableHead className="w-40">互动</TableHead>
              <TableHead className="w-44">时间</TableHead>
              <TableHead className="w-36 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topics.map((t: any) => (
              <TableRow key={t.id} className="align-top hover:bg-cnode-soft/40">
                <TableCell>
                  <Checkbox aria-label={`选择话题 ${t.title}`} checked={selected.includes(t.id)} onCheckedChange={() => toggleSelect(t.id)} />
                </TableCell>
                <TableCell className="max-w-2xl">
                  <div className="flex min-w-0 items-start gap-3">
                    <TagBadge tab={t.tab} />
                    <div className="flex min-w-0 flex-col gap-2">
                      <a href={`/topic/${t.id}`} className="line-clamp-2 font-medium leading-6 text-foreground hover:text-primary hover:underline">
                        {t.title}
                      </a>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>#{t.id}</span>
                        {t.status ? <span>status: {t.status}</span> : null}
                        {t.deleted > 0 ? <Badge variant="destructive">已删除</Badge> : null}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {t.top > 0 && <StatusBadge type="top" />}
                    {t.good > 0 && <StatusBadge type="good" />}
                    {t.lock > 0 && <StatusBadge type="lock" />}
                    {t.archived > 0 && <StatusBadge type="archived" />}
                    {t.status === "muted" && <StatusBadge type="muted" />}
                    {t.top <= 0 && t.good <= 0 && t.lock <= 0 && t.archived <= 0 && t.status !== "muted" && t.deleted <= 0 ? <Badge variant="outline">正常</Badge> : null}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <span className="rounded-lg bg-surface-subtle px-2 py-1"><b>{t.reply_count}</b><br /><span className="text-xs text-muted-foreground">回复</span></span>
                    <span className="rounded-lg bg-surface-subtle px-2 py-1"><b>{t.visit_count}</b><br /><span className="text-xs text-muted-foreground">浏览</span></span>
                    <span className="rounded-lg bg-surface-subtle px-2 py-1"><b>{t.collect_count}</b><br /><span className="text-xs text-muted-foreground">收藏</span></span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  <div>创建 <TimeAgo date={t.create_at} /></div>
                  {t.update_at ? <div>更新 <TimeAgo date={t.update_at} /></div> : null}
                  {t.last_reply_at ? <div>回复 <TimeAgo date={t.last_reply_at} /></div> : null}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" disabled={actionPending} onClick={() => handleAction("top", t.id)}>{actionPending ? "处理中" : "置顶"}</Button>
                    {isAdmin ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(event) => {
                          permanentDeleteFinalFocusRef.current = event.currentTarget;
                          setPermanentDeleteIds([t.id]);
                        }}
                      >永久删除</Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
          </div>
          <div className="px-4 pb-4">
            <Pagination page={page} total={total} limit={limit} basePath="/admin/topics" searchParams={paginationParams} />
          </div>
          <ConfirmationDialog
            open={muteIds.length > 0}
            onOpenChange={(open) => !open && setMuteIds([])}
            title="确认切换话题可见性"
            description={<>将切换 {muteIds.length} 个话题的隐藏状态，影响其公开列表和详情页可见性。该操作不会删除内容，也没有限时 undo。</>}
            confirmLabel={`确认切换 ${muteIds.length} 个话题`}
            pending={actionPending}
            finalFocus={muteFinalFocusRef}
            onConfirm={() => runAction("mute", muteIds)}
          />
          <ConfirmationDialog
            open={softDeleteIds.length > 0}
            onOpenChange={(open) => !open && setSoftDeleteIds([])}
            title="确认删除话题"
            description={<>将软删除 {softDeleteIds.length} 个话题，使其从公开列表和详情页隐藏。该操作不同于从数据库永久删除。</>}
            confirmLabel={`确认删除 ${softDeleteIds.length} 个话题`}
            pendingLabel="删除中"
            pending={actionPending}
            finalFocus={softDeleteFinalFocusRef}
            onConfirm={() => runAction("delete", softDeleteIds)}
          />
          <ConfirmationDialog
            open={permanentDeleteIds.length > 0}
            onOpenChange={(open) => !open && setPermanentDeleteIds([])}
            title="确认从数据库永久删除话题"
            description={<>将永久删除 {permanentDeleteIds.length} 个话题及其回复、收藏、招聘扩展、巡检命中和消息引用。该操作不同于普通删除，无法通过系统自动恢复。</>}
            confirmLabel={`确认永久删除 ${permanentDeleteIds.length} 个话题`}
            pendingLabel="永久删除中"
            pending={permanentDeletePending}
            finalFocus={permanentDeleteFinalFocusRef}
            onConfirm={() => runPermanentDelete(permanentDeleteIds)}
          />
        </AdminPanel>
      </AdminPage>
    </AdminLayout>
  );
}
