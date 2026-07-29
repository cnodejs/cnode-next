import { useState, type FormEvent } from "react";
import type { Route } from "../../.react-router/types/app/routes/+types/topic.$tid";
import { Link, useRevalidator } from "react-router";
import { toast } from "sonner";
import { Flag, MessageSquare, Star, ThumbsUp, Trash2 } from "lucide-react";
import { Layout } from "~/components/Layout";
import { MarkdownView } from "~/components/MarkdownView";
import { TimeAgo } from "~/components/TimeAgo";
import { StatusBadge, TagBadge } from "~/components/TagBadge";
import { MarkdownEditor } from "~/components/MarkdownEditor";
import { JobMetaCard } from "~/components/JobMetaCard";
import { ReadingGrid } from "~/components/PageShell";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { apiFetch, getCurrentUser } from "~/lib/api-client";
import { getAvatarFallback, getAvatarUrl, getTabLabel } from "~/lib/brand";
import { kvGet, kvSet } from "~/lib/kv-cache";
import { extractMarkdownHeadings } from "~/lib/markdown-headings";
import { TurnstileWidget, getTurnstileToken } from "~/components/TurnstileWidget";
import { useAsyncAction } from "~/hooks/use-async-action";

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const tid = params.tid!;
  const cacheKey = `topic:${tid}`;
  const kv = (context as any)?.cloudflare?.env?.KV;
  const currentUser = await getCurrentUser(request);
  const cached = currentUser ? null : await kvGet<any>(kv, cacheKey);
  if (cached) return { topic: cached, kv, currentUser };

  const cookie = request.headers.get("cookie") || "";
  const res = await apiFetch<{ success: boolean; data: any }>(`/api/v1/topic/${tid}?mdrender=false`, {
    headers: { cookie },
  });
  if (!res.success) return { topic: null, kv, currentUser };
  if (!currentUser) await kvSet(kv, cacheKey, res.data, 60);
  return { topic: res.data, kv, currentUser };
}

export function meta({ data }: Route.MetaArgs) {
  if (!data?.topic) return [{ title: "话题不存在" }];
  return [
    { title: `${data.topic.title} · CNode` },
    { property: "og:title", content: data.topic.title },
    { property: "og:description", content: data.topic.content?.slice(0, 100) },
  ];
}

export default function TopicDetail({ loaderData }: Route.ComponentProps) {
  const { topic, currentUser } = loaderData as any;
  if (!topic) {
    return (
      <Layout>
        <Card className="w-full text-center">
          <CardContent className="space-y-3 py-12">
            <h1 className="text-xl font-semibold">话题不存在或已被删除</h1>
            <p className="text-sm text-muted-foreground">返回首页继续浏览社区最新内容。</p>
            <Button asChild>
              <Link to="/">返回首页</Link>
            </Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const headings = extractMarkdownHeadings(topic.content || "").slice(0, 12);
  const toc = headings.length >= 2 ? <TopicToc headings={headings} /> : null;

  return (
    <Layout>
      <ReadingGrid toc={toc} aside={<TopicContext topic={topic} />}>
        <article className="space-y-5">
          <TopicHeader topic={topic} />
          {toc && (
            <details className="rounded-xl border border-border bg-card p-4 text-sm xl:hidden">
              <summary className="cursor-pointer font-medium">本页目录</summary>
              <div className="mt-3">{toc}</div>
            </details>
          )}
          <Card>
            <CardContent className="p-5 sm:p-7">
              {topic.tab === "job" && topic.job_meta && (
                <div className="mb-4">
                  <JobMetaCard meta={topic.job_meta} />
                </div>
              )}
              <MarkdownView
                content={topic.content}
                className="prose-base prose-img:rounded-xl prose-img:border prose-img:border-border prose-pre:overflow-x-auto"
              />
            </CardContent>
          </Card>
          <TopicActions topic={topic} currentUser={currentUser} />
          <ReplySection replies={topic.replies || []} topicId={topic.id} currentUser={currentUser} />
        </article>
      </ReadingGrid>
    </Layout>
  );
}

function TopicHeader({ topic }: { topic: any }) {
  const author = topic.author;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-4 border-b border-border/80 bg-surface-subtle p-5 sm:p-7">
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
          <h1 className="min-w-0 flex-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {topic.title}
          </h1>
          <div className="flex shrink-0 flex-wrap items-center gap-2 pt-1">
            {topic.top && <StatusBadge type="top" />}
            {topic.good && <StatusBadge type="good" />}
            <TagBadge tab={topic.tab} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
          <Link to={`/user/${author?.loginname}`} className="flex items-center gap-2 text-foreground hover:text-primary">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={getAvatarUrl(author?.avatar_url, 36)} alt={author?.loginname || "CNode"} />
              <AvatarFallback>{getAvatarFallback(author?.loginname)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{author?.loginname || "社区成员"}</span>
          </Link>
          <span>发布于</span>
          <TimeAgo date={topic.create_at} />
          {topic.last_reply_at && (
            <>
              <span>最后回复</span>
              <TimeAgo date={topic.last_reply_at} />
            </>
          )}
          <span className="hidden text-border sm:inline">|</span>
          <span>{topic.reply_count || 0} 回复</span>
          <span>{topic.visit_count || 0} 浏览</span>
          <span>{topic.collect_count || 0} 收藏</span>
        </div>
      </CardContent>
    </Card>
  );
}

function TopicToc({ headings }: { headings: ReturnType<typeof extractMarkdownHeadings> }) {
  return (
    <nav className="sticky top-24 rounded-xl border border-border bg-card p-3 text-sm shadow-sm">
      <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">目录</div>
      <div className="space-y-1">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={`block rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground ${
              heading.depth === 3 ? "ml-3 text-xs" : ""
            }`}
          >
            {heading.text}
          </a>
        ))}
      </div>
    </nav>
  );
}

