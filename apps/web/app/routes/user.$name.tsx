import { useRef, useState } from "react";
import type { PublicIdentity } from "@cnode/shared";
import type { Route } from "../../.react-router/types/app/routes/+types/user.$name";
import { Link, useRevalidator } from "react-router";
import { Code, ExternalLink, MapPin, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "~/components/Layout";
import { TopicList } from "~/components/TopicList";
import { TimeAgo } from "~/components/TimeAgo";
import { DirectoryPage, PageHeader } from "~/components/PageShell";
import { apiFetch, getCurrentUser } from "~/lib/api-client";
import { getAvatarFallback, getAvatarUrl } from "~/lib/brand";
import { kvGet, kvSet } from "~/lib/kv-cache";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ConfirmationDialog } from "~/components/ConfirmationDialog";
import { useAsyncAction } from "~/hooks/use-async-action";
import { UserIdentityBadges } from "~/components/UserIdentityBadges";
import { EmptyState } from "~/components/EmptyState";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "~/components/ui/empty";
import { externalUrlLabel, githubProfileUrl, safeExternalUrl } from "~/lib/public-profile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const name = params.name!;
  const kv = (context as any)?.cloudflare?.env?.KV;
  const cacheKey = `user:${name}`;
  const currentUser = await getCurrentUser(request);
  const cached = currentUser ? null : await kvGet<any>(kv, cacheKey);
  if (cached) return { user: cached, kv, currentUser };
  const cookie = request.headers.get("cookie") || "";
  const res = await apiFetch<{ success: boolean; data: any }>(`/api/v1/user/${name}`, {
    headers: { cookie },
  });
  if (!res.success) return { user: null, kv, currentUser };
  if (!currentUser) await kvSet(kv, cacheKey, res.data, 60);
  return { user: res.data, kv, currentUser };
}

export function meta({ data }: Route.MetaArgs) {
  if (!data?.user) return [{ title: "用户不存在 · CNode" }];
  return [{ title: `${data.user.loginname} · CNode` }];
}

