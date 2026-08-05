import { Layout } from "~/components/Layout";
import { apiFetch } from "~/lib/api-client";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { AuthShell } from "~/components/AuthShell";
import { TurnstileWidget, getTurnstileToken } from "~/components/TurnstileWidget";
import { useAsyncAction } from "~/hooks/use-async-action";
import { AccountPage } from "~/components/PageShell";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";

export function meta() {
  return [{ title: "找回密码 · CNode" }];
}

export default function SearchPass() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { run: doSearch, pending: loading } = useAsyncAction(
    async () => {
      return apiFetch<{ success: boolean; error_msg?: string; message?: string }>(
        "/api/v1/auth/local/search_pass",
        { method: "POST", body: JSON.stringify({ email, turnstileToken: getTurnstileToken() }) },
      );
    },
    {
      onError: () => setError("网络错误"),
      onSuccess: (res) => {
        if (res.success) {
          setSuccess(res.message || "重置邮件已发送");
        } else {
          setError(res.error_msg || "操作失败");
        }
      },
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    doSearch();
  };

  return (
    <Layout>
      <AccountPage className="max-w-none">
        <AuthShell
          eyebrow="ACCOUNT RECOVERY"
          title="找回你的 CNode 账号"
          description="输入注册邮箱后，我们会发送密码重置邮件，帮助你安全回到社区。"
        >
          <h2 className="mb-6 text-lg font-semibold tracking-tight">找回密码</h2>
          <div>
            {success && (
              <Alert>
                <AlertDescription role="status">{success}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} aria-busy={loading}>
              <FieldGroup>
                <Field data-invalid={!!error}>
                  <FieldLabel htmlFor="recovery-email">注册邮箱</FieldLabel>
                  <Input
                    id="recovery-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!error}
                    aria-describedby={error ? "email-error" : undefined}
                    placeholder="your@email.com"
                    required
                  />
                  <FieldError id="email-error">{error}</FieldError>
                </Field>
                <TurnstileWidget />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "发送中..." : "发送重置邮件"}
                </Button>
                {loading && (
                  <p role="status" className="text-center text-sm text-muted-foreground">
                    正在发送重置邮件
                  </p>
                )}
              </FieldGroup>
            </form>
            <div className="mt-4 text-sm text-muted-foreground">
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
