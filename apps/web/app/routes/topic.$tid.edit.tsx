import type { Route } from "../../.react-router/types/app/routes/+types/topic.$tid.edit";
import { Layout } from "~/components/Layout";
import { MarkdownEditor } from "~/components/MarkdownEditor";
import { apiFetch } from "~/lib/api-client";
import { requireUser } from "~/lib/auth";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { ContentPage } from "~/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export function meta() {
  return [{ title: "编辑话题 · CNode" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  return {};
}

export default function TopicEdit() {
  const { tid } = useParams();
  const [title, setTitle] = useState("");
  const [tab, setTab] = useState("share");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch<{ success: boolean; data: any }>(`/api/v1/topic/${tid}`)
      .then((res) => {
        if (res.success) {
          setTitle(res.data.title);
          setTab(res.data.tab);
          setContent(res.data.content);
        }
      })
      .finally(() => setLoading(false));
  }, [tid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch<{ success: boolean; error_msg?: string }>(`/api/v1/topics/update`, {
      method: "POST",
      body: JSON.stringify({ topic_id: tid, title, tab, content }),
    });
    setSaving(false);
    if (res.success) {
      toast.success("已保存");
      navigate(`/topic/${tid}`);
    } else {
      toast.error(res.error_msg || "保存失败");
    }
  };

  if (loading) {
    return (
      <Layout>
        <ContentPage className="space-y-4">
          <Skeleton className="h-28 w-full rounded-3xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </ContentPage>
      </Layout>
    );
  }

  return (
    <Layout>
      <ContentPage className="space-y-6">
        <section className="rounded-3xl border border-cnode-green/20 bg-cnode-soft p-6 sm:p-8">
          <p className="text-sm font-medium text-primary">EDIT</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">编辑话题</h1>
          <p className="mt-2 text-sm text-muted-foreground">更新标题、分类和正文内容。</p>
        </section>
        <Card>
          <CardHeader className="border-b border-border/80 bg-surface-subtle">
            <CardTitle>话题内容</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">标题</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tab">分类</Label>
            <select
              id="tab"
              value={tab}
              onChange={(e) => setTab(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            >
              <option value="share">分享</option>
              <option value="ask">问答</option>
              <option value="job">招聘</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>正文</Label>
            <MarkdownEditor value={content} onChange={setContent} />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </form>
          </CardContent>
        </Card>
      </ContentPage>
    </Layout>
  );
}
