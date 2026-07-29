import { Layout } from "~/components/Layout";
import { apiFetch } from "~/lib/api-client";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { AuthShell } from "~/components/AuthShell";
import { TurnstileWidget, getTurnstileToken } from "~/components/TurnstileWidget";
import { useAsyncAction } from "~/hooks/use-async-action";

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
      <AuthShell
        eyebrow="ACCOUNT RECOVERY"
        title="找回你的 CNode 账号"
        description="输入注册邮箱后，我们会发送密码重置邮件，帮助你安全回到社区。"
      >
          <CardHeader>
            <CardTitle>找回密码</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {error && <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            {success && <div className="mb-4 rounded-md bg-cnode-soft p-3 text-sm text-cnode-ink">{success}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="注册邮箱"
                required
              />
              <TurnstileWidget />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "发送中..." : "发送重置邮件"}
              </Button>
            </form>
            <div className="mt-4 text-sm text-muted-foreground">
              <Link to="/signin" className="hover:text-primary">
                返回登录
              </Link>
            </div>
          </CardContent>
      </AuthShell>
    </Layout>
  );
}
