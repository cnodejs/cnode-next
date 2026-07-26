import { Layout } from "~/components/Layout";
import { ContentPage } from "~/components/PageShell";
import { Card, CardContent } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";

const endpoints = [
  ["GET", "/api/v1/topics", "话题列表，支持 page、limit、tab。"],
  ["GET", "/api/v1/topic/:id", "话题详情，包含作者、回复和引用摘要。"],
  ["POST", "/api/v1/topics", "创建话题，需要登录。"],
  ["POST", "/api/v1/topic/:id/replies", "创建线性回复，可传 reply_id。"],
];

export function meta() {
  return [{ title: "API 文档 · CNode" }];
}

export default function ApiDocs() {
  return (
    <Layout>
      <ContentPage className="space-y-6">
        <section className="rounded-3xl bg-cnode-ink p-8 text-white shadow-brand sm:p-10">
          <p className="text-sm font-medium text-cnode-green">API</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">CNode API 文档</h1>
          <p className="mt-4 max-w-2xl text-white/72">使用 JSON 契约访问话题、回复、收藏和用户相关能力。</p>
        </section>
        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold">认证</h2>
            <p className="mt-2 text-sm text-muted-foreground">浏览接口可匿名访问；写入接口需要登录态 cookie 或兼容的访问 token。</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>说明</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.map(([method, path, desc]) => (
                  <TableRow key={`${method}:${path}`}>
                    <TableCell className="font-semibold text-primary">{method}</TableCell>
                    <TableCell className="font-mono">{path}</TableCell>
                    <TableCell className="text-muted-foreground">{desc}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </ContentPage>
    </Layout>
  );
}
