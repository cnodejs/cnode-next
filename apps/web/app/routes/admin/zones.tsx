import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { useState, useEffect } from "react";
import { useRevalidator } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
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
  return [{ title: "专区管理 · CNode Admin" }];
}

interface ZoneRow {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  visible: boolean;
  sort_order: number;
}

export async function loader({ request }: { request: Request }) {
  await requireAdmin(request);
  const cookie = request.headers.get("cookie") || "";
  const res = await apiFetch<{ success: boolean; data: ZoneRow[] }>("/api/v1/admin/zones", {
    headers: { cookie },
  });
  return { zones: res.success ? res.data : [] };
}

export default function AdminZones({ loaderData }: { loaderData: any }) {
  const { zones: initialZones } = loaderData as { zones: ZoneRow[] };
  const [zones, setZones] = useState<ZoneRow[]>(initialZones);
  const [saving, setSaving] = useState<number | null>(null);
  const { revalidate } = useRevalidator();

  useEffect(() => {
    setZones(initialZones);
  }, [initialZones]);

  function updateField(id: number, field: keyof ZoneRow, value: any) {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, [field]: value } : z)));
  }

  async function saveZone(id: number) {
    const zone = zones.find((z) => z.id === id);
    if (!zone) return;
    setSaving(id);
    try {
      const res = await apiFetch<{ success: boolean; error_msg?: string }>(
        `/api/v1/admin/zones/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: zone.name,
            description: zone.description,
            icon: zone.icon,
            visible: zone.visible,
            sort_order: zone.sort_order,
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
      <AdminPage archetype="data-list">
        <AdminPageHeader title="专区管理" description="控制专区在导航栏的可见性与排序。" />
        <AdminPanel title="专区列表" description={`共 ${zones.length} 个专区`} flush>
          <Table className="min-w-[820px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Slug</TableHead>
                <TableHead className="min-w-32">名称</TableHead>
                <TableHead className="min-w-40">描述</TableHead>
                <TableHead className="w-32">图标</TableHead>
                <TableHead className="w-28">可见状态</TableHead>
                <TableHead className="w-20">排序</TableHead>
                <TableHead className="w-24 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-mono text-xs">{zone.slug}</TableCell>
                  <TableCell>
                    <Input
                      aria-label={`${zone.slug} 名称`}
                      value={zone.name}
                      onChange={(e) => updateField(zone.id, "name", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      aria-label={`${zone.slug} 描述`}
                      value={zone.description || ""}
                      onChange={(e) => updateField(zone.id, "description", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      aria-label={`${zone.slug} 图标`}
                      value={zone.icon || ""}
                      onChange={(e) => updateField(zone.id, "icon", e.target.value)}
                      placeholder="lucide icon"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      size="sm"
                      variant={zone.visible ? "secondary" : "ghost"}
                      aria-pressed={zone.visible}
                      aria-label={`${zone.slug} 当前${zone.visible ? "可见" : "隐藏"}，点击切换`}
                      className="min-w-20 justify-start"
                      onClick={() => updateField(zone.id, "visible", !zone.visible)}
                    >
                      {zone.visible ? <Eye /> : <EyeOff />}
                      {zone.visible ? "显示" : "隐藏"}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Input
                      aria-label={`${zone.slug} 排序`}
                      type="number"
                      value={zone.sort_order}
                      onChange={(e) => updateField(zone.id, "sort_order", Number(e.target.value))}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => saveZone(zone.id)}
                      disabled={saving === zone.id}
                    >
                      {saving === zone.id ? "保存中…" : "保存"}
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
