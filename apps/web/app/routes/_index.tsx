import type { Route } from "../../.react-router/types/app/routes/+types/_index";
import { Layout } from "~/components/Layout";
import { TopicList } from "~/components/TopicList";
import { Sidebar } from "~/components/Sidebar";
import { Pagination } from "~/components/Pagination";
import { apiFetch } from "~/lib/api-client";
import { kvGet, kvSet } from "~/lib/kv-cache";
import { Link, useRouteLoaderData } from "react-router";
import { cn } from "~/lib/utils";
import { Card, CardContent } from "~/components/ui/card";
import { FeedGrid } from "~/components/PageShell";

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const tab = url.searchParams.get("tab") || "all";
  const limit = 20;
  const cookie = request.headers.get("cookie") || "";

  const cacheKey = `topics:${tab}:${page}:${cookie ? "auth" : "public"}`;
  const kv = (context as any)?.cloudflare?.env?.KV;
  const cached = await kvGet<{ data: any[]; total: number }>(kv, cacheKey);
  if (cached) {
    return { topics: cached.data, page, tab, limit, total: cached.total, kv };
  }

  const res = await apiFetch<{ success: boolean; data: any[]; total?: number }>(
    `/api/v1/topics?page=${page}&limit=${limit}&tab=${tab}`,
    { headers: { cookie } },
  );

  const topics = res.success ? res.data : [];
  const total = res.success ? res.total ?? topics.length : 0;
  await kvSet(kv, cacheKey, { data: topics, total }, 60);

  return { topics, page, tab, limit, total, kv };
}

export function meta() {
  return [
    { title: "CNode · Node.js 专业中文社区" },
    { name: "description", content: "CNode Next — Node.js 专业中文社区" },
  ];
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const { topics, page, tab, limit, total } = loaderData as any;
  const rootData = useRouteLoaderData("root") as { tabs?: any[]; user?: any } | undefined;
  const allTabs = rootData?.tabs || [];
  const isAdmin = !!rootData?.user?.is_admin;
  const visibleTabs = allTabs
    .filter((t: any) => t.visible && ((t.scope || "public") === "public" || isAdmin))
    .sort((a: any, b: any) => a.sort_order - b.sort_order);
  const tabs = [{ key: "all", label: "全部" }, ...visibleTabs.map((t: any) => ({ key: t.key, label: t.label }))];

  return (
    <Layout>
      <FeedGrid className="items-start">
        <div className="min-w-0">
          <nav aria-label="话题分类" className="mb-3 flex items-center gap-1 overflow-x-auto rounded-lg bg-surface-subtle p-1.5">
                {tabs.map((t) => {
                  const params = new URLSearchParams();
                  if (t.key !== "all") params.set("tab", t.key);
                  const search = params.toString() ? `?${params.toString()}` : "";
                  return (
                    <Link
                      key={t.key}
                      to={`/${search}`}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                        tab === t.key
                          ? "bg-cnode-ink text-white shadow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      {t.label}
                    </Link>
                  );
                })}
          </nav>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <TopicList topics={topics} />
            </CardContent>
          </Card>

          <Pagination
            page={page}
            total={total}
            limit={limit}
            basePath="/"
            searchParams={{ ...(tab !== "all" ? { tab } : {}) }}
            variant="simple"
          />
        </div>

        <div className="min-w-0 lg:sticky lg:top-24">
          <Sidebar />
        </div>
      </FeedGrid>
    </Layout>
  );
}
