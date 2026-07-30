import type { Route } from "../../.react-router/types/app/routes/+types/reply.$id.edit";
import { Layout } from "~/components/Layout";
import { MarkdownEditor } from "~/components/MarkdownEditor";
import { apiFetch } from "~/lib/api-client";
import { requireUser } from "~/lib/auth";
import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import { useAsyncAction } from "~/hooks/use-async-action";
import { Button } from "~/components/ui/button";
import { ContentPage } from "~/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export function meta() {
  return [{ title: "编辑回复 · CNode" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireUser(request);
  const cookie = request.headers.get("cookie") || "";
  const res = await apiFetch<{ success: boolean; data: any }>(`/api/v1/reply/${params.id}`, {
    headers: { cookie },
  });
  return { reply: res.success ? res.data : null };
}

export default function ReplyEdit({ loaderData }: Route.ComponentProps) {
  const { reply } = loaderData as any;
  const navigate = useNavigate();
  const { revalidate } = useRevalidator();
  const [content, setContent] = useState(reply?.content || "");

  const { run: submitReply, pending: saving } = useAsyncAction(
    async () => {
      return apiFetch<{ success: boolean; error_msg?: string }>(
        `/api/v1/reply/${reply?.id}/edit`,
        {
          method: "POST",
          body: JSON.stringify({ content }),
        },
      );
    },
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success("已保存");
          revalidate();
          navigate(-1);
        } else {
          toast.error(res.error_msg || "保存失败");
        }
      },
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    submitReply();
  };

  if (!reply) {
    return (
      <Layout>
        <Card className="mx-auto max-w-2xl text-center">
          <CardContent className="py-12 text-muted-foreground">回复不存在</CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <ContentPage className="space-y-6">
        <section className="rounded-3xl border border-cnode-green/20 bg-cnode-soft p-6 sm:p-8">
          <p className="text-sm font-medium text-primary">EDIT REPLY</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">编辑回复</h1>
          <p className="mt-2 text-sm text-muted-foreground">调整回复内容，保持讨论上下文清晰。</p>
        </section>
        <Card>
          <CardHeader className="border-b border-border/80 bg-surface-subtle">
            <CardTitle>回复内容</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <MarkdownEditor value={content} onChange={setContent} placeholder="支持 Markdown 格式" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              取消
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </form>
          </CardContent>
        </Card>
      </ContentPage>
    </Layout>
  );
}
