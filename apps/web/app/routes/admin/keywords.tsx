import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { apiFetch } from "~/lib/api-client";
import { useState } from "react";
import { useRevalidator } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
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
  return [{ title: "敏感词管理 · CNode Admin" }];
}

export async function loader({ request }: any) {
  await requireAdmin(request);
  const cookie = request.headers.get("cookie") || "";
  const res = await apiFetch<{ success: boolean; data: any[] }>("/api/v1/admin/keywords", {
    headers: { cookie },
  });
  return { keywords: res.success ? res.data || [] : [] };
}

export default function AdminKeywords({ loaderData }: any) {
  const { keywords } = loaderData;
  const [newWord, setNewWord] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const { revalidate } = useRevalidator();

  const handleAdd = async () => {
    if (!newWord.trim()) return;
    const res = await apiFetch<{ success: boolean; error_msg?: string }>("/api/v1/admin/keywords", {
      method: "POST",
      body: JSON.stringify({ word: newWord.trim() }),
    });
    if (res.success) {
      toast.success("已添加");
      setNewWord("");
      revalidate();
    } else {
      toast.error(res.error_msg || "添加失败");
    }
  };

  const handleDelete = async (id: number) => {
    const res = await apiFetch<{ success: boolean; error_msg?: string }>(
      `/api/v1/admin/keywords/${id}`,
      { method: "DELETE" },
    );
    if (res.success) {
      toast.success("已删除");
      revalidate();
    } else {
      toast.error(res.error_msg || "删除失败");
    }
  };

  const handleBulk = async () => {
    const lines = bulkText.split("\n").filter(Boolean);
    const res = await apiFetch<{ success: boolean; error_msg?: string }>(
      "/api/v1/admin/keywords/bulk",
      {
        method: "POST",
        body: JSON.stringify({ words: lines }),
      },
    );
    if (res.success) {
      toast.success(`已导入 ${lines.length} 条`);
      setBulkText("");
      setShowBulk(false);
      revalidate();
    } else {
      toast.error(res.error_msg || "导入失败");
    }
  };

  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader title="敏感词管理" description="维护巡检词库，让内容审核有稳定、可追踪的判断依据。" />
        <AdminPanel title="词库" description={`共 ${keywords.length} 个敏感词`}>
          <AdminToolbar className="items-stretch sm:items-center">
            <div className="flex w-full flex-col gap-2 sm:max-w-xl sm:flex-row">
              <Input
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="添加敏感词"
                className="flex-1"
              />
              <Button onClick={handleAdd}>添加</Button>
              <Button variant="outline" onClick={() => setShowBulk(!showBulk)}>
                批量导入
              </Button>
            </div>
          </AdminToolbar>
          {showBulk && (
            <div className="border-b border-border/80 bg-surface-subtle p-4">
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="一行一个词"
                rows={5}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
              <Button className="mt-2" onClick={handleBulk}>
                导入
              </Button>
            </div>
          )}
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>敏感词</TableHead>
              <TableHead>命中次数</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords.map((kw: any) => (
              <TableRow key={kw.id}>
                <TableCell>{kw.word}</TableCell>
                <TableCell className="text-muted-foreground">{kw.hit_count}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDelete(kw.id)}
                  >
                    删除
                  </Button>
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
