import { Layout } from "~/components/Layout";
import { DirectoryPage, PageHeader } from "~/components/PageShell";
import { Card, CardContent } from "~/components/ui/card";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export function meta() {
  return [{ title: "API 文档 · CNode" }];
}

export default function ApiDocs() {
  return (
    <Layout>
      <DirectoryPage>
        <PageHeader variant="marketing" eyebrow="API" title="CNode API 文档" description="基于 Hono、Zod OpenAPI 与 Swagger UI 自动生成。" />
        <Card>
          <CardContent>
          <div className="overflow-x-auto">
          <SwaggerUI url="/openapi.json" docExpansion="none" defaultModelsExpandDepth={1} />
          </div>
          </CardContent>
        </Card>
      </DirectoryPage>
    </Layout>
  );
}