function TopicContext({ topic }: { topic: any }) {
  const author = topic.author;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b border-border/80 bg-surface-subtle">
          <CardTitle className="text-sm">作者</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3 pt-6">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={getAvatarUrl(author?.avatar_url, 48)} alt={author?.loginname || "CNode"} />
            <AvatarFallback>{getAvatarFallback(author?.loginname)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <Link to={`/user/${author?.loginname}`} className="block truncate font-medium hover:text-primary">
              {author?.loginname || "社区成员"}
            </Link>
            <p className="text-xs text-muted-foreground">CNode 社区成员</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="border-b border-border/80 bg-surface-subtle">
          <CardTitle className="text-sm">话题信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-6 text-sm text-muted-foreground">
          <div className="flex justify-between"><span>分类</span><span>{getTabLabel(topic.tab)}</span></div>
          <div className="flex justify-between"><span>回复</span><span>{topic.reply_count || 0}</span></div>
          <div className="flex justify-between"><span>浏览</span><span>{topic.visit_count || 0}</span></div>
        </CardContent>
      </Card>
      <Card className="border-cnode-green/20 bg-cnode-soft">
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium text-foreground">参与讨论前</p>
          <p className="text-xs text-muted-foreground">请提供可复现信息、尊重不同经验背景，并善用 Markdown 格式化代码。</p>
          <Button asChild variant="outline" size="sm" className="w-full bg-background">
            <Link to="/getstart">查看新手指南</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function TopicActions({ topic, currentUser }: { topic: any; currentUser: any }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { revalidate } = useRevalidator();
  const canManage = !!currentUser?.is_mod;

  const { run: toggleCollect, pending: collecting } = useAsyncAction(
    async (): Promise<{ success: boolean; error_msg?: string; skipped?: boolean }> => {
      if (!currentUser) {
        toast.error("登录后即可收藏话题");
        return { success: false, skipped: true };
      }
      const path = topic.is_collect ? "/api/v1/topic_collect/de_collect" : "/api/v1/topic_collect/collect";
      return apiFetch<{ success: boolean; error_msg?: string }>(path, {
        method: "POST",
        body: JSON.stringify({ topic_id: topic.id }),
      }).catch(() => ({ success: false, error_msg: topic.is_collect ? "取消收藏失败" : "收藏失败" }));
    },
    {
      onSuccess: (res) => {
        if (res.skipped) return;
        if (res.success) {
          toast.success(topic.is_collect ? "已取消收藏" : "已收藏话题");
          revalidate();
        } else {
          toast.error(res.error_msg || (topic.is_collect ? "取消收藏失败" : "收藏失败"));
        }
      },
    },
  );

  const { run: runTopicAction, pending: adminPending } = useAsyncAction(
    async (
      action: "delete" | "top" | "good",
    ): Promise<{ success: boolean; message?: string; error_msg?: string; skipped?: boolean; actionLabel: string }> => {
      const actionLabel =
        action === "delete" ? "删除帖子" : action === "top" ? (topic.top ? "取消置顶" : "置顶") : topic.good ? "取消高亮" : "高亮";
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
          revalidate();
        } else {
          toast.error(res.error_msg || `${res.actionLabel}失败`);
        }
      },
    },
  );

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant={topic.is_collect ? "default" : "outline"} size="sm" onClick={() => toggleCollect()} disabled={collecting}>
        <Star className="h-4 w-4" /> {collecting ? "处理中" : topic.is_collect ? "取消收藏" : "收藏话题"}
      </Button>
      <Button asChild variant="ghost" size="sm">
        <a href="#replies">
          <MessageSquare className="h-4 w-4" /> 查看回复
        </a>
      </Button>
      {currentUser && <ReportButton targetType="topic" targetId={topic.id} />}
      {canManage && (
        <>
          <Button type="button" variant="outline" size="sm" onClick={() => runTopicAction("top")} disabled={adminPending}>
            {adminPending ? "处理中" : topic.top ? "取消置顶" : "置顶帖子"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => runTopicAction("good")} disabled={adminPending}>
            {adminPending ? "处理中" : topic.good ? "取消高亮" : "高亮帖子"}
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteOpen(true)} disabled={adminPending}>
            <Trash2 className="h-4 w-4" /> {adminPending ? "删除中" : "删除帖子"}
          </Button>
          <Dialog open={deleteOpen} onOpenChange={(open) => !adminPending && setDeleteOpen(open)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>确认删除帖子</DialogTitle>
                <DialogDescription>
                  删除后帖子将从公开列表和详情页隐藏。目标帖子：{topic.title}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={adminPending}>
                  取消
                </Button>
                <Button type="button" variant="destructive" onClick={() => runTopicAction("delete")} disabled={adminPending}>
                  {adminPending ? "删除中" : "确认删除帖子"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

function ReplySection({
  replies,
  topicId,
  currentUser,
}: {
  replies: any[];
  topicId: string;
  currentUser: any;
}) {
  const [targetReply, setTargetReply] = useState<any | null>(null);
  const [content, setContent] = useState("");
  const { revalidate } = useRevalidator();

  function startReply(reply?: any) {
    setTargetReply(reply || null);
    setContent(reply?.author?.loginname ? `@${reply.author.loginname} ` : "");
  }

  const { run: submitReply, pending: submitting } = useAsyncAction(
    async () => {
      return apiFetch<{ success: boolean; error_msg?: string }>(`/api/v1/topic/${topicId}/replies`, {
        method: "POST",
        body: JSON.stringify({ content, reply_id: targetReply?.id, turnstileToken: getTurnstileToken() }),
      });
    },
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success("回复成功");
          setContent("");
          setTargetReply(null);
          revalidate();
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
    <section id="replies" className="space-y-4 scroll-mt-24">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">回复 ({replies.length})</h2>
        {currentUser && (
          <Button variant="outline" size="sm" onClick={() => startReply()}>
            添加回复
          </Button>
        )}
      </div>

      {replies.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">暂无回复，成为第一个参与讨论的人。</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {replies.map((reply, index) => (
            <ReplyItem key={reply.id} reply={reply} floor={index + 1} currentUser={currentUser} onReply={() => startReply(reply)} />
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="border-b border-border/80 bg-surface-subtle">
          <CardTitle className="text-base">{targetReply ? `回复 ${targetReply.author?.loginname}` : "参与回复"}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {currentUser ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              {targetReply && (
                <div className="rounded-lg border border-cnode-green/30 bg-cnode-soft p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="font-medium">引用 #{targetReply.id}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => startReply()}>
                      取消引用
                    </Button>
                  </div>
                  <p className="line-clamp-2 text-muted-foreground">{targetReply.content}</p>
                </div>
              )}
              <MarkdownEditor value={content} onChange={setContent} placeholder="支持 Markdown，建议贴出代码和错误信息" />
              <TurnstileWidget />
              <Button type="submit" size="sm" disabled={!content.trim() || submitting}>
                回复
              </Button>
            </form>
          ) : (
            <div className="rounded-xl border border-border bg-surface-subtle p-4 text-sm text-muted-foreground">
              登录后即可参与回复。
              <Button asChild size="sm" className="ml-3">
                <Link to="/signin">登录</Link>
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
  const { revalidate } = useRevalidator();

  const { run: toggleUp, pending: upping } = useAsyncAction(
    async (): Promise<{ success: boolean; action?: "up" | "down"; error_msg?: string; skipped?: boolean }> => {
      if (!currentUser) {
        toast.error("登录后即可点赞回复");
        return { success: false, skipped: true };
      }
      return apiFetch<{ success: boolean; action?: "up" | "down"; error_msg?: string }>(`/api/v1/reply/${reply.id}/ups`, {
        method: "POST",
        body: JSON.stringify({}),
      }).catch(() => ({ success: false, error_msg: "点赞失败" }));
    },
    {
      onSuccess: (res) => {
        if (res.skipped) return;
        if (res.success) {
          toast.success(res.action === "down" ? "已取消点赞" : "已点赞");
          revalidate();
        } else {
          toast.error(res.error_msg || "点赞失败");
        }
      },
    },
  );

  const { run: deleteReply, pending: deleting } = useAsyncAction(
    async (): Promise<{ success: boolean; error_msg?: string; skipped?: boolean }> => {
      if (!currentUser) return { success: false, skipped: true };
      const path = currentUser.is_mod ? `/api/v1/admin/reply/${reply.id}/delete` : `/api/v1/reply/${reply.id}/delete`;
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
          revalidate();
        } else {
          toast.error(res.error_msg || "删除失败");
        }
      },
    },
  );

  const upCount = Array.isArray(reply.ups) ? reply.ups.length : 0;
  const canDelete = currentUser && (currentUser.is_mod || currentUser.loginname === author?.loginname);
  return (
    <Card id={reply.id} className="scroll-mt-24 overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border/80 bg-surface-subtle px-4 py-3 sm:px-5">
        <Avatar className="h-8 w-8 border border-border">
          <AvatarImage src={getAvatarUrl(author?.avatar_url, 40)} alt={author?.loginname || "CNode"} />
          <AvatarFallback>{getAvatarFallback(author?.loginname)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link to={`/user/${author?.loginname}`} className="font-medium hover:text-primary">
              {author?.loginname || "社区成员"}
            </Link>
            <span className="text-muted-foreground">#{floor}</span>
            <span className="text-muted-foreground">·</span>
            <TimeAgo date={reply.create_at} />
          </div>
        </div>
      </div>
      <CardContent className="p-4 sm:p-5">
        <div className="flex gap-3">
          <div className="hidden w-8 shrink-0 sm:block" />
          <div className="min-w-0 flex-1 space-y-3">
            {reply.reply_to && (
              <a
                href={`#${reply.reply_to.id}`}
                className="block rounded-lg border border-border bg-surface-subtle p-3 text-sm hover:border-cnode-green/40"
              >
                <span className="font-medium text-foreground">引用 {reply.reply_to.author?.loginname || "社区成员"}</span>
                <span className="mt-1 block line-clamp-2 text-muted-foreground">{reply.reply_to.content_excerpt}</span>
              </a>
            )}
            <MarkdownView content={reply.content} />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={reply.is_uped ? "default" : "ghost"}
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={toggleUp}
                disabled={upping}
              >
                <ThumbsUp className="h-3 w-3" /> {upping ? "处理中" : upCount > 0 ? `${upCount} 赞` : "赞"}
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={onReply}>
                <MessageSquare className="h-3 w-3" /> 回复
              </Button>
              {currentUser && <ReportButton targetType="reply" targetId={reply.id} compact />}
              {canDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                  disabled={deleting}
                >
                  <Trash2 className="h-3 w-3" /> {deleting ? "删除中" : "删除回复"}
                </Button>
              )}
              <Dialog open={deleteOpen} onOpenChange={(open) => !deleting && setDeleteOpen(open)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>确认删除回复</DialogTitle>
                    <DialogDescription>
                      删除后这条回复将从帖子详情回复列表隐藏，不会删除所属帖子。
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                      取消
                    </Button>
                    <Button type="button" variant="destructive" onClick={deleteReply} disabled={deleting}>
                      {deleting ? "删除中" : "确认删除回复"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportButton({ targetType, targetId, compact = false }: { targetType: "topic" | "reply"; targetId: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("spam");
  const [description, setDescription] = useState("");

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
      <Button type="button" variant="ghost" size="sm" className={compact ? "h-8 px-2 text-xs" : undefined} onClick={() => setOpen(true)}>
        <Flag className={compact ? "h-3 w-3" : "h-4 w-4"} /> 举报
      </Button>
      <Dialog open={open} onOpenChange={(value) => !submitting && setOpen(value)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>举报内容</DialogTitle>
            <DialogDescription>请选择举报类型，也可以补充说明，管理员会在后台处理。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <select value={type} onChange={(event) => setType(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="spam">垃圾广告</option>
              <option value="attack">攻击辱骂</option>
              <option value="irrelevant">无关内容</option>
              <option value="other">其他</option>
            </select>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="可选说明"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>取消</Button>
            <Button type="button" onClick={submitReport} disabled={submitting}>{submitting ? "提交中" : "提交举报"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
