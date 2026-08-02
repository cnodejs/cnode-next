import { Link } from "react-router";
import type { TopicDTO } from "~/lib/api-types";
import { Eye, MessageSquare } from "lucide-react";
import { TimeAgo } from "./TimeAgo";
import { TagBadge, StatusBadge } from "./TagBadge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getAvatarFallback, getAvatarUrl } from "~/lib/brand";

export function TopicListItem({ topic }: { topic: TopicDTO }) {
  const author = topic.author || {
    loginname: "unknown",
    avatar_url: "",
  };

  return (
    <article className="group flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-surface-subtle sm:gap-4 sm:px-4">
      <Link to={`/user/${author.loginname}`} className="shrink-0">
        <Avatar className="size-10 sm:size-11">
          <AvatarImage src={getAvatarUrl(author.avatar_url, 48)} alt={author.loginname} />
          <AvatarFallback>{getAvatarFallback(author.loginname)}</AvatarFallback>
        </Avatar>
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            to={`/topic/${topic.id}`}
            className="min-w-0 flex-1 truncate text-base font-semibold leading-6 text-foreground group-hover:text-primary"
          >
            {topic.title}
          </Link>
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            {topic.top && <StatusBadge type="top" />}
            {topic.good && <StatusBadge type="good" />}
            <TagBadge tab={topic.tab} />
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <Link
            to={`/user/${author.loginname}`}
            className="font-medium text-foreground/80 hover:text-primary"
          >
            {author.loginname}
          </Link>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" /> {topic.reply_count}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" /> {topic.visit_count}
          </span>
          {topic.last_reply_at && <TimeAgo date={topic.last_reply_at} />}
          <span className="flex items-center gap-2 sm:hidden">
            {topic.top && <StatusBadge type="top" />}
            {topic.good && <StatusBadge type="good" />}
            <TagBadge tab={topic.tab} />
          </span>
        </div>
      </div>
    </article>
  );
}

export function TopicList({ topics }: { topics: TopicDTO[] }) {
  if (topics.length === 0) {
    return <div className="py-12 text-center text-muted-foreground">暂无话题</div>;
  }
  return (
    <div className="flex flex-col gap-1 p-2">
      {topics.map((t) => (
        <TopicListItem key={t.id} topic={t} />
      ))}
    </div>
  );
}
