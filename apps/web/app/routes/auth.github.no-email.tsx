import { Link } from "react-router";
import { Layout } from "~/components/Layout";
import { AuthShell } from "~/components/AuthShell";
import { Button } from "~/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export function meta() {
  return [{ title: "GitHub 邮箱不可用 · CNode" }];
}

export default function GithubNoEmail() {
  return (
    <Layout>
      <AuthShell eyebrow="GITHUB EMAIL" title="GitHub 邮箱不可用" description="CNode 需要一个可用邮箱来创建或关联社区账号。">
        <CardHeader>
          <CardTitle>无法继续 GitHub 登录</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6 text-sm text-muted-foreground">
          <p>请到 GitHub 设置中公开邮箱，或确认主邮箱可通过 GitHub emails API 读取，然后重新登录。</p>
          <Button render={<Link to="/signin" />} className="w-full">
            返回登录
          </Button>
        </CardContent>
      </AuthShell>
    </Layout>
  );
}
