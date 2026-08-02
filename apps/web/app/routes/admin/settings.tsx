import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { useState } from "react";
import { useAsyncAction } from "~/hooks/use-async-action";
import { useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { AdminPage, AdminPageHeader, AdminPanel } from "~/components/AdminPage";
import { apiFetch } from "~/lib/api-client";
import { toast } from "sonner";

export function meta() {
  return [{ title: "系统设置 · CNode Admin" }];
}

export async function loader({ request }: any) {
  await requireAdmin(request);
  const cookie = request.headers.get("cookie") || "";
  const res = await apiFetch<{ success: boolean; data: any }>("/api/v1/admin/settings", { headers: { cookie } });
  const requestedTab = new URL(request.url).searchParams.get("tab");
  const tab = requestedTab === "newuser" || requestedTab === "rate" ? requestedTab : "registration";
  return {
    tab,
    config: res.success ? res.data : {
      allow_signup: true,
      new_user_min_hours: 24,
      new_user_min_replies: 3,
      rate_topic: 1000,
      rate_reply: 1000,
    },
  };
}

export default function AdminSettings({ loaderData }: any) {
  const [config, setConfig] = useState(loaderData.config);
  const [searchParams, setSearchParams] = useSearchParams();
  const { run: handleSave, pending: saving } = useAsyncAction(
    () => apiFetch<{ success: boolean; error_msg?: string }>("/api/v1/admin/settings", { method: "POST", body: JSON.stringify(config) }),
    {
      errorMessage: "保存失败",
      onSuccess: (result) => {
        if (result.success) toast.success("已保存");
        else toast.error(result.error_msg || "保存失败");
      },
    },
  );

  return (
    <AdminLayout>
      <AdminPage>
      <AdminPageHeader title="系统设置" description="维护注册、内容巡检、新用户门槛和基础限流策略。" />
      <Tabs
        value={loaderData.tab}
        onValueChange={(value) => {
          if (!value || value === loaderData.tab) return;
          const next = new URLSearchParams(searchParams);
          next.set("tab", value);
          setSearchParams(next);
        }}
        className="flex flex-col gap-4"
      >
        <TabsList className="h-auto flex-wrap justify-start bg-card p-1 shadow-card">
          <TabsTrigger value="registration">注册配置</TabsTrigger>
          <TabsTrigger value="newuser">新用户限制</TabsTrigger>
          <TabsTrigger value="rate">限流配置</TabsTrigger>
        </TabsList>
        <TabsContent value="registration">
          <AdminPanel title="注册配置" description="控制新用户是否可以自主注册" contentClassName="flex flex-col gap-5">
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
          <AdminPanel title="新用户限制" description="降低新注册账号的灌水和垃圾内容风险" contentClassName="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
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
              <div className="flex flex-col gap-2">
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
        <TabsContent value="rate">
          <AdminPanel title="限流配置" description="按用户维度限制每日发帖与回复频率" contentClassName="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label>每用户每天发帖</Label>
                <Input
                  type="number"
                  value={config.rate_topic}
                  onChange={(e) => setConfig({ ...config, rate_topic: Number(e.target.value) })}
                  className="w-32"
                />
              </div>
              <div className="flex flex-col gap-2">
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
      </Tabs>
      </AdminPage>
    </AdminLayout>
  );
}