export default function UserProfile({ loaderData }: Route.ComponentProps) {
  const { user, currentUser } = loaderData as any;
  if (!user)
    return (
      <Layout>
        <Empty><EmptyHeader><EmptyTitle>用户不存在</EmptyTitle><EmptyDescription>请检查用户名后重试。</EmptyDescription></EmptyHeader></Empty>
      </Layout>
    );

  return (
    <Layout>
      <DirectoryPage>
        <UserHero user={user} currentUser={currentUser} />
        <UserTabs loginname={user.loginname} active="home" />
        <Card>
          <CardHeader>
            <CardTitle>最近创建的话题</CardTitle>
          </CardHeader>
          <CardContent>
            {user.recent_topics?.length > 0 ? (
              <TopicList topics={user.recent_topics} />
            ) : (
              <EmptyState message="该用户还没有创建话题" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>最近参与的话题</CardTitle>
          </CardHeader>
          <CardContent>
            {user.recent_replies?.length > 0 ? (
              <TopicList topics={user.recent_replies} />
            ) : (
              <EmptyState message="该用户还没有参与回复" />
            )}
          </CardContent>
        </Card>
      </DirectoryPage>
    </Layout>
  );
}

function UserHero({ user, currentUser }: { user: any; currentUser?: any }) {
  const [actionTarget, setActionTarget] = useState<"block" | "mute" | "delete_all" | null>(null);
  const managementTriggerRef = useRef<HTMLButtonElement | null>(null);
  const { revalidate } = useRevalidator();
  const canManage = !!currentUser?.is_admin;
  const isSelf = currentUser?.loginname === user.loginname;
  const websiteUrl = safeExternalUrl(user.url);
  const githubUrl = githubProfileUrl(user.githubUsername);

  const actionConfig = actionTarget === "block"
    ? {
        title: user.is_block ? "恢复用户内容可见" : "屏蔽用户内容",
        description: user.is_block
          ? `恢复 ${user.loginname} 的历史内容可见性。若该用户仍被禁言，仍不能新增发帖或回复。`
          : `屏蔽 ${user.loginname} 创建的话题和相关回复聚合。该操作不等同于禁言。`,
        confirm: user.is_block ? "确认恢复可见" : "确认隐藏内容",
        variant: user.is_block ? "default" : "destructive",
      }
    : actionTarget === "mute"
      ? {
          title: user.is_muted ? "解除用户禁言" : "禁言用户",
          description: user.is_muted
            ? `解除 ${user.loginname} 的禁言后，该用户可恢复新增发帖和回复能力，除非仍受其他限制。`
            : `禁言 ${user.loginname} 后，该用户不能新增发帖或回复；历史内容不会因此隐藏。`,
          confirm: user.is_muted ? "确认解除禁言" : "确认禁言",
          variant: user.is_muted ? "default" : "destructive",
        }
      : actionTarget === "delete_all"
        ? {
            title: "删除用户所有发言",
            description: `将删除 ${user.loginname} 的所有话题和回复，并写入审计日志。此操作不会删除用户账号。`,
            confirm: "确认删除所有发言",
            variant: "destructive",
          }
        : null;

  const { run: runUserAction, pending: submitting } = useAsyncAction(
    async () => {
      if (!canManage || !actionTarget) return { success: false, error_msg: "操作失败" };
      const action = actionTarget === "block"
        ? user.is_block ? "unblock" : "block"
        : actionTarget === "mute"
          ? user.is_muted ? "unmute" : "mute"
          : "delete_all";
      const fallback = actionTarget === "delete_all" ? "删除失败" : "操作失败";
      return apiFetch<{ success: boolean; message?: string; error_msg?: string }>(`/api/v1/user/${user.loginname}/${action}`, {
        method: "POST",
        body: JSON.stringify({}),
      }).catch(() => ({ success: false, error_msg: fallback }));
    },
    {
      onSuccess: (res) => {
        if (res.success) {
          toast.success(res.message || "操作成功");
          setActionTarget(null);
          revalidate();
        } else {
          toast.error(res.error_msg || "操作失败");
        }
      },
    },
  );

  return (
    <section className="flex flex-col gap-6">
      <PageHeader breadcrumbs={[{ label: "首页", to: "/" }, { label: "用户" }]} title={user.loginname} description={user.signature || "CNode 社区成员"} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5 sm:flex-row">
          <Avatar className="size-20 shrink-0">
            <AvatarImage src={getAvatarUrl(user.avatar_url, 96)} alt={user.loginname} />
            <AvatarFallback>{getAvatarFallback(user.loginname)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-3">
            <UserIdentityBadges identities={(user.identities || []) as PublicIdentity[]} />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span>注册于 <TimeAgo date={user.create_at} /></span>
              {user.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{user.location}</span>}
            </div>
            {(websiteUrl || githubUrl) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                {websiteUrl && (
                  <a className="inline-flex items-center gap-1 text-primary hover:underline" href={websiteUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />{externalUrlLabel(websiteUrl)}
                  </a>
                )}
                {githubUrl && (
                  <a className="inline-flex items-center gap-1 text-primary hover:underline" href={githubUrl} target="_blank" rel="noopener noreferrer">
                    <Code className="h-4 w-4" />@{user.githubUsername}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:min-w-72">
          <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
            {user.is_block && <Badge variant="destructive">内容已屏蔽</Badge>}
            {user.is_muted && <Badge variant="destructive">已禁言</Badge>}
          {canManage && !isSelf && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button ref={managementTriggerRef} type="button" variant="outline" size="sm" disabled={submitting} />}
                >
                  <MoreHorizontal className="h-4 w-4" />管理
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>用户治理</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setActionTarget("block")}>
                      {user.is_block ? "恢复用户内容" : "屏蔽用户内容"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActionTarget("mute")}>
                      {user.is_muted ? "解除禁言" : "禁言用户"}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>危险操作</DropdownMenuLabel>
                    <DropdownMenuItem variant="destructive" onClick={() => setActionTarget("delete_all")}>
                      删除所有发言
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <ConfirmationDialog
                open={!!actionTarget}
                onOpenChange={(open) => !open && setActionTarget(null)}
                title={actionConfig?.title || "确认用户治理操作"}
                description={actionConfig?.description || "请确认目标用户和操作影响。"}
                confirmLabel={actionConfig?.confirm || "确认"}
                pending={submitting}
                destructive={actionConfig?.variant === "destructive"}
                finalFocus={managementTriggerRef}
                onConfirm={runUserAction}
              />
            </>
          )}
          </div>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
            {[
              ["积分", user.score || 0],
              ["话题", user.topic_count || 0],
              ["回复", user.reply_count || 0],
              ["收藏", user.collect_topic_count || 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-muted px-3 py-2">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 font-semibold text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function UserTabs({ loginname, active }: { loginname: string; active: "home" | "topics" | "replies" | "collections" }) {
  const items = [
    ["home", "主页", `/user/${loginname}`],
    ["topics", "话题", `/user/${loginname}/topics`],
    ["replies", "回复", `/user/${loginname}/replies`],
    ["collections", "收藏", `/user/${loginname}/collections`],
  ] as const;
  return (
    <nav aria-label="用户内容" className="flex gap-1 overflow-x-auto">
        {items.map(([key, label, to]) => (
          <Link
            key={key}
            to={to}
            aria-current={active === key ? "page" : undefined}
            className={
              active === key
                ? "rounded-lg bg-accent px-3 py-1.5 text-sm text-accent-foreground"
                : "rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }
          >
            {label}
          </Link>
        ))}
    </nav>
  );
}

export { UserHero, UserTabs };
