import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { useState, useEffect } from "react";
import { useRevalidator } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { AdminPage, AdminPageHeader, AdminPanel } from "~/components/AdminPage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { apiFetch } from "~/lib/api-client";

export function meta() {
  return [{ title: "Tab 管理 · CNode Admin" }];
}

interface TabRow {
  id: number;
  key: string;
  label: string;
  visible: boolean;
  sort_order: number;
}

export async function loader({ request }: { request: Request }) {
  await requireAdmin(request);
  const cookie = request.headers.get("cookie") || "";
  const res = await apiFetch<{ success: boolean; data: TabRow[] }>("/api/v1/admin/tabs", {
    headers: { cookie },
  });
  return { tabs: res.success ? res.data : [] };
}

export default function AdminTabs({ loaderData }: { loaderData: any }) {
  const { tabs: initialTabs } = loaderData as { tabs: TabRow[] };
  const [tabs, setTabs] = useState<TabRow[]>(initialTabs);
  const [saving, setSaving] = useState<number | null>(null);
  const { revalidate } = useRevalidator();

  useEffect(() => {
    setTabs(initialTabs);
  }, [initialTabs]);

  function updateField(id: number, field: keyof TabRow, value: any) {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  }

  async function saveTab(id: number) {
    const tab = tabs.find((t) => t.id === id);
    if (!tab) return;
    setSaving(id);
    try {
      const res = await apiFetch<{ success: boolean; error_msg?: string }>(
        `/api/v1/admin/tabs/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            label: tab.label,
            visible: tab.visible,
            sort_order: tab.sort_order,
          }),
        },
      );
      if (res.success) {
        toast.success("已保存");
        revalidate();
      } else {
        toast.error(res.error_msg || "保存失败");
      }
    } finally {
      setSaving(null);
    }
  }

  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader title="Tab 管理" description="控制首页 tab 按钮的可见性、标签和排序。" />
        <AdminPanel title="Tab 列表" description={`共 ${tabs.length} 个 tab`}>
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Key (只读)</TableHead>
                  <TableHead className="min-w-32">标签</TableHead>
                  <TableHead className="w-20">可见</TableHead>
                  <TableHead className="w-20">排序</TableHead>
                  <TableHead className="w-24 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tabs.map((tab) => (
                  <TableRow key={tab.id}>
                    <TableCell className="font-mono text-xs">{tab.key}</TableCell>
                    <TableCell>
                      <Input
                        value={tab.label}
                        onChange={(e) => updateField(tab.id, "label", e.target.value)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={tab.visible}
                        onCheckedChange={(v) => updateField(tab.id, "visible", !!v)}
                        aria-label="Tab 可见"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={tab.sort_order}
                        onChange={(e) => updateField(tab.id, "sort_order", Number(e.target.value))}
                        className="h-8 w-16"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => saveTab(tab.id)}
                        disabled={saving === tab.id}
                      >
                        {saving === tab.id ? "保存中..." : "保存"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </AdminPanel>
      </AdminPage>
    </AdminLayout>
  );
}
