import type { Route } from "../../.react-router/types/app/routes/+types/auth.github.new";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Layout } from "~/components/Layout";
import { AuthShell } from "~/components/AuthShell";
import { apiFetch } from "~/lib/api-client";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { getAvatarFallback, getAvatarUrl } from "~/lib/brand";
import { useAsyncAction } from "~/hooks/use-async-action";
import { AccountPage } from "~/components/PageShell";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Field, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Item, ItemContent, ItemMedia, ItemTitle } from "~/components/ui/item";

export function meta() {
  return [{ title: "完成 GitHub 登录 · CNode" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const cookie = request.headers.get("cookie") || "";
  const res = await apiFetch<{ success: boolean; data?: any; error_msg?: string }>(
    "/api/v1/auth/github/pending",
    {
      headers: { cookie },
    },
  );
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
          void navigate("/");
        } else {
          toast.error(res.error_msg || "GitHub 登录失败");
        }
      },
    },
  );

  return (
    <Layout>
      <AccountPage className="max-w-none">
        <AuthShell
          eyebrow="GITHUB"
          title="完成 GitHub 登录"
          description="选择创建新账号，或把 GitHub 绑定到已有 CNode 账号。"
        >
          <h2 className="mb-6 text-lg font-semibold tracking-tight">选择账号处理方式</h2>
          <div className="flex flex-col gap-5">
            {!profile ? (
              <div className="flex flex-col gap-4 text-sm text-muted-foreground">
                <Alert variant="destructive">
                  <AlertDescription>
                    {error || "GitHub 登录状态已过期，请重新授权。"}
                  </AlertDescription>
                </Alert>
                <Button render={<a href="/auth/github" />} className="w-full">
                  重新授权
                </Button>
              </div>
            ) : (
              <>
                <Item variant="muted">
                  <ItemMedia>
                    <Avatar>
                      <AvatarImage
                        src={getAvatarUrl(profile.avatar_url, 40)}
                        alt={profile.loginname}
                      />
                      <AvatarFallback>{getAvatarFallback(profile.loginname)}</AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{profile.loginname}</ItemTitle>
                    <div className="truncate text-muted-foreground">{profile.email}</div>
                  </ItemContent>
                </Item>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setMode("new")}
                    aria-pressed={mode === "new"}
                    className={`rounded-lg border p-4 text-left text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 ${mode === "new" ? "bg-accent text-accent-foreground" : "bg-muted hover:bg-accent"}`}
                  >
                    <div className="font-medium">注册新账号</div>
                    <div className="mt-1 text-muted-foreground">
                      使用 GitHub 用户名创建新的 CNode 账号。
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("bind")}
                    aria-pressed={mode === "bind"}
                    className={`rounded-lg border p-4 text-left text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 ${mode === "bind" ? "bg-accent text-accent-foreground" : "bg-muted hover:bg-accent"}`}
                  >
                    <div className="font-medium">关联老账号</div>
                    <div className="mt-1 text-muted-foreground">
                      输入已有 CNode 账号密码完成绑定。
                    </div>
                  </button>
                </div>

                {mode === "bind" && (
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="github-bind-name">用户名</FieldLabel>
                      <Input
                        id="github-bind-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="github-bind-pass">密码</FieldLabel>
                      <Input
                        id="github-bind-pass"
                        type="password"
                        value={pass}
                        onChange={(event) => setPass(event.target.value)}
                      />
                    </Field>
                  </FieldGroup>
                )}

                <Button
                  className="w-full"
                  disabled={loading || (mode === "bind" && (!name || !pass))}
                  onClick={submit}
                >
                  {loading ? "处理中..." : mode === "new" ? "注册并登录" : "关联并登录"}
                </Button>
              </>
            )}
          </div>
        </AuthShell>
      </AccountPage>
    </Layout>
  );
}
