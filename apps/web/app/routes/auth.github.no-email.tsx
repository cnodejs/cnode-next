import { Link } from "react-router";
import { Layout } from "~/components/Layout";
import { AuthShell } from "~/components/AuthShell";
import { Button } from "~/components/ui/button";
import { AccountPage } from "~/components/PageShell";

export function meta() {
  return [{ title: "GitHub 邮箱不可用 · CNode" }];
}

export default function GithubNoEmail() {
  return (
    <Layout>
      <AccountPage className="max-w-none">
        <AuthShell
          eyebrow="GITHUB EMAIL"
          title="GitHub 邮箱不可用"
          description="CNode 需要一个可用邮箱来创建或关联社区账号。"
        >
          <h2 className="mb-6 text-lg font-semibold tracking-tight">无法继续 GitHub 登录</h2>
          <div className="flex flex-col gap-4 text-sm text-muted-foreground">
            <p>
              请到 GitHub 设置中公开邮箱，或确认主邮箱可通过 GitHub emails API 读取，然后重新登录。
            </p>
            <Button render={<Link to="/signin" />} className="w-full">
              返回登录
            </Button>
          </div>
        </AuthShell>
      </AccountPage>
    </Layout>
  );
}
