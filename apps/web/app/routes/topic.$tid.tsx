import { useEffect, useRef, useState, type FormEvent } from "react";
import type { PublicIdentity } from "@cnode/shared";
import type { Route } from "../../.react-router/types/app/routes/+types/topic.$tid";
import { Link, useLocation, useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import {
  CalendarDays,
  Clock3,
  Code,
  Edit3,
  ExternalLink,
  Eye,
  Flag,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Star,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { Layout } from "~/components/Layout";
import { MarkdownView } from "~/components/MarkdownView";
import { TimeAgo } from "~/components/TimeAgo";
import { StatusBadge, TagBadge } from "~/components/TagBadge";
import { MarkdownEditor } from "~/components/MarkdownEditor";
import { JobMetaCard } from "~/components/JobMetaCard";
import { ReadingGrid, ReadingPage } from "~/components/PageShell";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { NativeSelect } from "~/components/ui/native-select";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { apiFetch, getCurrentUser } from "~/lib/api-client";
import { getAvatarFallback, getAvatarUrl, getTabLabel } from "~/lib/brand";
import { kvGet, kvSet } from "~/lib/kv-cache";
import { extractMarkdownHeadings } from "~/lib/markdown-headings";
import { TurnstileWidget, getTurnstileToken } from "~/components/TurnstileWidget";
import { useAsyncAction } from "~/hooks/use-async-action";
import { UserIdentityBadges } from "~/components/UserIdentityBadges";
import { externalUrlLabel, githubProfileUrl, safeExternalUrl } from "~/lib/public-profile";
import { getTopicActionPresentation } from "~/lib/topic-action-presentation";
import type { TopicReplyDTO } from "~/lib/api-types";
import { useCspNonce } from "~/lib/csp-nonce";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "~/components/ui/empty";
import { Separator } from "~/components/ui/separator";
import {
  discussionForumPostingJsonLd,
  firstMarkdownImage,
  markdownExcerpt,
  seoMeta,
} from "~/lib/seo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export type ReplySort = "newest" | "oldest";

const REPLY_SORT_ITEMS: Array<{ value: ReplySort; label: string }> = [
  { value: "newest", label: "最新优先" },
  { value: "oldest", label: "最早优先" },
];

export interface ReplyWithFloor<T> {
  reply: T;
  floor: number;
}

export function resolveReplySort(value: string | null): ReplySort {
  return value === "oldest" ? "oldest" : "newest";
}

export function orderRepliesForDisplay<T>(
  replies: readonly T[],
  sort: ReplySort,
): ReplyWithFloor<T>[] {
  const withFloors = replies.map((reply, index) => ({ reply, floor: index + 1 }));
  return sort === "newest" ? [...withFloors].reverse() : withFloors;
}

export function focusReplyElement(replyId: string) {
  const target = document.getElementById(replyId);
  if (!target) return false;

  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start",
  });
  target.focus({ preventScroll: true });
  return true;
}

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const tid = params.tid!;
  const replySort = resolveReplySort(new URL(request.url).searchParams.get("reply_sort"));
  const cacheKey = `topic:${tid}`;
  const kv = (context as any)?.cloudflare?.env?.KV;
  const currentUser = await getCurrentUser(request);
  const cached = currentUser ? null : await kvGet<any>(kv, cacheKey);
  const cookie = request.headers.get("cookie") || "";
  let topic = cached;

  if (!topic) {
    const res = await apiFetch<{ success: boolean; data: any }>(
      `/api/v1/topic/${tid}?mdrender=false`,
      {
        headers: { cookie },
      },
    );
    if (!res.success)
      return { topic: null, authorProfile: null, kv, currentUser, replies: [], replySort };
    topic = res.data;
    if (!currentUser) await kvSet(kv, cacheKey, topic, 60);
  }

  const authorName = topic.author?.loginname;
  let authorProfile =
    authorName && !currentUser ? await kvGet<any>(kv, `user:${authorName}`) : null;
  if (authorName && !authorProfile) {
    const profileResponse = await apiFetch<{ success: boolean; data: any }>(
      `/api/v1/user/${encodeURIComponent(authorName)}`,
      {
        headers: { cookie },
      },
    ).catch(() => null);
    if (profileResponse?.success) {
      authorProfile = profileResponse.data;
      if (!currentUser) await kvSet(kv, `user:${authorName}`, authorProfile, 60);
    }
  }

  const replies = orderRepliesForDisplay(topic.replies || [], replySort);
  return { topic, authorProfile, kv, currentUser, replies, replySort };
}

