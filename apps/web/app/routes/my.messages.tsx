import type { Route } from "../../.react-router/types/app/routes/+types/my.messages";
import { useEffect, useState } from "react";
import { Link, useRevalidator } from "react-router";
import { toast } from "sonner";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { Layout } from "~/components/Layout";
import { ContentPage } from "~/components/PageShell";
import { TimeAgo } from "~/components/TimeAgo";
import { apiFetch } from "~/lib/api-client";
import { requireUser } from "~/lib/auth";
import { getAvatarFallback, getAvatarUrl } from "~/lib/brand";
import { useAuthStore } from "~/lib/stores/auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { EmptyState } from "~/components/EmptyState";
import { useAsyncAction } from "~/hooks/use-async-action";

export function meta() {
  return [{ title: "消息 · CNode" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  const cookie = request.headers.get("cookie") || "";
  const res = await apiFetch<{
    success: boolean;
    data: { has_read_messages: any[]; hasnot_read_messages: any[] };
  }>("/api/v1/messages", { headers: { cookie } });
  const unread = res.success ? res.data.hasnot_read_messages || [] : [];
  return {
    readMsgs: res.success ? res.data.has_read_messages || [] : [],
    unreadMsgs: unread,
  };
}

export default function Messages({ loaderData }: Route.ComponentProps) {
  const { readMsgs: initialRead, unreadMsgs: initialUnread } = loaderData as any;
  const [readMsgs, setReadMsgs] = useState<any[]>(initialRead || []);
  const [unreadMsgs, setUnreadMsgs] = useState<any[]>(initialUnread || []);
  const setUnreadCount = useAuthStore((s) => s.setUnreadCount);
  const fetchUnread = useAuthStore((s) => s.fetchUnread);
  const { revalidate } = useRevalidator();

  useEffect(() => {
    setReadMsgs(initialRead || []);
    setUnreadMsgs(initialUnread || []);
    fetchUnread();
  }, [initialRead, initialUnread, fetchUnread]);

  const { run: markOneRead, pending: markingOne } = useAsyncAction(
    async (msgId: string) => {
      const res = await apiFetch<{ success: boolean }>(`/api/v1/message/mark_one/${msgId}`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      return { ...res, msgId };
    },
    {
      onSuccess: (res) => {
        if (!res.success) return;
        const msg = unreadMsgs.find((item) => item.id === res.msgId);
        setUnreadMsgs((items) => items.filter((item) => item.id !== res.msgId));
        if (msg) setReadMsgs((items) => [{ ...msg, has_read: true }, ...items]);
        setUnreadCount(Math.max(0, unreadMsgs.length - 1));
        toast.success("已标记已读");
        fetchUnread();
        revalidate();
      },
    },
  );

  const { run: markAllRead, pending: markingAll } = useAsyncAction(
    async () => {
      return apiFetch<{ success: boolean }>("/api/v1/message/mark_all", { method: "POST", body: JSON.stringify({}) });
    },
    {
      onSuccess: (res) => {
        if (!res.success) return;
        setReadMsgs((items) => [...unreadMsgs.map((msg) => ({ ...msg, has_read: true })), ...items]);
        setUnreadMsgs([]);
        setUnreadCount(0);
        toast.success("已全部标记已读");
        fetchUnread();
        revalidate();
      },
    },
  );

  return (
    <Layout>
      <ContentPage className="space-y-6">
        <section className="rounded-3xl bg-cnode-soft p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">MESSAGES</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">消息中心</h1>
              <p className="mt-2 text-sm text-muted-foreground">查看回复、定向回复和 @ 提及通知。</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={unreadMsgs.length > 0 ? "default" : "secondary"}>
                {unreadMsgs.length} 条新消息
              </Badge>
              <Button size="sm" variant="outline" onClick={() => markAllRead()} disabled={unreadMsgs.length === 0 || markingAll}>
                <CheckCheck className="h-4 w-4" /> {markingAll ? "处理中" : "全部已读"}
              </Button>
            </div>
          </div>
        </section>

        <MessageGroup title="新消息" icon={<Bell className="h-4 w-4" />} messages={unreadMsgs} onMarkRead={markOneRead} pending={markingOne} />
        <MessageGroup title="过往消息" icon={<Inbox className="h-4 w-4" />} messages={readMsgs} onMarkRead={markOneRead} pending={markingOne} />
      </ContentPage>
    </Layout>
  );
}

function MessageGroup({
  title,
  icon,
  messages,
  onMarkRead,
  pending,
}: {
  title: string;
  icon: React.ReactNode;
  messages: any[];
  onMarkRead: (id: string) => void;
  pending: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-4 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
          <span className="text-sm font-normal text-muted-foreground">({messages.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {messages.length > 0 ? (
          <div className="flex flex-col gap-1 p-2">
            {messages.map((msg) => (
              <MessageItem key={msg.id} msg={msg} onMarkRead={onMarkRead} pending={pending} />
            ))}
          </div>
        ) : (
          <EmptyState message={title === "新消息" ? "暂无新消息" : "暂无过往消息"} />
        )}
      </CardContent>
    </Card>
  );
}

function MessageItem({ msg, onMarkRead, pending }: { msg: any; onMarkRead: (id: string) => void; pending: boolean }) {
  const typeText =
    msg.type === "reply"
      ? "回复了你的话题"
      : msg.type === "reply2"
        ? "在话题中回复了你"
        : "在话题中 @ 了你";
  const topicHref = msg.topic ? `/topic/${msg.topic.id}${msg.reply?.id ? `#${msg.reply.id}` : ""}` : "#";

  return (
    <article className="flex gap-3 rounded-xl p-3 transition-colors hover:bg-surface-subtle sm:gap-4 sm:p-4">
      <Link to={`/user/${msg.author?.loginname}`} className="shrink-0">
        <Avatar className="size-10">
          <AvatarImage src={getAvatarUrl(msg.author?.avatar_url, 40)} alt={msg.author?.loginname || "CNode"} />
          <AvatarFallback>{getAvatarFallback(msg.author?.loginname)}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <Link to={`/user/${msg.author?.loginname}`} className="font-semibold hover:text-primary">
            {msg.author?.loginname || "社区成员"}
          </Link>
          <span className="text-muted-foreground">{typeText}</span>
          {!msg.has_read && <span className="h-2 w-2 rounded-full bg-primary" aria-label="未读" />}
        </div>
        {msg.topic && (
          <Link to={topicHref} className="block truncate font-medium text-foreground hover:text-primary">
            {msg.topic.title}
          </Link>
        )}
        {msg.reply?.content && (
          <div className="line-clamp-2 rounded-lg bg-surface-subtle px-3 py-2 text-sm text-muted-foreground">
            {msg.reply.content}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <TimeAgo date={msg.create_at} />
          {!msg.has_read && (
            <Button size="sm" variant="link" className="h-auto p-0 text-xs" onClick={() => onMarkRead(msg.id)} disabled={pending}>
              {pending ? "处理中" : "标记已读"}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
