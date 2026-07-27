import type { Route } from "../../.react-router/types/app/routes/+types/setting";
import { Layout } from "~/components/Layout";
import { apiFetch } from "~/lib/api-client";
import { requireUser } from "~/lib/auth";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "~/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ContentPage } from "~/components/PageShell";

const profileSchema = z.object({
  url: z.string().optional(),
  location: z.string().optional(),
  signature: z.string().optional(),
  weibo: z.string().optional(),
  receive_reply_mail: z.boolean(),
  receive_at_mail: z.boolean(),
});

const changePassSchema = z.object({
  oldPass: z.string().min(1, "请输入当前密码"),
  newPass: z
    .string()
    .min(8, "密码至少 8 位")
    .regex(/[a-zA-Z]/, "必须包含字母")
    .regex(/[0-9]/, "必须包含数字"),
});

type ProfileValues = z.infer<typeof profileSchema>;
type ChangePassValues = z.infer<typeof changePassSchema>;

export function meta() {
  return [{ title: "设置 · CNode" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  return { user };
}

export default function Setting({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData as any;
  const [params] = useSearchParams();

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      url: user?.url || "",
      location: user?.location || "",
      signature: user?.signature || "",
      weibo: user?.weibo || "",
      receive_reply_mail: !!user?.receive_reply_mail,
      receive_at_mail: !!user?.receive_at_mail,
    },
  });

  const passForm = useForm<ChangePassValues>({
    resolver: zodResolver(changePassSchema),
    defaultValues: { oldPass: "", newPass: "" },
  });

  const [tokenLoading, setTokenLoading] = useState(false);

  useEffect(() => {
    if (params.get("github") === "bound") toast.success("GitHub 已绑定");
    if (params.get("error") === "github_already_bound") toast.error("该 GitHub 账号已绑定到其他用户");
  }, [params]);

  const onProfileSubmit = async (values: ProfileValues) => {
    const res = await apiFetch<{ success: boolean; error_msg?: string }>(
      "/api/v1/auth/local/setting",
      { method: "POST", body: JSON.stringify(values) },
    );
    if (res.success) toast.success("设置已保存");
    else toast.error(res.error_msg || "保存失败");
  };

  const onPassSubmit = async (values: ChangePassValues) => {
    const res = await apiFetch<{ success: boolean; error_msg?: string }>(
      "/api/v1/auth/local/change_pass",
      { method: "POST", body: JSON.stringify(values) },
    );
    if (res.success) {
      toast.success("密码已修改");
      passForm.reset({ oldPass: "", newPass: "" });
    } else {
      toast.error(res.error_msg || "修改失败");
    }
  };

  const handleRefreshToken = async () => {
    setTokenLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; accessToken?: string; error_msg?: string }>(
        "/api/v1/user/refresh_token",
        { method: "POST" },
      );
      if (res.success && res.accessToken) {
        toast.success("Token 已刷新", { description: res.accessToken });
      } else {
        toast.error(res.error_msg || "刷新失败");
      }
    } finally {
      setTokenLoading(false);
    }
  };

  return (
    <Layout>
      <ContentPage className="space-y-6">
        <section className="rounded-3xl border border-cnode-green/20 bg-cnode-soft p-6 sm:p-8">
          <p className="text-sm font-medium text-primary">SETTINGS</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">用户设置</h1>
          <p className="mt-2 text-sm text-muted-foreground">维护个人资料、通知偏好、密码和 API Token。</p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-6">
        <Card>
          <CardHeader className="border-b border-border/80 bg-surface-subtle">
            <CardTitle>账号身份</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-1 text-sm">
              <div className="font-medium">邮箱</div>
              <div className="break-all text-muted-foreground">{user?.email || "-"}</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="font-medium">GitHub</div>
              {user?.github_bound ? (
                <div className="text-muted-foreground">已绑定 {user.github_username || "GitHub 账号"}</div>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link to="/auth/github?intent=bind">绑定 GitHub</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b border-border/80 bg-surface-subtle">
            <CardTitle>个人资料</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>个人网站</FormLabel>
                      <FormControl>
                        <Input placeholder="https://" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>所在地</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="signature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>签名</FormLabel>
                      <FormControl>
                        <textarea
                          className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="weibo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>微博</FormLabel>
                      <FormControl>
                        <Input placeholder="https://weibo.com/xxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="receive_reply_mail"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!text-muted-foreground font-normal">
                        有人回复我的话题时邮件通知
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="receive_at_mail"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!text-muted-foreground font-normal">
                        有人 @我 时邮件通知
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <Button type="submit">保存</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/80 bg-surface-subtle">
            <CardTitle>修改密码</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...passForm}>
              <form onSubmit={passForm.handleSubmit(onPassSubmit)} className="space-y-4">
                <FormField
                  control={passForm.control}
                  name="oldPass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>当前密码</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="当前密码" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passForm.control}
                  name="newPass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>新密码</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="至少8位,含字母和数字" {...field} />
                      </FormControl>
                      <FormDescription>密码需至少 8 位,包含字母和数字</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">修改密码</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
          </div>

          <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardHeader className="border-b border-border/80 bg-surface-subtle">
            <CardTitle>API Token</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-2">
              刷新你的 accessToken,用于调用 CNode API
            </p>
            <Button variant="outline" onClick={handleRefreshToken} disabled={tokenLoading}>
              {tokenLoading ? "刷新中..." : "刷新 Token"}
            </Button>
          </CardContent>
        </Card>
            <Card className="border-cnode-green/20 bg-surface-subtle">
              <CardHeader className="border-b border-cnode-green/20 bg-cnode-soft">
                <CardTitle className="text-base">通知说明</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-6 text-sm text-muted-foreground">
                <p>站内消息会展示在消息中心。</p>
                <p>邮件通知取决于这里的两个偏好开关。</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </ContentPage>
    </Layout>
  );
}
