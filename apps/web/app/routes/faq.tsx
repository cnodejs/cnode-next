import { Layout } from "~/components/Layout";
import { ContentPage } from "~/components/PageShell";
import { Card, CardContent } from "~/components/ui/card";

const groups = [
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
  return [{ title: "FAQ · CNode" }];
}

export default function FAQ() {
  return (
    <Layout>
      <ContentPage className="space-y-6">
        <section className="rounded-3xl bg-surface-raised p-8 shadow-card sm:p-10">
          <p className="text-sm font-medium text-primary">FAQ</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">常见问题</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">按使用场景整理社区常见问题，帮助你快速找到下一步。</p>
        </section>
        {groups.map((group) => (
          <Card key={group.title}>
            <CardContent className="p-5">
              <h2 className="text-lg font-semibold">{group.title}</h2>
              <div className="mt-4 divide-y divide-border">
                {group.items.map(([q, a]) => (
                  <div key={q} className="py-4 first:pt-0 last:pb-0">
                    <h3 className="font-medium">{q}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{a}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </ContentPage>
    </Layout>
  );
}
