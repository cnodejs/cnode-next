import { Link } from "react-router";
import { Layout } from "~/components/Layout";
import { ContentPage } from "~/components/PageShell";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

const getstartSections = [
  ["账号", "登录后可以发布话题、回复讨论、收藏内容和接收消息通知。"],
  ["分类", "分享适合经验总结和项目发布；问答适合具体问题；招聘用于 Node.js 相关职位。"],
  ["提问", "说明运行环境、复现步骤、期望结果、实际结果和完整错误信息。"],
  ["Markdown", "使用代码块包裹日志和源码，长文用标题分段，引用资料请附链接。"],
  ["礼仪", "优先讨论事实和方案，避免催促、攻击和无上下文的求助。"],
];

const aboutCards = [
  ["真实问题", "鼓励提供上下文、代码、错误信息和已经尝试过的方案。"],
  ["实践分享", "欢迎发布线上经验、开源项目、工具链和 Node.js 生态观察。"],
  ["友善协作", "讨论聚焦技术事实，尊重不同经验背景，避免无意义争吵。"],
];

const faqGroups = [
  {
    title: "账号与消息",
    items: [
      ["为什么需要登录？", "登录后才能发布、回复、收藏和接收站内消息。"],
      ["头像不显示怎么办？", "系统会规范化头像 URL，并在不可用时显示确定性文字 fallback。"],
    ],
  },
  {
    title: "话题与回复",
    items: [
      ["如何获得更好的回复？", "提供背景、复现步骤、最小代码和完整错误信息。"],
      ["回复是嵌套的吗？", "不是。CNode 使用线性回复流，并通过引用预览表达上下文。"],
    ],
  },
];

export function meta() {
  return [{ title: "指引 · CNode" }];
}

export default function Help() {
  return (
    <Layout>
      <ContentPage className="space-y-8">
        <section className="rounded-3xl bg-cnode-ink p-8 text-white shadow-brand sm:p-10">
          <p className="text-sm font-medium text-cnode-green">HELP</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">社区指引</h1>
          <p className="mt-4 max-w-2xl text-white/72">
            新手指南、社区介绍、常见问题与 API 文档的统一入口。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/topic/create">发布话题</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/15">
              <a href="#getstart">新手指南</a>
            </Button>
          </div>
        </section>

        <nav className="flex flex-wrap gap-2 text-sm">
          <a href="#getstart" className="rounded-lg bg-accent px-3 py-1.5 text-accent-foreground">新手指南</a>
          <a href="#about" className="rounded-lg bg-accent px-3 py-1.5 text-accent-foreground">关于</a>
          <a href="#faq" className="rounded-lg bg-accent px-3 py-1.5 text-accent-foreground">FAQ</a>
          <Link to="/api" className="rounded-lg bg-accent px-3 py-1.5 text-accent-foreground">API 文档</Link>
        </nav>

        <section id="getstart" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl font-bold">新手指南</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {getstartSections.map(([title, body]) => (
              <Card key={title}>
                <CardContent className="p-5">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="about" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl font-bold">关于 CNode</h2>
          <p className="text-sm text-muted-foreground">
            CNode 聚集 Node.js 和现代 Web 开发者，用话题、问答和实践分享沉淀中文技术经验。
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {aboutCards.map(([title, body]) => (
              <Card key={title}>
                <CardContent className="p-5">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="faq" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl font-bold">常见问题</h2>
          {faqGroups.map((group) => (
            <Card key={group.title}>
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold">{group.title}</h3>
                <div className="mt-4 divide-y divide-border">
                  {group.items.map(([q, a]) => (
                    <div key={q} className="py-4 first:pt-0 last:pb-0">
                      <h4 className="font-medium">{q}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{a}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="rounded-3xl border border-cnode-green/20 bg-cnode-soft p-6">
          <h2 className="text-lg font-bold">API 文档</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            基于 Hono、Zod OpenAPI 与 Swagger UI 自动生成的 API 文档。
          </p>
          <Button asChild className="mt-4">
            <Link to="/api">查看 API 文档</Link>
          </Button>
        </section>
      </ContentPage>
    </Layout>
  );
}
