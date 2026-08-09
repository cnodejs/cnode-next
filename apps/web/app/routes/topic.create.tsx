import type { Route } from "../../.react-router/types/app/routes/+types/topic.create";
import type { FormEvent } from "react";
import { Layout } from "~/components/Layout";
import { MarkdownEditor } from "~/components/MarkdownEditor";
import { JobMetaForm, type JobMetaFormValue } from "~/components/JobMetaForm";
import { apiFetch } from "~/lib/api-client";
import { requireUser } from "~/lib/auth";
import { useState } from "react";
import { useNavigate, useRouteLoaderData } from "react-router";
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
import { ComposePage, PageHeader } from "~/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "~/components/ui/field";
import { TurnstileWidget, getTurnstileToken } from "~/components/TurnstileWidget";
import { UnsavedChangesDialog, useUnsavedChanges } from "~/hooks/use-unsaved-changes";
import { writableTopicTabKeys } from "@cnode/shared";
import { getTabLabel } from "~/lib/brand";
import { PublishingRulesCard, TopicTabInfoCard } from "~/components/TopicTabInfo";
import { getTopicTabPresentation } from "~/lib/topic-tab-presentation";

export function meta() {
  return [{ title: "发帖 · CNode" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  return { user };
}

export default function TopicCreate({ loaderData }: Route.ComponentProps) {
  const currentUser = (loaderData as any).user;
  const rootData = useRouteLoaderData("root") as
    | { tabs?: Array<{ key: string; label: string }> }
    | undefined;
  const configuredTabs = rootData?.tabs || [];
  const canPostJob = !!currentUser?.is_admin || (currentUser?.roles || []).includes("recruiter");
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
  const navigate = useNavigate();
  const isDirty =
    title !== "" ||
    tab !== "share" ||
    content !== "" ||
    jobMeta.company !== "" ||
    jobMeta.company_logo !== null ||
    jobMeta.position !== "" ||
    jobMeta.location !== "" ||
    jobMeta.remote !== "on-site" ||
    jobMeta.salary_min !== null ||
    jobMeta.salary_max !== null ||
    (jobMeta.experience ?? "") !== "" ||
    (jobMeta.tech_tags?.length ?? 0) > 0 ||
    jobMeta.contact !== "";
  const unsavedChanges = useUnsavedChanges(isDirty);
  const { blocker } = unsavedChanges;

  const { run: submitTopic, pending: saving } = useAsyncAction(
    async () => {
      const body: Record<string, unknown> = {
        title,
        tab,
        content,
        turnstileToken: getTurnstileToken(),
      };
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
      return apiFetch<{ success: boolean; topic_id: string; error_msg?: string }>(
        "/api/v1/topics",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
    },
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success("发布成功");
          unsavedChanges.allowNavigation();
          void navigate(`/topic/${res.topic_id}`);
        } else {
          toast.error(res.error_msg || "发布失败");
        }
      },
    },
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (tab === "job" && !canPostJob) {
      toast.error("招聘发布需要授权");
      return;
    }
    submitTopic();
  };

  const isJobTab = tab === "job";
  const tabInfo = getTopicTabPresentation(tab);

  return (
    <Layout>
      <ComposePage>
        <PageHeader
          breadcrumbs={[{ label: "首页", to: "/" }, { label: "发布话题" }]}
          title="发布话题"
          description="选择正确分类，写清楚上下文，代码和日志请使用 Markdown 代码块。"
        />
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>话题内容</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="title">标题</FieldLabel>
                  <Input
                    id="title"
                    name="title"
                    autoComplete="off"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例如：如何在 Node.js 中定位内存泄漏…"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="tab">分类</FieldLabel>
                  <Select value={tab} onValueChange={(value) => value && setTab(value)}>
                    <SelectTrigger id="tab" aria-describedby="tab-description">
                      <SelectValue>
                        {(value) => getTabLabel(String(value), configuredTabs)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {writableTopicTabKeys.map((key) => (
                          <SelectItem key={key} value={key} disabled={key === "job" && !canPostJob}>
                            {getTabLabel(key, configuredTabs)}
                            {key === "job" && !canPostJob ? "（需要授权）" : ""}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription id="tab-description">
                    {tabInfo?.description}
                    {!canPostJob ? " 招聘发布需要猎头角色授权。" : ""}
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="content">正文</FieldLabel>
                  <MarkdownEditor
                    id="content"
                    name="content"
                    value={content}
                    onChange={setContent}
                    placeholder="支持 Markdown 格式…"
                    minHeight={320}
                  />
                </Field>
                <TurnstileWidget />
              </FieldGroup>
            </CardContent>
          </Card>
          <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
            <PublishingRulesCard />
            <TopicTabInfoCard tab={tab} label={getTabLabel(tab, configuredTabs)} />
            {isJobTab ? <JobMetaForm value={jobMeta} onChange={setJobMeta} /> : null}
          </aside>
          <div className="flex justify-end lg:col-start-1">
            <Button type="submit" disabled={saving}>
              {saving ? "发布中…" : "发布"}
            </Button>
          </div>
        </form>
      </ComposePage>
      <UnsavedChangesDialog blocker={blocker} />
    </Layout>
  );
}
