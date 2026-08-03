import { Layout } from "~/components/Layout";
import { Link, useNavigate } from "react-router";
import { apiFetch } from "~/lib/api-client";
import { useAsyncAction } from "~/hooks/use-async-action";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupBodySchema as signupSchema } from "@cnode/shared";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "~/components/Form";
import { AuthShell } from "~/components/AuthShell";
import { redirectIfAuthenticated } from "~/lib/auth";
import { TurnstileWidget, getTurnstileToken } from "~/components/TurnstileWidget";
import { AccountPage } from "~/components/PageShell";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "~/components/ui/empty";

const signupFormSchema = signupSchema
  .extend({
    confirmPass: z.string().min(8),
  })
  .refine((d) => d.pass === d.confirmPass, {
    message: "两次密码不一致",
    path: ["confirmPass"],
  });

type SignupValues = z.infer<typeof signupFormSchema>;

export function meta() {
  return [{ title: "注册 · CNode" }];
}

export async function loader({ request }: { request: Request }) {
  await redirectIfAuthenticated(request);
  const res = await apiFetch<{ success: boolean; data?: { allow_signup: boolean } }>("/api/v1/auth/config");
  return { allowSignup: res.success ? res.data?.allow_signup !== false : true };
}

export default function Signup({ loaderData }: any) {
  const navigate = useNavigate();
  const allowSignup = loaderData.allowSignup;

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { loginname: "", pass: "", confirmPass: "", email: "" },
  });

  const { run: onSubmit, pending: loading } = useAsyncAction(
    async (values: SignupValues) => {
      return apiFetch<{ success: boolean; error_msg?: string; message?: string }>(
        "/api/v1/auth/local/signup",
        {
          method: "POST",
          body: JSON.stringify({
            loginname: values.loginname,
            pass: values.pass,
            email: values.email,
            turnstileToken: getTurnstileToken(),
          }),
        },
      );
    },
    {
      errorMessage: "网络错误",
      onSuccess: (res) => {
        if (res.success) {
          toast.success(res.message || "注册成功,请查收邮件激活账号");
          setTimeout(() => navigate("/signin"), 3000);
        } else {
          toast.error(res.error_msg || "注册失败");
        }
      },
    },
  );

  return (
    <Layout>
      <AccountPage className="max-w-none">
      <AuthShell
        eyebrow="JOIN CNODE"
        title="创建社区账号"
        description="加入后可以发布问题、分享项目、参与讨论，并保存对你有价值的话题。"
      >
          <h2 className="mb-6 text-lg font-semibold tracking-tight">注册</h2>
          <div>
            {allowSignup ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} aria-busy={loading} className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="loginname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>用户名</FormLabel>
                      <FormControl
                        render={
                          <Input
                            autoComplete="username"
                            spellCheck={false}
                            placeholder="字母/数字/_/-"
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
                <FormField
                  control={form.control}
                  name="confirmPass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>确认密码</FormLabel>
                      <FormControl
                        render={
                          <Input
                            type="password"
                            autoComplete="new-password"
                            spellCheck={false}
                            placeholder="再次输入密码"
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>邮箱</FormLabel>
                      <FormControl
                        render={
                          <Input
                            type="email"
                            autoComplete="email"
                            spellCheck={false}
                            placeholder="your@email.com"
                            {...field}
                          />
                        }
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <TurnstileWidget />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "注册中..." : "注册"}
                </Button>
                {loading && <p role="status" className="text-center text-sm text-muted-foreground">正在注册账号</p>}
              </form>
            </Form>
            ) : (
              <Empty><EmptyHeader><EmptyTitle>暂不开放注册</EmptyTitle><EmptyDescription>当前暂不开放注册。</EmptyDescription></EmptyHeader></Empty>
            )}
            <div className="mt-4 text-sm text-muted-foreground text-center">
              <Link to="/signin" className="text-primary hover:underline">
                已有账号? 登录
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
