import { Link } from "react-router";
import { Layout } from "~/components/Layout";
import { ContentPage } from "~/components/PageShell";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

const sections = [
  ["账号", "登录后可以发布话题、回复讨论、收藏内容和接收消息通知。"],
  ["分类", "分享适合经验总结和项目发布；问答适合具体问题；招聘用于 Node.js 相关职位。"],
  ["提问", "说明运行环境、复现步骤、期望结果、实际结果和完整错误信息。"],
  ["Markdown", "使用代码块包裹日志和源码，长文用标题分段，引用资料请附链接。"],
  ["礼仪", "优先讨论事实和方案，避免催促、攻击和无上下文的求助。"],
];

export function meta() {
  return [{ title: "新手指南 · CNode" }];
}

export default function GetStart() {
  return (
    <Layout>
      <ContentPage className="space-y-8">
        <section className="rounded-3xl border border-cnode-green/20 bg-cnode-soft p-8 sm:p-10">
          <p className="text-sm font-medium text-primary">GET STARTED</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">更高效地参与 CNode</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">这份指南帮助新用户快速理解社区分类、提问方式和 Markdown 约定。</p>
          <Button asChild className="mt-6">
            <Link to="/topic/create">开始发布</Link>
          </Button>
        </section>
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map(([title, body]) => (
            <Card key={title}>
              <CardContent className="p-5">
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ContentPage>
    </Layout>
  );
}
