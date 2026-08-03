import { Link } from "react-router";
import type { TopicDTO } from "~/lib/api-types";
import { Eye, MessageSquare } from "lucide-react";
import { TimeAgo } from "./TimeAgo";
import { TagBadge, StatusBadge } from "./TagBadge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getAvatarFallback, getAvatarUrl } from "~/lib/brand";
import { Item, ItemContent, ItemGroup, ItemMedia } from "./ui/item";

export function TopicListItem({ topic }: { topic: TopicDTO }) {
  const author = topic.author || {
    loginname: "unknown",
    avatar_url: "",
  };

  return (
    <Item render={<article />}>
      <ItemMedia variant="image">
        <Link to={`/user/${author.loginname}`}>
        <Avatar>
          <AvatarImage src={getAvatarUrl(author.avatar_url, 48)} alt={author.loginname} />
          <AvatarFallback>{getAvatarFallback(author.loginname)}</AvatarFallback>
        </Avatar>
        </Link>
      </ItemMedia>

      <ItemContent className="min-w-0">
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
            <MessageSquare className="size-3.5" /> {topic.reply_count}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" /> {topic.visit_count}
          </span>
          {topic.last_reply_at && <TimeAgo date={topic.last_reply_at} />}
          <span className="flex items-center gap-2 sm:hidden">
            {topic.top && <StatusBadge type="top" />}
            {topic.good && <StatusBadge type="good" />}
            <TagBadge tab={topic.tab} />
          </span>
        </div>
      </ItemContent>
    </Item>
  );
}

export function TopicList({ topics }: { topics: TopicDTO[] }) {
  if (topics.length === 0) {
    return <div className="py-12 text-center text-muted-foreground">暂无话题</div>;
  }
  return (
    <ItemGroup>
      {topics.map((t) => (
        <TopicListItem key={t.id} topic={t} />
      ))}
    </ItemGroup>
  );
}