export function meta({ data }: Route.MetaArgs) {
  if (!data?.topic) return [{ title: "话题不存在" }];
  return seoMeta({
    title: `${data.topic.title} · CNode`,
    ogTitle: data.topic.title,
    description: markdownExcerpt(data.topic.content),
    path: `/topic/${data.topic.id}`,
    type: "article",
    image: firstMarkdownImage(data.topic.content),
  });
}

export default function TopicDetail({ loaderData }: Route.ComponentProps) {
  const { topic, authorProfile, currentUser, replies, replySort } = loaderData as any;
  if (!topic) {
    return (
      <Layout>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>话题不存在或已被删除</EmptyTitle>
            <EmptyDescription>返回首页继续浏览社区最新内容。</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link to="/" />}>返回首页</Button>
          </EmptyContent>
        </Empty>
      </Layout>
    );
  }

  const headings = extractMarkdownHeadings(topic.content || "").slice(0, 12);
  const toc = headings.length >= 4 ? <TopicToc headings={headings} /> : null;
  const jsonLd = discussionForumPostingJsonLd(topic);
  const nonce = useCspNonce();

  return (
    <Layout>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ReadingPage>
        <ReadingGrid
          aside={<TopicContext topic={topic} authorProfile={authorProfile} />}
          afterAside={
            <div className="flex flex-col gap-5">
              <TopicActions topic={topic} currentUser={currentUser} />
              <ReplySection
                replies={replies}
                replySort={replySort}
                topicId={topic.id}
                currentUser={currentUser}
              />
            </div>
          }
        >
          <article className="flex flex-col gap-5">
            <TopicHeader topic={topic} />
            <Card>
              <CardContent className="flex flex-col gap-4">
                {toc}
                {topic.tab === "job" && topic.job_meta && (
                  <div>
                    <JobMetaCard meta={topic.job_meta} />
                  </div>
                )}
                <MarkdownView
                  content={topic.content}
                  className="prose-base prose-img:rounded-xl prose-pre:overflow-x-auto"
                />
              </CardContent>
            </Card>
          </article>
        </ReadingGrid>
      </ReadingPage>
    </Layout>
  );
}

