import { Layout } from "~/components/Layout";
import { apiFetch } from "~/lib/api-client";
import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { AuthShell } from "~/components/AuthShell";
import { useAsyncAction } from "~/hooks/use-async-action";
import { AccountPage } from "~/components/PageShell";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";

export function meta() {
  return [{ title: "重置密码 · CNode" }];
}

export default function ResetPass() {
  const [params] = useSearchParams();
  const key = params.get("key") || "";
  const [newPass, setNewPass] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const passValid = newPass.length >= 8 && /[a-zA-Z]/.test(newPass) && /[0-9]/.test(newPass);

  const { run: doReset, pending: loading } = useAsyncAction(
    async () => {
      return apiFetch<{ success: boolean; error_msg?: string; message?: string }>(
        "/api/v1/auth/local/reset_pass",
        { method: "POST", body: JSON.stringify({ key, psw: newPass }) },
      );
    },
    {
      onError: () => setError("网络错误"),
      onSuccess: (res) => {
        if (res.success) {
          setSuccess("密码已重置,正在跳转登录页...");
          setTimeout(() => navigate("/signin"), 2000);
        } else {
          setError(res.error_msg || "重置失败");
        }
      },
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!key) {
      setError("无效的重置链接");
      return;
    }
    if (!passValid) {
      setError("密码至少 8 位,必须包含字母和数字");
      return;
    }
    doReset();
  };

  return (
    <Layout>
      <AccountPage className="max-w-none">
        <AuthShell
          eyebrow="RESET PASSWORD"
          title="重新设置你的访问凭证"
          description="使用邮件中的安全链接设置新密码，完成后即可继续参与社区讨论。"
        >
          <h2 className="mb-6 text-lg font-semibold tracking-tight">重置密码</h2>
          <div>
            {success && (
              <Alert>
                <AlertDescription role="status">{success}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} aria-busy={loading}>
              <FieldGroup>
                <Field data-invalid={(newPass.length > 0 && !passValid) || !!error}>
                  <FieldLabel htmlFor="new-password">新密码</FieldLabel>
                  <Input
                    id="new-password"
                    name="new-password"
                    type="password"
                    autoComplete="new-password"
                    spellCheck={false}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    aria-invalid={(newPass.length > 0 && !passValid) || !!error}
                    aria-describedby="new-password-help new-password-error"
                    placeholder="至少8位,含字母和数字"
                    required
                  />
                  <FieldDescription id="new-password-help">
                    密码需至少 8 位,包含字母和数字
                  </FieldDescription>
                  <FieldError id="new-password-error">{error}</FieldError>
                </Field>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "提交中..." : "重置密码"}
                </Button>
                {loading && (
                  <p role="status" className="text-center text-sm text-muted-foreground">
                    正在重置密码
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
