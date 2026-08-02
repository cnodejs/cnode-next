import { Link } from "react-router";
import { useState, useEffect } from "react";
import { apiFetch } from "~/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { TimeAgo } from "./TimeAgo";
import { getAvatarFallback, getAvatarUrl, getTabLabel } from "~/lib/brand";
import { ArrowUpRight, MessageCircle, Pencil, Trophy } from "lucide-react";

type SidebarData = {
  latest_replies: Array<{
    id: string;
    topic_id: string;
    topic_title: string;
    author?: { loginname?: string; avatar_url?: string };
    create_at?: string;
    excerpt?: string;
  }>;
  no_reply_topics: Array<{ id: string; title: string; tab?: string; create_at?: string }>;
  top_users: Array<{ id: string; loginname: string; avatar_url?: string; score: number }>;
  partners: Array<{ name: string; url: string; description?: string }>;
  resources: Array<{ name: string; url: string }>;
};

export function Sidebar() {
  const [data, setData] = useState<SidebarData | null>(null);

  useEffect(() => {
    apiFetch<{ success: boolean; data: SidebarData }>("/api/v1/sidebar/home")
      .then((res) => setData(res.success ? res.data : emptySidebarData()))
      .catch(() => setData(emptySidebarData()));
  }, []);

  return (
    <aside className="flex flex-col gap-4">
      <Card className="overflow-hidden bg-cnode-ink text-white shadow-brand">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-sm text-white">CNode 社区</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-4 pb-4">
          <p className="text-sm text-white/75">Node.js 专业中文社区，分享实践、提出问题、连接开发者。</p>
          <Button
            render={<Link to="/topic/create" />}
            variant="inverse"
            className="w-full"
            size="sm"
          >
            <Pencil className="h-4 w-4" />
            发布话题
          </Button>
        </CardContent>
      </Card>

      {data ? <LatestReplies replies={data.latest_replies} /> : <SidebarSkeleton />}
      {data ? <NoReplyTopics topics={data.no_reply_topics} /> : <SidebarSkeleton />}
      {data ? <Leaderboard users={data.top_users} /> : <SidebarSkeleton />}
      {data ? <CommunityLinks partners={data.partners} resources={data.resources} /> : <SidebarSkeleton />}
    </aside>
  );
}

function SidebarSkeleton() {
  return (
    <Card className="border-0 bg-surface-subtle shadow-none">
      <CardContent className="flex flex-col gap-3 p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </CardContent>
    </Card>
  );
}

function LatestReplies({ replies }: { replies: SidebarData["latest_replies"] }) {
  if (replies.length === 0) return null;
  return (
    <Card className="border-0 bg-surface-subtle shadow-none">
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-sm">最新回复</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4 pb-4">
        {replies.map((reply) => {
          const author = reply.author;
          return (
            <Link key={reply.id} to={`/topic/${reply.topic_id}#${reply.id}`} className="group flex gap-3">
              <Avatar className="mt-0.5 size-8">
                <AvatarImage src={getAvatarUrl(author?.avatar_url, 32)} alt={author?.loginname || "CNode"} />
                <AvatarFallback>{getAvatarFallback(author?.loginname)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 text-xs">
                <span className="block truncate font-medium text-foreground group-hover:text-primary">
                  {reply.topic_title}
                </span>
                <span className="mt-0.5 block truncate text-muted-foreground">
                  {author?.loginname || "社区成员"} · {reply.create_at ? <TimeAgo date={reply.create_at} /> : null}
                </span>
              </span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

function NoReplyTopics({ topics }: { topics: SidebarData["no_reply_topics"] }) {
  if (topics.length === 0) return null;

  return (
    <Card className="border-0 bg-surface-subtle shadow-none">
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-sm">无人回复的话题</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ul className="flex flex-col gap-2 text-xs">
          {topics.map((t) => (
            <li key={t.id}>
              <Link to={`/topic/${t.id}`} className="block truncate font-medium text-foreground hover:text-primary">
                {t.title}
              </Link>
              <div className="mt-0.5 flex items-center gap-2 text-muted-foreground">
                <span>{getTabLabel(t.tab)}</span>
                {t.create_at && <TimeAgo date={t.create_at} />}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function Leaderboard({ users }: { users: SidebarData["top_users"] }) {
  if (users.length === 0) return null;
  return (
    <Card className="border-0 bg-surface-subtle shadow-none">
      <CardHeader className="p-4 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Trophy className="h-4 w-4 text-cnode-green" /> 积分榜
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4 pb-4">
        {users.map((user, index) => (
          <Link key={user.id} to={`/user/${user.loginname}`} className="flex items-center gap-3 text-sm">
            <span className="w-5 text-xs font-semibold text-muted-foreground">#{index + 1}</span>
            <Avatar className="size-8">
              <AvatarImage src={getAvatarUrl(user.avatar_url, 32)} alt={user.loginname} />
              <AvatarFallback>{getAvatarFallback(user.loginname)}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate font-medium hover:text-primary">{user.loginname}</span>
            <span className="text-xs text-muted-foreground">{user.score}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function CommunityLinks({
  partners,
  resources,
}: {
  partners: SidebarData["partners"];
  resources: SidebarData["resources"];
}) {
  return (
    <Card className="border-0 bg-surface-subtle shadow-none">
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-sm">生态资源</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-4 pb-4">
        <div className="grid gap-2">
          {partners.map((l) => (
            <a
              key={l.name}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-surface-subtle p-3 text-xs transition-colors hover:bg-accent"
            >
              <span className="flex items-center justify-between font-medium text-foreground">
                {l.name} <ArrowUpRight className="h-3 w-3" />
              </span>
              {l.description && <span className="mt-1 block text-muted-foreground">{l.description}</span>}
            </a>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {resources.map((l) => (
            <a
              key={l.name}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground hover:text-primary"
            >
              <MessageCircle className="h-3 w-3" />
              {l.name}
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function emptySidebarData(): SidebarData {
  return {
    latest_replies: [],
    no_reply_topics: [],
    top_users: [],
    partners: [
      { name: "Node.js", url: "https://nodejs.org", description: "JavaScript runtime" },
      { name: "npm", url: "https://www.npmjs.com", description: "Package ecosystem" },
    ],
    resources: [
      { name: "Express", url: "https://expressjs.com" },
      { name: "Koa", url: "https://koajs.com" },
      { name: "Egg", url: "https://eggjs.org" },
    ],
  };
}
