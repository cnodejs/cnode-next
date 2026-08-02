import type { Route } from "../../.react-router/types/app/routes/+types/auth.github.new";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Layout } from "~/components/Layout";
import { AuthShell } from "~/components/AuthShell";
import { apiFetch } from "~/lib/api-client";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { getAvatarFallback, getAvatarUrl } from "~/lib/brand";
import { useAsyncAction } from "~/hooks/use-async-action";

export function meta() {
  return [{ title: "完成 GitHub 登录 · CNode" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const cookie = request.headers.get("cookie") || "";
  const res = await apiFetch<{ success: boolean; data?: any; error_msg?: string }>("/api/v1/auth/github/pending", {
    headers: { cookie },
  });
  return { profile: res.success ? res.data : null, error: res.error_msg };
}

export default function GithubNew({ loaderData }: Route.ComponentProps) {
  const { profile, error } = loaderData as any;
  const navigate = useNavigate();
  const [mode, setMode] = useState<"new" | "bind">(profile?.email_exists ? "bind" : "new");
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");

  const { run: submit, pending: loading } = useAsyncAction(
    async () => {
      return apiFetch<{ success: boolean; error_msg?: string }>("/api/v1/auth/github/create", {
        method: "POST",
        body: JSON.stringify({ isnew: mode === "new", name, pass }),
      }).catch(() => ({ success: false, error_msg: "GitHub 登录失败" }));
    },
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success("GitHub 登录成功");
          navigate("/");
        } else {
          toast.error(res.error_msg || "GitHub 登录失败");
        }
      },
    },
  );

  return (
    <Layout>
      <AuthShell eyebrow="GITHUB" title="完成 GitHub 登录" description="选择创建新账号，或把 GitHub 绑定到已有 CNode 账号。">
        <CardHeader>
          <CardTitle>选择账号处理方式</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          {!profile ? (
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>{error || "GitHub 登录状态已过期，请重新授权。"}</p>
              <Button render={<a href="/auth/github" />} className="w-full">
                重新授权
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-subtle p-3">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={getAvatarUrl(profile.avatar_url, 40)} alt={profile.loginname} />
                  <AvatarFallback>{getAvatarFallback(profile.loginname)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-sm">
                  <div className="truncate font-medium">{profile.loginname}</div>
                  <div className="truncate text-muted-foreground">{profile.email}</div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMode("new")}
                  className={`rounded-xl border p-4 text-left text-sm ${mode === "new" ? "border-cnode-green bg-cnode-soft" : "border-border"}`}
                >
                  <div className="font-medium">注册新账号</div>
                  <div className="mt-1 text-muted-foreground">使用 GitHub 用户名创建新的 CNode 账号。</div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("bind")}
                  className={`rounded-xl border p-4 text-left text-sm ${mode === "bind" ? "border-cnode-green bg-cnode-soft" : "border-border"}`}
                >
                  <div className="font-medium">关联老账号</div>
                  <div className="mt-1 text-muted-foreground">输入已有 CNode 账号密码完成绑定。</div>
                </button>
              </div>

              {mode === "bind" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="github-bind-name">用户名</Label>
                    <Input id="github-bind-name" value={name} onChange={(event) => setName(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github-bind-pass">密码</Label>
                    <Input id="github-bind-pass" type="password" value={pass} onChange={(event) => setPass(event.target.value)} />
                  </div>
                </div>
              )}

              <Button className="w-full" disabled={loading || (mode === "bind" && (!name || !pass))} onClick={submit}>
                {loading ? "处理中..." : mode === "new" ? "注册并登录" : "关联并登录"}
              </Button>
            </>
          )}
        </CardContent>
      </AuthShell>
    </Layout>
  );
}