function TopicHeader({ topic }: { topic: any }) {
  const author = topic.author;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">
            首页
          </Link>
          <span>/</span>
          <Link to={`/?tab=${topic.tab}`} className="hover:text-primary">
            {getTabLabel(topic.tab)}
          </Link>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="min-w-0 flex-1 text-2xl font-medium tracking-tight sm:text-3xl">
            {topic.title}
          </h1>
          <div className="flex shrink-0 flex-wrap items-center gap-2 pt-1">
            {topic.top && <StatusBadge type="top" />}
            {topic.good && <StatusBadge type="good" />}
            <TagBadge tab={topic.tab} />
          </div>
        </div>
        <Separator className="col-span-full" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Link
              to={`/user/${author?.loginname}`}
              className="flex items-center gap-2 text-foreground hover:text-primary"
            >
              <Avatar className="size-8">
                <AvatarImage
                  src={getAvatarUrl(author?.avatar_url, 36)}
                  alt={author?.loginname || "CNode"}
                />
                <AvatarFallback>{getAvatarFallback(author?.loginname)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{author?.loginname || "社区成员"}</span>
            </Link>
            <span className="flex items-center gap-1">
              <CalendarDays aria-hidden="true" className="size-3.5" />
              发布于 <TimeAgo date={topic.create_at} />
            </span>
            {topic.last_reply_at && (
              <span className="flex items-center gap-1">
                <Clock3 aria-hidden="true" className="size-3.5" />
                最后回复 <TimeAgo date={topic.last_reply_at} />
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 sm:justify-end">
            <span
              className="flex items-center gap-1"
              aria-label={`${topic.reply_count || 0} 回复`}
              title="回复"
            >
              <MessageSquare aria-hidden="true" className="size-3.5" />
              {topic.reply_count || 0}
            </span>
            <span
              className="flex items-center gap-1"
              aria-label={`${topic.visit_count || 0} 浏览`}
              title="浏览"
            >
              <Eye aria-hidden="true" className="size-3.5" />
              {topic.visit_count || 0}
            </span>
            <span
              className="flex items-center gap-1"
              aria-label={`${topic.collect_count || 0} 收藏`}
              title="收藏"
            >
              <Star aria-hidden="true" className="size-3.5" />
              {topic.collect_count || 0}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TopicToc({ headings }: { headings: ReturnType<typeof extractMarkdownHeadings> }) {
  return (
    <details className="rounded-lg bg-muted p-4 text-sm">
      <summary className="cursor-pointer font-medium">目录 · {headings.length} 个章节</summary>
      <nav aria-label="本页目录" className="mt-3 flex flex-col gap-1">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}
            className={`block rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground ${
              heading.depth === 3 ? "ml-3 text-xs" : ""
            }`}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </details>
  );
}

function TopicContext({ topic, authorProfile }: { topic: any; authorProfile?: any }) {
  const author = topic.author;
  return (
    <div className="flex flex-col gap-4">
      <TopicAuthorCard author={author} profile={authorProfile} />
      <Card size="sm">
        <CardHeader>
          <CardTitle>话题信息</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex justify-between">
            <span>分类</span>
            <span>{getTabLabel(topic.tab)}</span>
          </div>
          <div className="flex justify-between">
            <span>回复</span>
            <span>{topic.reply_count || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>浏览</span>
            <span>{topic.visit_count || 0}</span>
          </div>
        </CardContent>
      </Card>
      <Card size="sm">
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">参与讨论前</p>
          <p className="text-xs text-muted-foreground">
            请提供可复现信息、尊重不同经验背景，并善用 Markdown 格式化代码。
          </p>
          <Button
            render={<Link to="/about#discussion" />}
            variant="outline"
            size="sm"
            className="w-full"
          >
            查看讨论规范
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function TopicAuthorCard({ author, profile }: { author: any; profile?: any }) {
  const loginname = profile?.loginname || author?.loginname || "社区成员";
  const avatarUrl = profile?.avatar_url || author?.avatar_url;
  const websiteUrl = safeExternalUrl(profile?.url);
  const githubUrl = githubProfileUrl(profile?.githubUsername);

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>作者</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12 shrink-0">
            <AvatarImage src={getAvatarUrl(avatarUrl, 56)} alt={loginname} />
            <AvatarFallback>{getAvatarFallback(loginname)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-1.5">
            <Link
              to={`/user/${loginname}`}
              className="block truncate font-semibold hover:text-primary"
            >
              {loginname}
            </Link>
            <UserIdentityBadges identities={(profile?.identities || []) as PublicIdentity[]} />
          </div>
        </div>

        {profile?.signature && (
          <p className="whitespace-pre-wrap break-words text-sm leading-5 text-foreground/80">
            {profile.signature}
          </p>
        )}

        {(profile?.location || websiteUrl || githubUrl) && (
          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
            {profile?.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{profile.location}</span>
              </div>
            )}
            {websiteUrl && (
              <a
                className="flex items-center gap-2 hover:text-primary"
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="truncate">{externalUrlLabel(websiteUrl)}</span>
              </a>
            )}
            {githubUrl && (
              <a
                className="flex items-center gap-2 hover:text-primary"
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Code className="h-3.5 w-3.5" />
                <span className="truncate">@{profile.githubUsername}</span>
              </a>
            )}
          </div>
        )}

        {profile && (
          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              ["积分", profile.score || 0],
              ["话题", profile.topic_count || 0],
              ["回复", profile.reply_count || 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-muted px-1 py-2">
                <dt className="text-[11px] text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        <Button
          render={<Link to={`/user/${loginname}`} />}
          variant="outline"
          size="sm"
          className="w-full"
        >
          查看用户主页
        </Button>
      </CardContent>
    </Card>
  );
}

export function TopicActions({ topic, currentUser }: { topic: any; currentUser: any }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const managementTriggerRef = useRef<HTMLButtonElement | null>(null);
  const { revalidate } = useRevalidator();
  const presentation = getTopicActionPresentation(topic, currentUser);
  const canManage = presentation.showManagement;

  const { run: toggleCollect, pending: collecting } = useAsyncAction(
    async (): Promise<{ success: boolean; error_msg?: string; skipped?: boolean }> => {
      if (!currentUser) {
        toast.error("登录后即可收藏话题");
        return { success: false, skipped: true };
      }
      const path = topic.is_collect
        ? "/api/v1/topic_collect/de_collect"
        : "/api/v1/topic_collect/collect";
      return apiFetch<{ success: boolean; error_msg?: string }>(path, {
        method: "POST",
        body: JSON.stringify({ topic_id: topic.id }),
      }).catch(() => ({
        success: false,
        error_msg: topic.is_collect ? "取消收藏失败" : "收藏失败",
      }));
    },
    {
      onSuccess: (res) => {
        if (res.skipped) return;
        if (res.success) {
          toast.success(topic.is_collect ? "已取消收藏" : "已收藏话题");
          void revalidate();
        } else {
          toast.error(res.error_msg || (topic.is_collect ? "取消收藏失败" : "收藏失败"));
        }
      },
    },
  );

  const { run: runTopicAction, pending: adminPending } = useAsyncAction(
    async (
      action: "delete" | "top" | "good",
    ): Promise<{
      success: boolean;
      message?: string;
      error_msg?: string;
      skipped?: boolean;
      actionLabel: string;
    }> => {
      const actionLabel =
        action === "delete"
          ? "删除帖子"
          : action === "top"
            ? topic.top
              ? "取消置顶"
              : "置顶"
            : topic.good
              ? "取消高亮"
              : "高亮";
      if (!canManage) return { success: false, skipped: true, actionLabel };
      const res = await apiFetch<{ success: boolean; message?: string; error_msg?: string }>(
        `/api/v1/topic/${topic.id}/${action}`,
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      ).catch(() => ({ success: false, error_msg: `${actionLabel}失败` }));
      return { ...res, actionLabel };
    },
    {
      onSuccess: (res) => {
        if (res.skipped) return;
        if (res.success) {
          toast.success(res.message || `${res.actionLabel}成功`);
          setDeleteOpen(false);
          void revalidate();
        } else {
          toast.error(res.error_msg || `${res.actionLabel}失败`);
        }
      },
    },
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-1 sm:items-center sm:gap-3">
      <div className="flex min-w-0 flex-wrap gap-1.5 sm:gap-2" aria-label="主要话题操作">
        <Button
          variant={topic.is_collect ? "default" : "outline"}
          size="sm"
          onClick={() => toggleCollect()}
          disabled={collecting}
        >
          <Star className="hidden sm:block" />{" "}
          {collecting ? "处理中" : topic.is_collect ? "取消收藏" : "收藏话题"}
        </Button>
        <Button render={<a href="#replies" />} variant="ghost" size="sm">
          <MessageSquare className="hidden sm:block" /> 查看回复
        </Button>
      </div>
      {(presentation.showDirectEdit || presentation.showReport || presentation.showManagement) && (
        <div className="flex flex-wrap justify-end gap-1.5 sm:gap-2" aria-label="更多话题操作">
          {presentation.showDirectEdit && (
            <Button render={<Link to={`/topic/${topic.id}/edit`} />} variant="outline" size="sm">
              <Edit3 className="hidden sm:block" /> 编辑话题
            </Button>
          )}
          {presentation.showReport && <ReportButton targetType="topic" targetId={topic.id} />}
          {presentation.showManagement && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      ref={managementTriggerRef}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={adminPending}
                    />
                  }
                >
                  <MoreHorizontal className="hidden sm:block" /> 管理
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 pb-[max(0.25rem,env(safe-area-inset-bottom))]"
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>话题管理</DropdownMenuLabel>
                    {presentation.showManagementEdit && (
                      <DropdownMenuItem render={<Link to={`/topic/${topic.id}/edit`} />}>
                        <Edit3 /> 编辑话题
                      </DropdownMenuItem>
                    )}
                    {presentation.showPin && (
                      <DropdownMenuItem
                        onClick={() => runTopicAction("top")}
                        disabled={adminPending}
                      >
                        {topic.top ? "取消置顶" : "置顶帖子"}
                      </DropdownMenuItem>
                    )}
                    {presentation.showHighlight && (
                      <DropdownMenuItem
                        onClick={() => runTopicAction("good")}
                        disabled={adminPending}
                      >
                        {topic.good ? "取消高亮" : "高亮帖子"}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                  {presentation.showDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteOpen(true)}
                        disabled={adminPending}
                      >
                        <Trash2 /> 删除帖子
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <AlertDialog
            open={deleteOpen}
            onOpenChange={(open, eventDetails) => {
              if (!open && adminPending) {
                eventDetails.cancel();
                return;
              }
              setDeleteOpen(open);
            }}
          >
            <AlertDialogContent finalFocus={managementTriggerRef}>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除帖子</AlertDialogTitle>
                <AlertDialogDescription>
                  删除后帖子将从公开列表和详情页隐藏。目标帖子：{topic.title}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={adminPending}>取消</AlertDialogCancel>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => runTopicAction("delete")}
                  disabled={adminPending}
                >
                  {adminPending ? "删除中" : "确认删除帖子"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}

export function canEditTopic(topic: any, currentUser: any) {
  return (
    !!currentUser && (currentUser.is_admin || currentUser.loginname === topic?.author?.loginname)
  );
}

export function ReplySection({
  replies,
  replySort,
  topicId,
  currentUser,
}: {
  replies: ReplyWithFloor<any>[];
  replySort: ReplySort;
  topicId: string;
  currentUser: any;
}) {
  const [targetReply, setTargetReply] = useState<TopicReplyDTO | null>(null);
  const [content, setContent] = useState("");
  const [createdReplyId, setCreatedReplyId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { revalidate } = useRevalidator();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!createdReplyId || !replies.some(({ reply }) => reply.id === createdReplyId)) return;

    const replyId = createdReplyId;
    setCreatedReplyId(null);
    void navigate(
      {
        pathname: location.pathname,
        search: location.search,
        hash: `#${replyId}`,
      },
      { replace: true, preventScrollReset: true },
    );
    window.requestAnimationFrame(() => {
      focusReplyElement(replyId);
    });
  }, [createdReplyId, location.pathname, location.search, navigate, replies]);

  function focusReplyEditor() {
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
      formRef.current?.querySelector("textarea")?.focus();
    }, 0);
  }

  function startReply(reply?: any) {
    setTargetReply(reply || null);
    setContent(reply?.author?.loginname ? `@${reply.author.loginname} ` : "");
    focusReplyEditor();
  }

  function changeReplySort(value: ReplySort) {
    const searchParams = new URLSearchParams(location.search);
    if (value === "oldest") searchParams.set("reply_sort", "oldest");
    else searchParams.delete("reply_sort");

    void navigate(
      {
        pathname: location.pathname,
        search: searchParams.size > 0 ? `?${searchParams.toString()}` : "",
        hash: location.hash,
      },
      { preventScrollReset: true },
    );
  }

  const { run: submitReply, pending: submitting } = useAsyncAction(
    async () => {
      return apiFetch<{ success: boolean; reply_id?: string; error_msg?: string }>(
        `/api/v1/topic/${topicId}/replies`,
        {
          method: "POST",
          body: JSON.stringify({
            content,
            reply_id: targetReply?.id,
            turnstileToken: getTurnstileToken(),
          }),
        },
      );
    },
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success("回复成功");
          setContent("");
          setTargetReply(null);
          void revalidate().then(() => {
            if (res.reply_id) setCreatedReplyId(res.reply_id);
          });
        } else {
          toast.error(res.error_msg || "回复失败");
        }
      },
    },
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    submitReply();
  };

  return (
    <section id="replies" className="flex scroll-mt-24 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">回复 ({replies.length})</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            items={REPLY_SORT_ITEMS}
            value={replySort}
            onValueChange={(value) => changeReplySort(resolveReplySort(value))}
          >
            <SelectTrigger size="sm" aria-label="回复排序方式">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                {REPLY_SORT_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {currentUser && (
            <Button variant="outline" size="sm" onClick={() => startReply()}>
              添加回复
            </Button>
          )}
        </div>
      </div>

      {replies.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              暂无回复，成为第一个参与讨论的人。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {replies.map(({ reply, floor }) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              floor={floor}
              currentUser={currentUser}
              onReply={() => startReply(reply)}
            />
          ))}
        </div>
      )}

      <Card>
        <CardContent>
          <h2 className="mb-4 text-base font-semibold">
            {targetReply ? `回复 ${targetReply.author?.loginname}` : "参与回复"}
          </h2>
          {currentUser ? (
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="flex scroll-mt-24 flex-col gap-3"
            >
              {targetReply && (
                <div className="rounded-lg bg-accent p-3 text-sm text-accent-foreground">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="font-medium">引用 #{targetReply.id}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => startReply()}>
                      取消引用
                    </Button>
                  </div>
                  <p className="line-clamp-2 text-muted-foreground">{targetReply.content}</p>
                </div>
              )}
              <MarkdownEditor
                value={content}
                onChange={setContent}
                placeholder="支持 Markdown，建议贴出代码和错误信息"
              />
              <TurnstileWidget />
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={!content.trim() || submitting}>
                  回复
                </Button>
              </div>
            </form>
          ) : (
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              登录后即可参与回复。
              <Button render={<Link to="/signin" />} size="sm" className="ml-3">
                登录
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function ReplyItem({
  reply,
  floor,
  currentUser,
  onReply,
}: {
  reply: any;
  floor: number;
  currentUser: any;
  onReply: () => void;
}) {
  const author = reply.author;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null);
  const { revalidate } = useRevalidator();

  const { run: toggleUp, pending: upping } = useAsyncAction(
    async (): Promise<{
      success: boolean;
      action?: "up" | "down";
      error_msg?: string;
      skipped?: boolean;
    }> => {
      if (!currentUser) {
        toast.error("登录后即可点赞回复");
        return { success: false, skipped: true };
      }
      return apiFetch<{ success: boolean; action?: "up" | "down"; error_msg?: string }>(
        `/api/v1/reply/${reply.id}/ups`,
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      ).catch(() => ({ success: false, error_msg: "点赞失败" }));
    },
    {
      onSuccess: (res) => {
        if (res.skipped) return;
        if (res.success) {
          toast.success(res.action === "down" ? "已取消点赞" : "已点赞");
          void revalidate();
        } else {
          toast.error(res.error_msg || "点赞失败");
        }
      },
    },
  );

  const { run: deleteReply, pending: deleting } = useAsyncAction(
    async (): Promise<{ success: boolean; error_msg?: string; skipped?: boolean }> => {
      if (!currentUser) return { success: false, skipped: true };
      const path = currentUser.is_mod
        ? `/api/v1/admin/reply/${reply.id}/delete`
        : `/api/v1/reply/${reply.id}/delete`;
      return apiFetch<{ success: boolean; error_msg?: string }>(path, {
        method: "POST",
        body: JSON.stringify({}),
      }).catch(() => ({ success: false, error_msg: "删除失败" }));
    },
    {
      onSuccess: (res) => {
        if (res.skipped) return;
        if (res.success) {
          toast.success("回复已删除");
          setDeleteOpen(false);
          void revalidate();
        } else {
          toast.error(res.error_msg || "删除失败");
        }
      },
    },
  );

  const upCount = Array.isArray(reply.ups) ? reply.ups.length : 0;
  const canDelete =
    currentUser && (currentUser.is_mod || currentUser.loginname === author?.loginname);
  return (
    <Card id={reply.id} data-reply-id={reply.id} tabIndex={-1} className="scroll-mt-24">
      <CardHeader>
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage
              src={getAvatarUrl(author?.avatar_url, 40)}
              alt={author?.loginname || "CNode"}
            />
            <AvatarFallback>{getAvatarFallback(author?.loginname)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
            <Link to={`/user/${author?.loginname}`} className="font-medium hover:text-primary">
              {author?.loginname || "社区成员"}
            </Link>
            <span className="text-muted-foreground">#{floor}</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock3 aria-hidden="true" className="size-3.5" />
              <TimeAgo date={reply.create_at} />
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex min-w-0 flex-col gap-4">
          {reply.reply_to && (
            <a
              href={`#${reply.reply_to.id}`}
              className="block rounded-lg bg-muted p-3 text-sm transition-colors hover:bg-accent"
            >
              <span className="font-medium text-foreground">
                引用 {reply.reply_to.author?.loginname || "社区成员"}
              </span>
              <span className="mt-1 block line-clamp-2 text-muted-foreground">
                {reply.reply_to.content_excerpt}
              </span>
            </a>
          )}
          <MarkdownView content={reply.content} />
          <div
            className="flex flex-wrap items-center justify-between gap-2"
            aria-label={`回复 #${floor} 操作`}
          >
            <div className="flex items-center gap-1" aria-label="参与操作">
              <Button
                type="button"
                variant={reply.is_uped ? "default" : "ghost"}
                size="sm"
                onClick={toggleUp}
                disabled={upping}
              >
                <ThumbsUp /> {upping ? "处理中" : upCount > 0 ? `${upCount} 赞` : "赞"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onReply}>
                <MessageSquare /> 回复
              </Button>
            </div>
            {(currentUser || canDelete) && (
              <div className="flex items-center gap-1" aria-label="治理操作">
                {currentUser && <ReportButton targetType="reply" targetId={reply.id} />}
                {canDelete && (
                  <Button
                    ref={deleteTriggerRef}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteOpen(true)}
                    disabled={deleting}
                  >
                    <Trash2 /> {deleting ? "删除中" : "删除回复"}
                  </Button>
                )}
              </div>
            )}
          </div>
          <Dialog
            open={deleteOpen}
            onOpenChange={(open, eventDetails) => {
              if (!open && deleting) {
                eventDetails.cancel();
                return;
              }
              setDeleteOpen(open);
            }}
          >
            <DialogContent finalFocus={deleteTriggerRef}>
              <DialogHeader>
                <DialogTitle>确认删除回复</DialogTitle>
                <DialogDescription>
                  删除后这条回复将从帖子详情回复列表隐藏，不会删除所属帖子。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteOpen(false)}
                  disabled={deleting}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={deleteReply}
                  disabled={deleting}
                >
                  {deleting ? "删除中" : "确认删除回复"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportButton({
  targetType,
  targetId,
}: {
  targetType: "topic" | "reply";
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("spam");
  const [description, setDescription] = useState("");
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const { run: submitReport, pending: submitting } = useAsyncAction(
    async () => {
      return apiFetch<{ success: boolean; error_msg?: string }>("/api/v1/admin/reports", {
        method: "POST",
        body: JSON.stringify({ targetType, targetId, type, description }),
      }).catch(() => ({ success: false, error_msg: "举报失败" }));
    },
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success("举报已提交");
          setDescription("");
          setOpen(false);
        } else {
          toast.error(res.error_msg || "举报失败");
        }
      },
    },
  );

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Flag /> 举报
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value, eventDetails) => {
          if (!value && submitting) {
            eventDetails.cancel();
            return;
          }
          setOpen(value);
        }}
      >
        <DialogContent finalFocus={triggerRef}>
          <DialogHeader>
            <DialogTitle>举报内容</DialogTitle>
            <DialogDescription>
              请选择举报类型，也可以补充说明，管理员会在后台处理。
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <NativeSelect
              value={type}
              onChange={(event) => setType(event.target.value)}
              aria-label="举报类型"
            >
              <option value="spam">垃圾广告</option>
              <option value="attack">攻击辱骂</option>
              <option value="irrelevant">无关内容</option>
              <option value="other">其他</option>
            </NativeSelect>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="可选说明"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button type="button" onClick={submitReport} disabled={submitting}>
              {submitting ? "提交中" : "提交举报"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { TopicAuthorCard, TopicContext };
