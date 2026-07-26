import { Layout } from "~/components/Layout";
import { Link, useNavigate } from "react-router";
import { apiFetch } from "~/lib/api-client";
import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "@cnode/shared";
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
} from "~/components/ui/form";
import { CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { AuthShell } from "~/components/AuthShell";
import { redirectIfAuthenticated } from "~/lib/auth";

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
  return null;
}

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { loginname: "", pass: "", confirmPass: "", email: "" },
  });

  const onSubmit = async (values: SignupValues) => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; error_msg?: string; message?: string }>(
        "/api/v1/auth/local/signup",
        {
          method: "POST",
          body: JSON.stringify({
            loginname: values.loginname,
            pass: values.pass,
            email: values.email,
          }),
        },
      );
      if (res.success) {
        toast.success(res.message || "注册成功,请查收邮件激活账号");
        setTimeout(() => navigate("/signin"), 3000);
      } else {
        toast.error(res.error_msg || "注册失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <AuthShell
        eyebrow="JOIN CNODE"
        title="创建社区账号"
        description="加入后可以发布问题、分享项目、参与讨论，并保存对你有价值的话题。"
      >
          <CardHeader>
            <CardTitle>注册</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="loginname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>用户名</FormLabel>
                      <FormControl>
                        <Input placeholder="字母/数字/_/-" {...field} />
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
                        <Input type="password" placeholder="至少8位,含字母和数字" {...field} />
                      </FormControl>
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
                      <FormControl>
                        <Input type="password" placeholder="再次输入密码" {...field} />
                      </FormControl>
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
                      <FormControl>
                        <Input type="email" placeholder="your@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "注册中..." : "注册"}
                </Button>
              </form>
            </Form>
            <div className="mt-4 text-sm text-muted-foreground text-center">
              <Link to="/signin" className="text-primary hover:underline">
                已有账号? 登录
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
