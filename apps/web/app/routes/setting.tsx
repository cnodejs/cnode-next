import type { Route } from "../../.react-router/types/app/routes/+types/setting";
import { Layout } from "~/components/Layout";
import { apiFetch } from "~/lib/api-client";
import { requireUser } from "~/lib/auth";
import { githubUnbindSchema, type GithubUnbindInput } from "@cnode/shared";
import { useEffect, useRef, useState } from "react";
import { Link, useRevalidator, useSearchParams } from "react-router";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "~/components/Form";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { AccountPage, PageHeader } from "~/components/PageShell";
import { useAsyncAction } from "~/hooks/use-async-action";

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
  const revalidator = useRevalidator();
  const [unbindOpen, setUnbindOpen] = useState(false);
  const unbindTriggerRef = useRef<HTMLButtonElement | null>(null);

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

  const unbindForm = useForm<GithubUnbindInput>({
    resolver: zodResolver(githubUnbindSchema),
    defaultValues: { password: "" },
  });

  const { run: handleRefreshToken, pending: tokenLoading } = useAsyncAction(
    async () => {
      return apiFetch<{ success: boolean; accessToken?: string; error_msg?: string }>(
        "/api/v1/user/refresh_token",
        { method: "POST" },
      );
    },
    {
      onSuccess: (res) => {
        if (res.success && res.accessToken) {
          toast.success("Token 已刷新", { description: res.accessToken });
        } else {
          toast.error(res.error_msg || "刷新失败");
        }
      },
    },
  );

  useEffect(() => {
    if (params.get("github") === "bound") toast.success("GitHub 已绑定");
    if (params.get("error") === "github_already_bound")
      toast.error("该 GitHub 账号已绑定到其他用户");
    if (params.get("error") === "github_different_account") {
      toast.error("当前账号已绑定其他 GitHub 账号，请先解绑");
    }
  }, [params]);

  const handleUnbindOpenChange = (open: boolean) => {
    setUnbindOpen(open);
    if (!open) unbindForm.reset();
  };

  const onUnbindSubmit = async (values: GithubUnbindInput) => {
    const res = await apiFetch<{ success: boolean; error_msg?: string }>(
      "/api/v1/auth/github/unbind",
      { method: "POST", body: JSON.stringify(values) },
    );
    if (!res.success) {
      toast.error(res.error_msg || "解除绑定失败，请稍后重试");
      return;
    }
    toast.success("GitHub 已解除绑定");
    handleUnbindOpenChange(false);
    void revalidator.revalidate();
  };

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

  return (
    <Layout>
      <AccountPage className="max-w-6xl">
        <PageHeader
          breadcrumbs={[{ label: "首页", to: "/" }, { label: "用户设置" }]}
          title="用户设置"
          description="维护个人资料、通知偏好、密码和 API Token。"
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-w-0 flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>账号身份</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex flex-col gap-4 rounded-xl bg-muted p-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                      <Mail aria-hidden="true" className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">邮箱</span>
                        <Badge variant="secondary">已设置</Badge>
                      </div>
                      <div className="mt-1 break-all text-sm text-muted-foreground">
                        {user?.email || "-"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-4 rounded-xl bg-muted p-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground">
                      <svg
                        aria-hidden="true"
                        className="size-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.57-.3-5.27-1.29-5.27-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.75 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.71 5.39-5.29 5.68.42.36.79 1.06.79 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">GitHub</span>
                        <Badge variant={user?.github_bound ? "secondary" : "outline"}>
                          {user?.github_bound ? "已绑定" : "未绑定"}
                        </Badge>
                      </div>
                      <div className="mt-1 break-all text-sm text-muted-foreground">
                        {user?.github_bound
                          ? user.github_username || "GitHub 账号"
                          : "绑定后可使用 GitHub 快速登录"}
                      </div>
                    </div>
                  </div>
                  {user?.github_bound ? (
                    <Button
                      ref={unbindTriggerRef}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="self-start sm:self-auto"
                      onClick={() => setUnbindOpen(true)}
                    >
                      解除绑定
                    </Button>
                  ) : (
                    <Button
                      render={<Link to="/auth/github?intent=bind" />}
                      variant="outline"
                      size="sm"
                      className="self-start sm:self-auto"
                    >
                      绑定 GitHub
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>个人资料</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form
                    onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                    aria-busy={profileForm.formState.isSubmitting}
                    className="flex flex-col gap-4"
                  >
                    <FormField
                      control={profileForm.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>个人网站</FormLabel>
                          <FormControl
                            render={
                              <Input
                                type="url"
                                autoComplete="url"
                                spellCheck={false}
                                placeholder="https://"
                                {...field}
                              />
                            }
                          />
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
                          <FormControl
                            render={<Input autoComplete="address-level2" {...field} />}
                          />
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
                          <FormControl
                            render={
                              <Textarea rows={2} autoComplete="off" spellCheck={true} {...field} />
                            }
                          />
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
                          <FormControl
                            render={
                              <Input
                                type="url"
                                autoComplete="url"
                                spellCheck={false}
                                placeholder="https://weibo.com/xxx"
                                {...field}
                              />
                            }
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="receive_reply_mail"
                      render={({ field }) => (
                        <FormItem orientation="horizontal">
                          <FormControl
                            render={
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            }
                          />
                          <FormLabel className="font-normal text-muted-foreground">
                            有人回复我的话题时邮件通知
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="receive_at_mail"
                      render={({ field }) => (
                        <FormItem orientation="horizontal">
                          <FormControl
                            render={
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            }
                          />
                          <FormLabel className="font-normal text-muted-foreground">
                            有人 @我 时邮件通知
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                      {profileForm.formState.isSubmitting ? "保存中..." : "保存"}
                    </Button>
                    {profileForm.formState.isSubmitting && (
                      <p role="status" className="text-sm text-muted-foreground">
                        正在保存个人资料
                      </p>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>修改密码</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...passForm}>
                  <form
                    onSubmit={passForm.handleSubmit(onPassSubmit)}
                    aria-busy={passForm.formState.isSubmitting}
                    className="flex flex-col gap-4"
                  >
                    <FormField
                      control={passForm.control}
                      name="oldPass"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>当前密码</FormLabel>
                          <FormControl
                            render={
                              <Input
                                type="password"
                                autoComplete="current-password"
                                spellCheck={false}
                                placeholder="当前密码"
                                {...field}
                              />
                            }
                          />
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
                          <FormControl
                            render={
                              <Input
                                type="password"
                                autoComplete="new-password"
                                spellCheck={false}
                                placeholder="至少8位,含字母和数字"
                                {...field}
                              />
                            }
                          />
                          <FormDescription>密码需至少 8 位,包含字母和数字</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={passForm.formState.isSubmitting}>
                      {passForm.formState.isSubmitting ? "修改中..." : "修改密码"}
                    </Button>
                    {passForm.formState.isSubmitting && (
                      <p role="status" className="text-sm text-muted-foreground">
                        正在修改密码
                      </p>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>API Token</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  刷新你的 accessToken,用于调用 CNode API
                </p>
                <Button variant="outline" onClick={handleRefreshToken} disabled={tokenLoading}>
                  {tokenLoading ? "刷新中..." : "刷新 Token"}
                </Button>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>通知说明</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                <p>站内消息会展示在消息中心。</p>
                <p>邮件通知取决于这里的两个偏好开关。</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </AccountPage>
      <Dialog
        open={unbindOpen}
        onOpenChange={(open, eventDetails) => {
          if (!open && unbindForm.formState.isSubmitting) {
            eventDetails.cancel();
            return;
          }
          handleUnbindOpenChange(open);
        }}
      >
        <DialogContent finalFocus={unbindTriggerRef}>
          <DialogHeader>
            <DialogTitle>解除 GitHub 绑定</DialogTitle>
            <DialogDescription>
              解绑后将无法再使用 GitHub 登录。为保护账号安全，请输入当前 CNode 密码确认。
            </DialogDescription>
          </DialogHeader>
          <Form {...unbindForm}>
            <form
              onSubmit={unbindForm.handleSubmit(onUnbindSubmit)}
              className="flex flex-col gap-5"
            >
              <FormField
                control={unbindForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>当前密码</FormLabel>
                    <FormControl
                      render={<Input type="password" autoComplete="current-password" {...field} />}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Link
                to="/search_pass"
                className="inline-flex text-sm font-medium text-primary hover:underline"
              >
                忘记密码，先重置密码
              </Link>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={unbindForm.formState.isSubmitting}
                  onClick={() => handleUnbindOpenChange(false)}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={unbindForm.formState.isSubmitting}
                >
                  {unbindForm.formState.isSubmitting ? "解除中..." : "确认解除绑定"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
