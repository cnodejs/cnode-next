import { requireAdmin } from "~/lib/auth";
import { AdminLayout } from "~/components/AdminLayout";
import { useState } from "react";
import { useAsyncAction } from "~/hooks/use-async-action";
import { useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { AdminPage, AdminPageHeader, AdminPanel } from "~/components/AdminPage";
import { apiFetch } from "~/lib/api-client";
import { toast } from "sonner";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "~/components/ui/field";

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
      <AdminPage archetype="workflow">
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
        <TabsList className="w-full max-w-3xl flex-wrap justify-start">
          <TabsTrigger value="registration" className="flex-none">注册配置</TabsTrigger>
          <TabsTrigger value="newuser" className="flex-none">新用户限制</TabsTrigger>
          <TabsTrigger value="rate" className="flex-none">限流配置</TabsTrigger>
        </TabsList>
        <TabsContent value="registration">
          <AdminPanel title="注册配置" description="控制新用户是否可以自主注册" className="max-w-3xl">
            <FieldSet>
              <FieldLegend className="sr-only">注册配置</FieldLegend>
              <FieldGroup>
              <Field orientation="responsive">
                <FieldLabel htmlFor="allow_signup">
                  开放注册
                </FieldLabel>
                <Checkbox
                  id="allow_signup"
                  aria-label="开放注册"
                  checked={config.allow_signup}
                  onCheckedChange={(v) => setConfig({ ...config, allow_signup: !!v })}
                />
              </Field>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "保存中..." : "保存"}
                </Button>
              </div>
              </FieldGroup>
            </FieldSet>
          </AdminPanel>
        </TabsContent>
        <TabsContent value="newuser">
          <AdminPanel title="新用户限制" description="降低新注册账号的灌水和垃圾内容风险" className="max-w-3xl">
            <FieldSet>
              <FieldLegend className="sr-only">新用户限制</FieldLegend>
              <FieldGroup>
              <Field orientation="responsive">
                <FieldLabel htmlFor="new-user-min-hours">注册多少小时后可发帖</FieldLabel>
                <Input
                  id="new-user-min-hours"
                  type="number"
                  value={config.new_user_min_hours}
                  onChange={(e) =>
                    setConfig({ ...config, new_user_min_hours: Number(e.target.value) })
                  }
                  className="w-32"
                />
              </Field>
              <Field orientation="responsive">
                <FieldLabel htmlFor="new-user-min-replies">回复多少条后可发帖</FieldLabel>
                <Input
                  id="new-user-min-replies"
                  type="number"
                  value={config.new_user_min_replies}
                  onChange={(e) =>
                    setConfig({ ...config, new_user_min_replies: Number(e.target.value) })
                  }
                  className="w-32"
                />
              </Field>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "保存中..." : "保存"}
                </Button>
              </div>
              </FieldGroup>
            </FieldSet>
          </AdminPanel>
        </TabsContent>
        <TabsContent value="rate">
          <AdminPanel title="限流配置" description="按用户维度限制每日发帖与回复频率" className="max-w-3xl">
            <FieldSet>
              <FieldLegend className="sr-only">限流配置</FieldLegend>
              <FieldGroup>
              <Field orientation="responsive">
                <FieldLabel htmlFor="rate-topic">每用户每天发帖</FieldLabel>
                <Input
                  id="rate-topic"
                  type="number"
                  value={config.rate_topic}
                  onChange={(e) => setConfig({ ...config, rate_topic: Number(e.target.value) })}
                  className="w-32"
                />
              </Field>
              <Field orientation="responsive">
                <FieldLabel htmlFor="rate-reply">每用户每天回复</FieldLabel>
                <Input
                  id="rate-reply"
                  type="number"
                  value={config.rate_reply}
                  onChange={(e) => setConfig({ ...config, rate_reply: Number(e.target.value) })}
                  className="w-32"
                />
              </Field>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "保存中..." : "保存"}
                </Button>
              </div>
              </FieldGroup>
            </FieldSet>
          </AdminPanel>
        </TabsContent>
      </Tabs>
      </AdminPage>
    </AdminLayout>
  );
}
