import { Layout } from "~/components/Layout";
import { ContentPage } from "~/components/PageShell";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

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
          <p className="mt-4 max-w-2xl text-white/72">
            基于 Hono、Zod OpenAPI 与 Swagger UI 自动生成。
          </p>
        </section>
        <div className="overflow-hidden rounded-lg bg-card shadow-card">
          <SwaggerUI url="/openapi.json" docExpansion="none" defaultModelsExpandDepth={1} />
        </div>
      </ContentPage>
    </Layout>
  );
}
