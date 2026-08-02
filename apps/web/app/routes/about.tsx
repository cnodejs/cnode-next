import { Link } from "react-router";
import { Layout } from "~/components/Layout";
import { ContentPage } from "~/components/PageShell";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

const communityValues = [
  ["真实问题", "鼓励提供上下文、代码、错误信息和已经尝试过的方案。"],
  ["实践分享", "欢迎发布线上经验、开源项目、工具链和 Node.js 生态观察。"],
  ["友善协作", "讨论聚焦技术事实，尊重不同经验背景，避免无意义争吵。"],
];

const guideSections = [
  ["账号", "登录后可以发布话题、回复讨论、收藏内容和接收消息通知。"],
  ["分类", "分享适合经验总结和项目发布；问答适合具体问题；招聘用于 Node.js 相关职位。"],
  ["参与", "先浏览已有讨论，再选择合适分类发布内容；回复时尽量延续当前话题上下文。"],
  ["反馈", "说明已经尝试的方案，补充必要信息，并及时确认最终解决方式。"],
];

const discussionSections = [
  ["提出可回答的问题", "说明运行环境、复现步骤、期望结果、实际结果和完整错误信息。"],
  ["让内容易于阅读", "使用代码块包裹日志和源码，长文用标题分段，引用资料请附原始链接。"],
  ["保持讨论友善", "优先讨论事实和方案，避免催促、攻击以及没有上下文的求助。"],
];

const faqGroups = [
  {
    title: "账号与消息",
    items: [
      ["为什么需要登录？", "登录后才能发布、回复、收藏和接收站内消息。"],
      ["头像不显示怎么办？", "系统会规范化头像 URL，并在图片不可用时显示用户名文字头像。"],
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
  return [{ title: "关于 · CNode" }];
}

export default function About() {
  return (
    <Layout>
      <ContentPage className="space-y-10">
        <section className="rounded-3xl bg-cnode-ink p-8 text-white shadow-brand sm:p-10">
          <p className="text-sm font-medium text-cnode-green">ABOUT CNODE</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Node.js 专业中文社区</h1>
          <p className="mt-4 max-w-2xl text-white/72">
            CNode 聚集 Node.js 和现代 Web 开发者，用话题、问答和实践分享沉淀中文技术经验。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button render={<Link to="/topic/create" />}>
              发布话题
            </Button>
            <Button render={<a href="#guide" />} variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/15">
              参与指南
            </Button>
          </div>
        </section>

        <nav aria-label="关于页面导航" className="flex flex-wrap gap-2 text-sm">
          <a href="#community" className="rounded-lg bg-accent px-3 py-1.5 text-accent-foreground">社区介绍</a>
          <a href="#guide" className="rounded-lg bg-accent px-3 py-1.5 text-accent-foreground">参与指南</a>
          <a href="#discussion" className="rounded-lg bg-accent px-3 py-1.5 text-accent-foreground">讨论规范</a>
          <a href="#faq" className="rounded-lg bg-accent px-3 py-1.5 text-accent-foreground">常见问题</a>
        </nav>

        <section id="community" className="scroll-mt-24 space-y-4">
          <div>
            <p className="text-sm font-medium text-primary">COMMUNITY</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">关于 CNode</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              CNode 面向中文 Node.js 与现代 Web 开发者，希望让真实问题、可复用经验和生态实践被长期检索与讨论。
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {communityValues.map(([title, body]) => (
              <Card key={title}>
                <CardContent className="p-5">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="guide" className="scroll-mt-24 space-y-4">
          <div>
            <p className="text-sm font-medium text-primary">GET INVOLVED</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">参与指南</h2>
            <p className="mt-2 text-sm text-muted-foreground">从浏览讨论到发布内容，选择清晰的上下文比追求形式更重要。</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {guideSections.map(([title, body]) => (
              <Card key={title}>
                <CardContent className="p-5">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="discussion" className="scroll-mt-24 space-y-4">
          <div>
            <p className="text-sm font-medium text-primary">DISCUSSION</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">讨论与内容规范</h2>
            <p className="mt-2 text-sm text-muted-foreground">高质量讨论从可复现的信息、可阅读的格式和对彼此时间的尊重开始。</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {discussionSections.map(([title, body], index) => (
              <Card key={title} className={index === 0 ? "border-cnode-green/25 bg-cnode-soft" : undefined}>
                <CardContent className="p-5">
                  <p className="text-xs font-semibold text-primary">0{index + 1}</p>
                  <h3 className="mt-2 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 space-y-4">
          <div>
            <p className="text-sm font-medium text-primary">FAQ</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">常见问题</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {faqGroups.map((group) => (
              <Card key={group.title}>
                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold">{group.title}</h3>
                  <div className="mt-4 divide-y divide-border">
                    {group.items.map(([question, answer]) => (
                      <div key={question} className="py-4 first:pt-0 last:pb-0">
                        <h4 className="font-medium">{question}</h4>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{answer}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </ContentPage>
    </Layout>
  );
}
