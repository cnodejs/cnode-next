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
import { ComposePage, PageHeader } from "~/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "~/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "~/components/ui/field";
import { UnsavedChangesDialog, useUnsavedChanges } from "~/hooks/use-unsaved-changes";

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
  const { blocker, allowNavigation } = useUnsavedChanges(content !== (reply?.content || ""));

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
          allowNavigation();
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
        <Empty><EmptyHeader><EmptyTitle>回复不存在</EmptyTitle><EmptyDescription>该回复可能已被删除。</EmptyDescription></EmptyHeader></Empty>
      </Layout>
    );
  }

  return (
    <Layout>
      <ComposePage>
        <PageHeader breadcrumbs={[{ label: "首页", to: "/" }, { label: "编辑回复" }]} title="编辑回复" description="调整回复内容，保持讨论上下文清晰。" />
        <Card>
          <CardHeader>
            <CardTitle>回复内容</CardTitle>
          </CardHeader>
          <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
          <Field>
          <FieldLabel>回复内容</FieldLabel>
          <MarkdownEditor value={content} onChange={setContent} placeholder="支持 Markdown 格式" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              取消
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
          </FieldGroup>
        </form>
          </CardContent>
        </Card>
      </ComposePage>
      <UnsavedChangesDialog blocker={blocker} />
    </Layout>
  );
}
