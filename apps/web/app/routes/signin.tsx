import { Layout } from "~/components/Layout";
import { Link, useNavigate, useSearchParams } from "react-router";
import { apiFetch } from "~/lib/api-client";
import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signinSchema } from "@cnode/shared";
import type { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { AuthShell } from "~/components/AuthShell";
import { redirectIfAuthenticated } from "~/lib/auth";

type SigninValues = z.infer<typeof signinSchema>;

export function meta() {
  return [{ title: "登录 · CNode" }];
}

export async function loader({ request }: { request: Request }) {
  await redirectIfAuthenticated(request);
  return null;
}

export default function Signin() {
  const [loading, setLoading] = useState(false);
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

  const onSubmit = async (values: SigninValues) => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; error_msg?: string }>(
        "/api/v1/auth/local/login",
        { method: "POST", body: JSON.stringify(values) },
      );
      if (res.success) {
        toast.success("登录成功");
        navigate("/");
      } else {
        toast.error(res.error_msg || "登录失败");
      }
    } catch {
      toast.error("网络错误,请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <AuthShell
        eyebrow="WELCOME BACK"
        title="回到 CNode 社区"
        description="登录后可以发布话题、参与回复、收藏内容并接收与你相关的站内消息。"
      >
          <CardHeader>
            <CardTitle>登录</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {errParam && (
              <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {errorMsg[errParam] || errParam}
              </div>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>用户名 / 邮箱</FormLabel>
                      <FormControl>
                        <Input placeholder="用户名 / 邮箱" {...field} />
                      </FormControl>
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
                      <FormControl>
                        <Input type="password" placeholder="密码" {...field} />
                      </FormControl>
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
            </CardContent>
      </AuthShell>
    </Layout>
  );
}
