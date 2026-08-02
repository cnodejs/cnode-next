import { useRef, useState } from "react";
import type { PublicIdentity } from "@cnode/shared";
import type { Route } from "../../.react-router/types/app/routes/+types/user.$name";
import { Link, useRevalidator } from "react-router";
import { Code, ExternalLink, MapPin, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "~/components/Layout";
import { TopicList } from "~/components/TopicList";
import { TimeAgo } from "~/components/TimeAgo";
import { ContentPage } from "~/components/PageShell";
import { apiFetch, getCurrentUser } from "~/lib/api-client";
import { getAvatarFallback, getAvatarUrl } from "~/lib/brand";
import { kvGet, kvSet } from "~/lib/kv-cache";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { useAsyncAction } from "~/hooks/use-async-action";
import { UserIdentityBadges } from "~/components/UserIdentityBadges";
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
        <Card className="mx-auto max-w-2xl text-center">
          <CardContent className="py-12 text-muted-foreground">用户不存在</CardContent>
        </Card>
      </Layout>
    );

  return (
    <Layout>
      <ContentPage className="space-y-6">
        <UserHero user={user} currentUser={currentUser} />
        <UserTabs loginname={user.loginname} active="home" />
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/80 bg-surface-subtle">
            <CardTitle className="text-base">最近创建的话题</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {user.recent_topics?.length > 0 ? (
              <TopicList topics={user.recent_topics} />
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">暂无话题</div>
            )}
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/80 bg-surface-subtle">
            <CardTitle className="text-base">最近参与的话题</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {user.recent_replies?.length > 0 ? (
              <TopicList topics={user.recent_replies} />
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">暂无回复</div>
            )}
          </CardContent>
        </Card>
      </ContentPage>
    </Layout>
  );
}

function UserHero({ user, currentUser }: { user: any; currentUser?: any }) {
  const [actionTarget, setActionTarget] = useState<"block" | "mute" | "delete_all" | null>(null);
  const managementTriggerRef = useRef<HTMLElement | null>(null);
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
    <section className="rounded-3xl border border-cnode-green/20 bg-cnode-soft p-6 shadow-card sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5 sm:flex-row">
          <Avatar className="h-20 w-20 shrink-0 border border-border ring-4 ring-cnode-green/10">
            <AvatarImage src={getAvatarUrl(user.avatar_url, 96)} alt={user.loginname} />
            <AvatarFallback>{getAvatarFallback(user.loginname)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{user.loginname}</h1>
              <UserIdentityBadges identities={(user.identities || []) as PublicIdentity[]} />
            </div>
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
            {user.signature && <p className="max-w-2xl whitespace-pre-wrap break-words text-sm leading-6 text-foreground/80">{user.signature}</p>}
          </div>
        </div>
        <div className="space-y-4 lg:min-w-72">
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
                    <DropdownMenuItem className="text-destructive data-[highlighted]:text-destructive" onClick={() => setActionTarget("delete_all")}>
                      删除所有发言
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Dialog
                open={!!actionTarget}
                onOpenChange={(open, eventDetails) => {
                  if (open) return;
                  if (submitting) {
                    eventDetails.cancel();
                    return;
                  }
                  setActionTarget(null);
                }}
              >
                <DialogContent finalFocus={managementTriggerRef}>
                  <DialogHeader>
                    <DialogTitle>{actionConfig?.title}</DialogTitle>
                    <DialogDescription>{actionConfig?.description}</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setActionTarget(null)} disabled={submitting}>
                      取消
                    </Button>
                    <Button type="button" variant={actionConfig?.variant as any} onClick={runUserAction} disabled={submitting}>
                      {submitting ? "处理中" : actionConfig?.confirm}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
              <div key={label} className="rounded-xl border border-cnode-green/15 bg-background/75 px-3 py-2">
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
    <Card>
      <CardContent className="flex gap-1 overflow-x-auto p-2">
        {items.map(([key, label, to]) => (
          <Link
            key={key}
            to={to}
            className={
              active === key
                ? "rounded-lg bg-cnode-ink px-3 py-1.5 text-sm text-white shadow-sm"
                : "rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }
          >
            {label}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export { UserHero, UserTabs };
