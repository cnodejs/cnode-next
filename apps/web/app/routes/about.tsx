import { Link } from "react-router";
import { Layout } from "~/components/Layout";
import { DirectoryPage, PageHeader } from "~/components/PageShell";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "~/components/ui/item";
import { Separator } from "~/components/ui/separator";

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

const cooperationSections = [
  ["开源项目", "适合展示与 Node.js、JavaScript 和现代 Web 开发相关的长期维护项目。"],
  ["开发者工具", "欢迎能够帮助社区成员改进开发、测试、部署或协作效率的产品与服务。"],
  ["技术活动", "可介绍面向开发者的会议、Meetup、工作坊和其他非误导性技术活动。"],
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
      <DirectoryPage>
        <PageHeader
          variant="marketing"
          eyebrow="ABOUT CNODE"
          title="Node.js 专业中文社区"
          description="CNode 聚集 Node.js 和现代 Web 开发者，用话题、问答和实践分享沉淀中文技术经验。"
          action={<div className="flex flex-wrap gap-3">
            <Button render={<Link to="/topic/create" />}>
              发布话题
            </Button>
            <Button render={<a href="#guide" />} variant="secondary">
              参与指南
            </Button>
          </div>}
        />

        <div className="grid min-w-0 gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <nav aria-label="关于页面导航" className="flex gap-2 overflow-x-auto lg:sticky lg:top-24 lg:self-start lg:flex-col">
            {[
              ["社区介绍", "#community"],
              ["参与指南", "#guide"],
              ["讨论规范", "#discussion"],
              ["社区合作", "#cooperation"],
              ["社区客户端", "#client"],
              ["常见问题", "#faq"],
            ].map(([label, href]) => (
              <Button key={href} render={<a href={href} />} variant="ghost" className="justify-start">
                {label}
              </Button>
            ))}
          </nav>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>社区手册</CardTitle>
              <CardDescription>了解社区定位、参与方式和内容规范。</CardDescription>
            </CardHeader>
            <CardContent className="flex min-w-0 flex-col gap-8">
              <section id="community" className="scroll-mt-24">
                <SectionIntro eyebrow="COMMUNITY" title="关于 CNode" description="CNode 面向中文 Node.js 与现代 Web 开发者，希望让真实问题、可复用经验和生态实践被长期检索与讨论。" />
                <ItemGroup className="mt-4 grid gap-3 md:grid-cols-3">
                  {communityValues.map(([title, body]) => (
                    <Item key={title} variant="muted" className="items-start">
                      <ItemContent>
                        <ItemTitle>{title}</ItemTitle>
                        <ItemDescription className="line-clamp-none">{body}</ItemDescription>
                      </ItemContent>
                    </Item>
                  ))}
                </ItemGroup>
              </section>

              <Separator />

              <section id="guide" className="scroll-mt-24">
                <SectionIntro eyebrow="GET INVOLVED" title="参与指南" description="从浏览讨论到发布内容，选择清晰的上下文比追求形式更重要。" />
                <ItemGroup className="mt-4 grid gap-3 sm:grid-cols-2">
                  {guideSections.map(([title, body]) => (
                    <Item key={title} variant="outline" className="items-start">
                      <ItemContent>
                        <ItemTitle>{title}</ItemTitle>
                        <ItemDescription className="line-clamp-none">{body}</ItemDescription>
                      </ItemContent>
                    </Item>
                  ))}
                </ItemGroup>
              </section>

              <Separator />

              <section id="discussion" className="scroll-mt-24">
                <SectionIntro eyebrow="DISCUSSION" title="讨论与内容规范" description="高质量讨论从可复现的信息、可阅读的格式和对彼此时间的尊重开始。" />
                <ol className="mt-5 grid gap-5 md:grid-cols-3">
                  {discussionSections.map(([title, body], index) => (
                    <li key={title} className="min-w-0">
                      <p className="text-xs font-medium tracking-widest text-primary">0{index + 1}</p>
                      <h3 className="mt-2 font-medium text-foreground">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                    </li>
                  ))}
                </ol>
              </section>

              <Separator />

              <section id="cooperation" className="scroll-mt-24">
                <SectionIntro eyebrow="COMMUNITY PARTNERS" title="社区合作" description="首页保留一个社区合作展示位，用于介绍与 CNode 读者相关的开源项目、开发者工具和技术活动。合作内容需要明确来源并与 Node.js 开发者相关。" />
                <ItemGroup className="mt-4 grid gap-3 md:grid-cols-3">
                  {cooperationSections.map(([title, body]) => (
                    <Item key={title} variant="muted" className="items-start">
                      <ItemContent>
                        <ItemTitle>{title}</ItemTitle>
                        <ItemDescription className="line-clamp-none">{body}</ItemDescription>
                      </ItemContent>
                    </Item>
                  ))}
                </ItemGroup>
                <Button render={<Link to="/topic/create" />} variant="outline" className="mt-4">
                  发布合作介绍
                </Button>
              </section>

              <Separator />

              <section id="client" className="scroll-mt-24">
                <SectionIntro eyebrow="COMMUNITY CLIENT" title="社区客户端" description="CNode 曾有由社区开发者维护的 React Native 客户端。它不是本站官方发行的软件，安装或使用前请先查看原项目的维护状态、平台支持和安全说明。" />
                <Button
                  render={<a href="https://github.com/soliury/noder-react-native/blob/master/README.md" target="_blank" rel="noopener noreferrer" />}
                  variant="outline"
                  className="mt-4"
                >
                  查看客户端项目
                </Button>
              </section>

              <Separator />

              <section id="faq" className="scroll-mt-24">
                <SectionIntro eyebrow="FAQ" title="常见问题" description="账号、消息、话题和回复的常见使用说明。" />
                <div className="mt-5 grid gap-x-8 gap-y-6 md:grid-cols-2">
                  {faqGroups.map((group) => (
                    <div key={group.title}>
                      <h3 className="font-medium text-foreground">{group.title}</h3>
                      <dl className="mt-3 flex flex-col gap-4">
                        {group.items.map(([question, answer]) => (
                          <div key={question}>
                            <dt className="text-sm font-medium">{question}</dt>
                            <dd className="mt-1 text-sm leading-6 text-muted-foreground">{answer}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>
              </section>
            </CardContent>
          </Card>
        </div>
      </DirectoryPage>
    </Layout>
  );
}

function SectionIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-medium tracking-tight text-foreground sm:text-2xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
