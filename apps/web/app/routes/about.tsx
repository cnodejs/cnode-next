import { Link } from "react-router";
import { Layout } from "~/components/Layout";
import { ContentPage } from "~/components/PageShell";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

export function meta() {
  return [{ title: "关于 · CNode" }];
}

export default function About() {
  return (
    <Layout>
      <ContentPage className="space-y-8">
        <section className="rounded-3xl bg-cnode-ink p-8 text-white shadow-brand sm:p-10">
          <p className="text-sm font-medium text-cnode-green">ABOUT CNODE</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Node.js 专业中文社区</h1>
          <p className="mt-4 max-w-2xl text-white/72">
            CNode 聚集 Node.js 和现代 Web 开发者，用话题、问答和实践分享沉淀中文技术经验。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/topic/create">发布话题</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/15">
              <Link to="/getstart">新手指南</Link>
            </Button>
          </div>
        </section>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["真实问题", "鼓励提供上下文、代码、错误信息和已经尝试过的方案。"],
            ["实践分享", "欢迎发布线上经验、开源项目、工具链和 Node.js 生态观察。"],
            ["友善协作", "讨论聚焦技术事实，尊重不同经验背景，避免无意义争吵。"],
          ].map(([title, body]) => (
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
