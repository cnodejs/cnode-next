import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { apiFetch } from "~/lib/api-client";
import { useRef, useState } from "react";
import { Form, useLocation, useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import { useAsyncAction } from "~/hooks/use-async-action";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
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
  return [{ title: "敏感词管理 · CNode Admin" }];
}

export async function loader({ request }: any) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Number(url.searchParams.get("limit")) || 50);
  const q = url.searchParams.get("q") || "";
  const cookie = request.headers.get("cookie") || "";
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) params.set("q", q);
  const res = await apiFetch<{ success: boolean; data: any[]; total?: number }>(
    `/api/v1/admin/keywords?${params.toString()}`,
    { headers: { cookie } },
  );
  return { keywords: res.success ? res.data || [] : [], total: res.total ?? 0, page, limit, q };
}

export default function AdminKeywords({ loaderData }: any) {
  const { keywords, total, page, limit, q } = loaderData;
  const [newWord, setNewWord] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; word: string } | null>(null);
  const deleteTriggerRef = useRef<HTMLElement | null>(null);
  const { revalidate } = useRevalidator();
  const location = useLocation();
  const navigate = useNavigate();

  const { run: runAdd, pending: adding } = useAsyncAction(
    () =>
      apiFetch<{ success: boolean; error_msg?: string }>("/api/v1/admin/keywords", {
        method: "POST",
        body: JSON.stringify({ word: newWord.trim() }),
      }),
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success("已添加");
          setNewWord("");
          revalidate();
        } else {
          toast.error(res.error_msg || "添加失败");
        }
      },
    },
  );

  const handleAdd = () => {
    if (!newWord.trim()) return;
    runAdd();
  };

  const { run: handleDelete, pending: deleting } = useAsyncAction(
    (id: number) =>
      apiFetch<{ success: boolean; error_msg?: string }>(`/api/v1/admin/keywords/${id}`, { method: "DELETE" }),
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success("已删除");
          setDeleteTarget(null);
          const fallback = previousPageAfterRemoval({ pathname: location.pathname, search: location.search, page, currentItemCount: keywords.length, removedCount: 1 });
          if (fallback) navigate(fallback, { replace: true });
          else revalidate();
        } else {
          toast.error(res.error_msg || "删除失败");
        }
      },
    },
  );

  const { run: runBulk, pending: importing } = useAsyncAction(
    async () => {
      const lines = bulkText.split("\n").filter(Boolean);
      const res = await apiFetch<{ success: boolean; error_msg?: string }>("/api/v1/admin/keywords/bulk", {
        method: "POST",
        body: JSON.stringify({ words: lines }),
      });
      return { ...res, count: lines.length };
    },
    {
      onSuccess: (result) => {
        if (result.success) {
          toast.success(`已导入 ${result.count} 条`);
          setBulkText("");
          setShowBulk(false);
          revalidate();
        } else {
          toast.error(result.error_msg || "导入失败");
        }
      },
    },
  );

  const handleBulk = () => {
    runBulk();
  };

  return (
    <AdminLayout>
      <AdminPage archetype="data-list">
        <AdminPageHeader title="敏感词管理" description="维护巡检词库，让内容审核有稳定、可追踪的判断依据。" />
        <AdminPanel title="词库" description={`当前显示 ${keywords.length} / ${total} 个敏感词`} flush>
          <AdminToolbar className="items-stretch sm:items-center">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Form method="get" className="flex w-full gap-2 sm:max-w-sm">
                <Input name="q" defaultValue={q} placeholder="搜索敏感词" className="flex-1" />
                <Button type="submit" variant="outline">搜索</Button>
              </Form>
              <div className="flex w-full gap-2 sm:max-w-xl">
              <Input
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="添加敏感词"
                className="flex-1"
              />
               <Button onClick={handleAdd} disabled={adding || !newWord.trim()}>{adding ? "添加中" : "添加"}</Button>
              <Button variant="outline" onClick={() => setShowBulk(!showBulk)}>
                批量导入
              </Button>
              </div>
            </div>
          </AdminToolbar>
          {showBulk && (
            <div className="flex flex-col gap-2 border-t pt-4">
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="一行一个词"
                rows={5}
              />
               <Button onClick={handleBulk} disabled={importing || !bulkText.trim()}>
                 {importing ? "导入中" : "导入"}
              </Button>
            </div>
          )}
          <Table className="min-w-[560px]">
          <colgroup>
            <col />
            <col className="w-32" />
            <col className="w-24" />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead>敏感词</TableHead>
              <TableHead className="text-right">命中次数</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords.map((kw: any) => (
              <TableRow key={kw.id}>
                <TableCell className="max-w-md break-all">{kw.word}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{kw.hit_count}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(event) => {
                      deleteTriggerRef.current = event.currentTarget;
                      setDeleteTarget({ id: kw.id, word: kw.word });
                    }}
                  >
                    删除
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
          <ConfirmationDialog
            open={deleteTarget !== null}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            title="删除敏感词规则"
            description={<>将删除敏感词“{deleteTarget?.word}”。删除后新内容不再匹配该规则，历史巡检记录不会被删除。</>}
            confirmLabel="确认删除规则"
            pendingLabel="删除中"
            pending={deleting}
            finalFocus={deleteTriggerRef}
            onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
          />
          <Pagination page={page} total={total} limit={limit} basePath="/admin/keywords" searchParams={{ ...(q ? { q } : {}) }} />
        </AdminPanel>
      </AdminPage>
    </AdminLayout>
  );
}
