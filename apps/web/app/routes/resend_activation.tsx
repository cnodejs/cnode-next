import { zodResolver } from "@hookform/resolvers/zod";
import { resendActivationBodySchema } from "@cnode/shared";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";
import type { z } from "zod";
import { AuthShell } from "~/components/AuthShell";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/Form";
import { Layout } from "~/components/Layout";
import { AccountPage } from "~/components/PageShell";
import { TurnstileWidget, getTurnstileToken } from "~/components/TurnstileWidget";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useAsyncAction } from "~/hooks/use-async-action";
import { apiFetch } from "~/lib/api-client";

type ResendActivationValues = z.infer<typeof resendActivationBodySchema>;

export function meta() {
  return [{ title: "重新发送激活邮件 · CNode" }];
}

export default function ResendActivation() {
  const [params] = useSearchParams();
  const [result, setResult] = useState<{ kind: "success" | "error"; message: string } | null>(
    params.get("error") === "account_inactive"
      ? { kind: "error", message: "账号尚未激活，请重新发送激活邮件。" }
      : null,
  );
  const form = useForm<ResendActivationValues>({
    resolver: zodResolver(resendActivationBodySchema),
    defaultValues: { name: params.get("name") || "", pass: "", turnstileToken: "" },
  });
  const { run: onSubmit, pending } = useAsyncAction(
    async (values: ResendActivationValues) =>
      apiFetch<{
        success: boolean;
        error_code?: string;
        error_msg?: string;
        message?: string;
      }>("/api/v1/auth/local/resend_activation", {
        method: "POST",
        body: JSON.stringify({ ...values, turnstileToken: getTurnstileToken() }),
      }),
    {
      onError: () => setResult({ kind: "error", message: "网络错误，请稍后重试" }),
      onSuccess: (response) =>
        setResult(
          response.success
            ? { kind: "success", message: response.message || "请求已处理，请检查邮箱" }
            : { kind: "error", message: response.error_msg || "激活邮件发送失败，请稍后重试" },
        ),
    },
  );

  return (
    <Layout>
      <AccountPage className="max-w-none">
        <AuthShell
          eyebrow="ACCOUNT ACTIVATION"
          title="重新发送激活邮件"
          description="验证账号密码后，我们会为尚未激活的账号生成新的激活链接。"
        >
          <h2 className="mb-6 text-lg font-semibold tracking-tight">账号激活</h2>
          <div className="flex flex-col gap-4">
            {result && (
              <Alert
                variant={result.kind === "error" ? "destructive" : "default"}
                role={result.kind === "error" ? "alert" : "status"}
              >
                <AlertDescription className="min-w-0 break-words">
                  {result.message}
                </AlertDescription>
              </Alert>
            )}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                aria-busy={pending}
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
                            placeholder="当前密码"
                            {...field}
                          />
                        }
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <TurnstileWidget />
                <Button type="submit" disabled={pending} className="w-full">
                  {pending ? "发送中..." : "重新发送激活邮件"}
                </Button>
                {pending && (
                  <p role="status" className="text-center text-sm text-muted-foreground">
                    正在发送激活邮件
                  </p>
                )}
              </form>
            </Form>
            <div className="text-sm text-muted-foreground">
              <Link to="/signin" className="hover:text-primary">
                返回登录
              </Link>
            </div>
          </div>
        </AuthShell>
      </AccountPage>
    </Layout>
  );
}
