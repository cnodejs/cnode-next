import type { Route } from "../../.react-router/types/app/routes/+types/topic.create";
import type { FormEvent } from "react";
import { Layout } from "~/components/Layout";
import { MarkdownEditor } from "~/components/MarkdownEditor";
import { JobMetaForm, type JobMetaFormValue } from "~/components/JobMetaForm";
import { apiFetch } from "~/lib/api-client";
import { requireUser } from "~/lib/auth";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ContentPage } from "~/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { TurnstileWidget, getTurnstileToken } from "~/components/TurnstileWidget";

export function meta() {
  return [{ title: "发帖 · CNode" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  return {};
}

export default function TopicCreate() {
  const [title, setTitle] = useState("");
  const [tab, setTab] = useState("share");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [jobMeta, setJobMeta] = useState<JobMetaFormValue>({
    company: "",
    company_logo: null,
    position: "",
    location: "",
    remote: "on-site",
    salary_min: null,
    salary_max: null,
    experience: "",
    tech_tags: [],
    contact: "",
  });
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body: Record<string, unknown> = { title, tab, content, turnstileToken: getTurnstileToken() };
    if (tab === "job") {
      body.job_meta = {
        company: jobMeta.company,
        company_logo: jobMeta.company_logo,
        position: jobMeta.position,
        location: jobMeta.location,
        remote: jobMeta.remote,
        salary_min: jobMeta.salary_min,
        salary_max: jobMeta.salary_max,
        experience: jobMeta.experience,
        tech_tags: jobMeta.tech_tags,
        contact: jobMeta.contact,
      };
    }
    const res = await apiFetch<{ success: boolean; topic_id: string; error_msg?: string }>(
      "/api/v1/topics",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
    setSaving(false);
    if (res.success) {
      toast.success("发布成功");
      navigate(`/topic/${res.topic_id}`);
    } else {
      toast.error(res.error_msg || "发布失败");
    }
  };

  const isJobTab = tab === "job";

  return (
    <Layout>
      <ContentPage className="space-y-6">
        <section className="rounded-3xl border border-cnode-green/20 bg-cnode-soft p-6 sm:p-8">
          <p className="text-sm font-medium text-primary">COMPOSE</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">发布话题</h1>
          <p className="mt-2 text-sm text-muted-foreground">选择正确分类，写清楚上下文，代码和日志请使用 Markdown 代码块。</p>
        </section>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card className="min-w-0">
          <CardHeader className="border-b border-border/80 bg-surface-subtle">
            <CardTitle>话题内容</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="标题 (5-100字)"
            />
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
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="支持 Markdown 格式"
            />
          </div>
          <TurnstileWidget />
          <Button type="submit" disabled={saving}>
            {saving ? "发布中..." : "发布"}
          </Button>
            </form>
          </CardContent>
        </Card>
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {isJobTab ? (
              <JobMetaForm value={jobMeta} onChange={setJobMeta} />
            ) : (
              <Card>
                <CardHeader className="border-b border-border/80 bg-surface-subtle">
                  <CardTitle className="text-base">发布建议</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-6 text-sm text-muted-foreground">
                  <p>问答类话题请包含环境、复现步骤、期望结果和实际错误。</p>
                  <p>分享类话题建议用标题分段，附上相关链接和代码片段。</p>
                  <p>招聘类话题请写清地点、远程方式、技术栈和联系方式。</p>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </ContentPage>
    </Layout>
  );
}
