import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { AdminPage, AdminPageHeader, AdminPanel } from "~/components/AdminPage";

export function meta() {
  return [{ title: "系统设置 · CNode Admin" }];
}

export async function loader({ request }: any) {
  await requireAdmin(request);
  return {};
}

export default function AdminSettings() {
  const [config, setConfig] = useState({
    allow_signup: true,
    new_user_min_hours: 24,
    new_user_min_replies: 3,
    archive_days: 365,
    rate_topic: 1000,
    rate_reply: 1000,
    rate_signup_ip: 1000,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/v1/admin/settings", { method: "POST", body: JSON.stringify(config) });
      toast.success("已保存");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPage>
      <AdminPageHeader title="系统设置" description="维护注册、内容巡检、新用户门槛和基础限流策略。" />
      <Tabs defaultValue="registration" className="space-y-4">
        <TabsList className="h-auto flex-wrap justify-start bg-card p-1 shadow-card">
          <TabsTrigger value="registration">注册配置</TabsTrigger>
          <TabsTrigger value="moderators">版主配置</TabsTrigger>
          <TabsTrigger value="newuser">新用户限制</TabsTrigger>
          <TabsTrigger value="moderation">巡检配置</TabsTrigger>
          <TabsTrigger value="rate">限流配置</TabsTrigger>
        </TabsList>
        <TabsContent value="registration">
          <AdminPanel title="注册配置" description="控制新用户是否可以自主注册" contentClassName="space-y-5 p-5">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allow_signup"
                  aria-label="开放注册"
                  checked={config.allow_signup}
                  onCheckedChange={(v) => setConfig({ ...config, allow_signup: !!v })}
                />
                <Label htmlFor="allow_signup" className="font-normal">
                  开放注册
                </Label>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </Button>
          </AdminPanel>
        </TabsContent>
        <TabsContent value="newuser">
          <AdminPanel title="新用户限制" description="降低新注册账号的灌水和垃圾内容风险" contentClassName="space-y-5 p-5">
              <div className="space-y-2">
                <Label>注册多少小时后可发帖</Label>
                <Input
                  type="number"
                  value={config.new_user_min_hours}
                  onChange={(e) =>
                    setConfig({ ...config, new_user_min_hours: Number(e.target.value) })
                  }
                  className="w-32"
                />
              </div>
              <div className="space-y-2">
                <Label>回复多少条后可发帖</Label>
                <Input
                  type="number"
                  value={config.new_user_min_replies}
                  onChange={(e) =>
                    setConfig({ ...config, new_user_min_replies: Number(e.target.value) })
                  }
                  className="w-32"
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </Button>
          </AdminPanel>
        </TabsContent>
        <TabsContent value="moderation">
          <AdminPanel title="巡检配置" description="控制自动归档和巡检相关策略" contentClassName="space-y-5 p-5">
              <div className="space-y-2">
                <Label>归档天数 (无回复自动锁定)</Label>
                <Input
                  type="number"
                  value={config.archive_days}
                  onChange={(e) => setConfig({ ...config, archive_days: Number(e.target.value) })}
                  className="w-32"
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </Button>
          </AdminPanel>
        </TabsContent>
        <TabsContent value="rate">
          <AdminPanel title="限流配置" description="按用户维度限制每日发帖与回复频率" contentClassName="space-y-5 p-5">
              <div className="space-y-2">
                <Label>每用户每天发帖</Label>
                <Input
                  type="number"
                  value={config.rate_topic}
                  onChange={(e) => setConfig({ ...config, rate_topic: Number(e.target.value) })}
                  className="w-32"
                />
              </div>
              <div className="space-y-2">
                <Label>每用户每天回复</Label>
                <Input
                  type="number"
                  value={config.rate_reply}
                  onChange={(e) => setConfig({ ...config, rate_reply: Number(e.target.value) })}
                  className="w-32"
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </Button>
          </AdminPanel>
        </TabsContent>
        <TabsContent value="moderators">
          <AdminPanel title="版主配置" description="后续用于按板块配置管理权限" contentClassName="p-5">
            <div className="rounded-2xl border border-dashed border-border bg-surface-subtle p-6 text-sm text-muted-foreground">
              版主管理功能开发中
            </div>
          </AdminPanel>
        </TabsContent>
      </Tabs>
      </AdminPage>
    </AdminLayout>
  );
}

import { apiFetch } from "~/lib/api-client";
