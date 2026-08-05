import { Layout } from "~/components/Layout";
import { Link, useNavigate, useSearchParams } from "react-router";
import { apiFetch } from "~/lib/api-client";
import { useAsyncAction } from "~/hooks/use-async-action";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signinBodySchema as signinSchema } from "@cnode/shared";
import type { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/Form";
import { AuthShell } from "~/components/AuthShell";
import { redirectIfAuthenticated } from "~/lib/auth";
import { AccountPage } from "~/components/PageShell";
import { Alert, AlertDescription } from "~/components/ui/alert";

type SigninValues = z.infer<typeof signinSchema>;

export function meta() {
  return [{ title: "登录 · CNode" }];
}

export async function loader({ request }: { request: Request }) {
  await redirectIfAuthenticated(request);
  return null;
}

export default function Signin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const errParam = params.get("error");
  const errorMsg: Record<string, string> = {
    github_not_configured: "GitHub OAuth 未配置",
    github_cancelled: "GitHub 授权已取消",
    github_failed: "GitHub 登录失败",
    no_github_email: "GitHub 账号未公开 Email",
    github_state_invalid: "GitHub 登录状态校验失败，请重试",
    github_bind_login_required: "请先登录后再绑定 GitHub",
  };

  const form = useForm<SigninValues>({
    resolver: zodResolver(signinSchema),
    defaultValues: { name: "", pass: "" },
  });

  const { run: onSubmit, pending: loading } = useAsyncAction(
    async (values: SigninValues) => {
      return apiFetch<{ success: boolean; error_msg?: string }>("/api/v1/auth/local/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
    },
    {
      errorMessage: "网络错误,请稍后重试",
      onSuccess: (res) => {
        if (res.success) {
          toast.success("登录成功");
          void navigate("/");
        } else {
          toast.error(res.error_msg || "登录失败");
        }
      },
    },
  );

  return (
    <Layout>
      <AccountPage className="max-w-none">
        <AuthShell
          eyebrow="WELCOME BACK"
          title="回到 CNode 社区"
          description="登录后可以发布话题、参与回复、收藏内容并接收与你相关的站内消息。"
        >
          <h2 className="mb-6 text-lg font-semibold tracking-tight">登录</h2>
          <div>
            {errParam && (
              <Alert variant="destructive">
                <AlertDescription>{errorMsg[errParam] || errParam}</AlertDescription>
              </Alert>
            )}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                aria-busy={loading}
                className="flex flex-col gap-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>用户名 / 邮箱</FormLabel>
                      <FormControl
                        render={
                          <Input
                            autoComplete="username"
                            spellCheck={false}
                            placeholder="用户名 / 邮箱"
                            {...field}
                          />
                        }
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>密码</FormLabel>
                      <FormControl
                        render={
                          <Input
                            type="password"
                            autoComplete="current-password"
                            spellCheck={false}
                            placeholder="密码"
                            {...field}
                          />
                        }
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="text-right text-sm">
                  <Link to="/search_pass" className="text-primary hover:underline">
                    忘记密码?
                  </Link>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "登录中..." : "登录"}
                </Button>
                {loading && (
                  <p role="status" className="text-center text-sm text-muted-foreground">
                    正在登录
                  </p>
                )}
              </form>
            </Form>
            <div className="mt-4 text-sm text-muted-foreground text-center">
              <Link to="/signup" className="text-primary hover:underline">
                没有账号? 注册
              </Link>
              <span className="mx-2">·</span>
              <Link to="/auth/github" className="text-primary hover:underline">
                GitHub 登录
              </Link>
            </div>
          </div>
        </AuthShell>
      </AccountPage>
    </Layout>
  );
}
