import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "~/components/ui/item";
import { cn } from "~/lib/utils";
import { getDefaultTopicTabLabel, getTopicTabPresentation } from "~/lib/topic-tab-presentation";
import { ArrowRight, BadgeInfo, Compass, LockKeyhole, ShieldCheck } from "lucide-react";

export function TopicTabInfoCard({
  tab,
  label,
  className,
}: {
  tab: string;
  label?: string;
  className?: string;
}) {
  const info = getTopicTabPresentation(tab);
  if (!info) return null;
  return (
    <Card size="sm" className={className}>
      <CardHeader>
        <CardTitle>{info.title || label || getDefaultTopicTabLabel(tab)}</CardTitle>
        <CardDescription>了解板块范围与内容边界。</CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          <Item variant="muted" size="sm">
            <ItemMedia variant="icon">
              <Compass />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>板块范围</ItemTitle>
              <ItemDescription className="line-clamp-none">{info.description}</ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="muted" size="sm">
            <ItemMedia variant="icon">
              <BadgeInfo />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>内容边界</ItemTitle>
              <ItemDescription className="line-clamp-none">{info.details}</ItemDescription>
            </ItemContent>
          </Item>
        </ItemGroup>
      </CardContent>
    </Card>
  );
}

export function TopicTabSummary({ tab, className }: { tab: string; className?: string }) {
  const info = getTopicTabPresentation(tab);
  if (!info) return null;
  return (
    <p className={cn("rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground", className)}>
      <span className="font-medium text-foreground">
        {info.title || getDefaultTopicTabLabel(tab)}：
      </span>
      {info.description}
    </p>
  );
}

export function PublishingRulesCard({ className }: { className?: string }) {
  return (
    <Card size="sm" className={className}>
      <CardHeader>
        <CardTitle>发布规范</CardTitle>
        <CardDescription>发布前请确认内容符合以下要求。</CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          <Item variant="muted" size="sm">
            <ItemMedia variant="icon">
              <ShieldCheck />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>保持合法与友善</ItemTitle>
              <ItemDescription className="line-clamp-none">
                禁止违法内容、人身攻击、垃圾信息、重复灌水和无关广告。
              </ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="muted" size="sm">
            <ItemMedia variant="icon">
              <LockKeyhole />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>保护敏感信息</ItemTitle>
              <ItemDescription className="line-clamp-none">
                不得公开密码、Token、私钥、个人隐私或其他敏感信息。
              </ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="muted" size="sm">
            <ItemMedia variant="icon">
              <BadgeInfo />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>标注来源与关系</ItemTitle>
              <ItemDescription className="line-clamp-none">
                引用必须注明来源；商业推广、招聘和付费活动必须披露相关关系。
              </ItemDescription>
            </ItemContent>
          </Item>
        </ItemGroup>
      </CardContent>
      <CardFooter>
        <Button
          render={<Link to="/about#discussion" />}
          variant="ghost"
          size="sm"
          className="w-full justify-between"
        >
          查看完整社区规则
          <ArrowRight data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  );
}
