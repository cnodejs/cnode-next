import { useState } from "react";
import type { Route } from "../../.react-router/types/app/routes/+types/user.$name";
import { Link, useRevalidator } from "react-router";
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
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0 space-y-6">
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
          </div>
          <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader className="border-b border-border/80 bg-surface-subtle">
                <CardTitle className="text-base">社区资料</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6 text-sm text-muted-foreground">
                <div className="flex justify-between"><span>积分</span><span className="font-medium text-foreground">{user.score || 0}</span></div>
                <div className="flex justify-between"><span>话题</span><span className="font-medium text-foreground">{user.recent_topics?.length || 0}</span></div>
                <div className="flex justify-between"><span>参与</span><span className="font-medium text-foreground">{user.recent_replies?.length || 0}</span></div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </ContentPage>
    </Layout>
  );
}

function UserHero({ user, currentUser }: { user: any; currentUser?: any }) {
  const [submitting, setSubmitting] = useState(false);
  const [actionTarget, setActionTarget] = useState<"block" | "mute" | "delete_all" | null>(null);
  const { revalidate } = useRevalidator();
  const canManage = !!currentUser?.is_admin;
  const isSelf = currentUser?.loginname === user.loginname;

  const actionConfig = actionTarget === "block"
    ? {
        title: user.is_block ? "恢复用户内容可见" : "隐藏用户内容",
        description: user.is_block
          ? `恢复 ${user.loginname} 的历史内容可见性。若该用户仍被禁言，仍不能新增发帖或回复。`
          : `隐藏 ${user.loginname} 创建的话题和相关回复聚合。该操作不等同于禁言。`,
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

  async function runUserAction() {
    if (!canManage || !actionTarget) return;
    const action = actionTarget === "block"
      ? user.is_block ? "unblock" : "block"
      : actionTarget === "mute"
        ? user.is_muted ? "unmute" : "mute"
        : "delete_all";
    const fallback = actionTarget === "delete_all" ? "删除失败" : "操作失败";
    setSubmitting(true);
    const res: { success: boolean; message?: string; error_msg?: string } = await apiFetch<{ success: boolean; message?: string; error_msg?: string }>(`/api/v1/user/${user.loginname}/${action}`, {
      method: "POST",
      body: JSON.stringify({}),
    }).catch(() => ({ success: false, error_msg: fallback }));
    setSubmitting(false);
    if (res.success) {
      toast.success(res.message || "操作成功");
      setActionTarget(null);
      revalidate();
    } else {
      toast.error(res.error_msg || fallback);
    }
  }

  return (
    <section className="rounded-3xl border border-cnode-green/20 bg-cnode-soft p-6 shadow-card sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="h-20 w-20 border border-border ring-4 ring-cnode-green/10">
            <AvatarImage src={getAvatarUrl(user.avatar_url, 96)} alt={user.loginname} />
            <AvatarFallback>{getAvatarFallback(user.loginname)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{user.loginname}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              注册于 <TimeAgo date={user.create_at} />
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {user.is_block && <Badge variant="destructive">内容隐藏</Badge>}
          {user.is_muted && <Badge variant="destructive">已禁言</Badge>}
          <Badge className="w-fit">积分 {user.score || 0}</Badge>
          {canManage && !isSelf && (
            <>
              <Button type="button" variant={user.is_block ? "outline" : "destructive"} size="sm" onClick={() => setActionTarget("block")} disabled={submitting}>
                {user.is_block ? "恢复内容可见" : "隐藏用户内容"}
              </Button>
              <Button type="button" variant={user.is_muted ? "outline" : "destructive"} size="sm" onClick={() => setActionTarget("mute")} disabled={submitting}>
                {user.is_muted ? "解除禁言" : "禁言用户"}
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => setActionTarget("delete_all")} disabled={submitting}>
                删除所有发言
              </Button>
              <Dialog open={!!actionTarget} onOpenChange={(open) => !submitting && !open && setActionTarget(null)}>
                <DialogContent>
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
