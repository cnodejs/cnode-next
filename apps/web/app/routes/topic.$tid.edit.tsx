import type { Route } from "../../.react-router/types/app/routes/+types/topic.$tid.edit";
import { Layout } from "~/components/Layout";
import { MarkdownEditor } from "~/components/MarkdownEditor";
import { JobMetaForm, type JobMetaFormValue } from "~/components/JobMetaForm";
import { apiFetch } from "~/lib/api-client";
import { requireUser } from "~/lib/auth";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { useAsyncAction } from "~/hooks/use-async-action";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { ComposePage, PageHeader } from "~/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "~/components/ui/field";
import { UnsavedChangesDialog, useUnsavedChanges } from "~/hooks/use-unsaved-changes";

export function meta() {
  return [{ title: "编辑话题 · CNode" }];
}

const topicTabLabels: Record<string, string> = {
  share: "分享",
  ask: "问答",
  job: "招聘",
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  return {};
}

export default function TopicEdit() {
  const { tid } = useParams();
  const [title, setTitle] = useState("");
  const [tab, setTab] = useState("share");
  const [content, setContent] = useState("");
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
  const [loading, setLoading] = useState(true);
  const initialRef = useRef("");
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch<{ success: boolean; data: any }>(`/api/v1/topic/${tid}?mdrender=false`)
      .then((res) => {
        if (res.success) {
          const nextTitle = res.data.title || "";
          const nextTab = res.data.tab || "share";
          const nextContent = res.data.content || "";
          let nextJobMeta = jobMeta;
          setTitle(nextTitle);
          setTab(nextTab);
          setContent(nextContent);
          if (res.data.job_meta) {
            const jm = res.data.job_meta;
            nextJobMeta = {
              company: jm.company || "",
              company_logo: jm.company_logo ?? null,
              position: jm.position || "",
              location: jm.location || "",
              remote: jm.remote || "on-site",
              salary_min: jm.salary_min ?? null,
              salary_max: jm.salary_max ?? null,
              experience: jm.experience || "",
              tech_tags: jm.tech_tags || [],
              contact: jm.contact || "",
            };
            setJobMeta(nextJobMeta);
          }
          initialRef.current = JSON.stringify({
            title: nextTitle,
            tab: nextTab,
            content: nextContent,
            jobMeta: nextJobMeta,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [tid]);

  const isDirty =
    !loading && initialRef.current !== JSON.stringify({ title, tab, content, jobMeta });
  const { blocker, allowNavigation } = useUnsavedChanges(isDirty);

  const { run: submitTopic, pending: saving } = useAsyncAction(
    async () => {
      const body: Record<string, unknown> = { topic_id: tid, title, tab, content };
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
      return apiFetch<{ success: boolean; error_msg?: string }>(`/api/v1/topics/update`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success("已保存");
          allowNavigation();
          navigate(`/topic/${tid}`);
        } else {
          toast.error(res.error_msg || "保存失败");
        }
      },
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitTopic();
  };

  if (loading) {
    return (
      <Layout>
        <ComposePage>
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-96 w-full" />
        </ComposePage>
      </Layout>
    );
  }

  const isJobTab = tab === "job";

  return (
    <Layout>
      <ComposePage>
        <PageHeader
          breadcrumbs={[{ label: "首页", to: "/" }, { label: "编辑话题" }]}
          title="编辑话题"
          description="更新标题、分类和正文内容。"
        />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>话题内容</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="title">标题</FieldLabel>
                    <Input
                      id="title"
                      name="title"
                      autoComplete="off"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="tab">分类</FieldLabel>
                    <Select value={tab} onValueChange={(value) => value && setTab(value)}>
                      <SelectTrigger id="tab">
                        <SelectValue>{(value) => topicTabLabels[value] ?? value}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="share">分享</SelectItem>
                          <SelectItem value="ask">问答</SelectItem>
                          <SelectItem value="job">招聘</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="content">正文</FieldLabel>
                    <MarkdownEditor
                      id="content"
                      name="content"
                      value={content}
                      onChange={setContent}
                      minHeight={280}
                    />
                  </Field>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? "保存中…" : "保存"}
                    </Button>
                  </div>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            {isJobTab ? (
              <JobMetaForm value={jobMeta} onChange={setJobMeta} />
            ) : (
              <Card size="sm">
                <CardHeader>
                  <CardTitle>发布建议</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <p>问答类话题请包含环境、复现步骤、期望结果和实际错误。</p>
                  <p>分享类话题建议用标题分段，附上相关链接和代码片段。</p>
                  <p>招聘类话题请写清地点、远程方式、技术栈和联系方式。</p>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </ComposePage>
      <UnsavedChangesDialog blocker={blocker} />
    </Layout>
  );
}
