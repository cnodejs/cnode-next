import type { Route } from "../../.react-router/types/app/routes/+types/_index";
import { Layout } from "~/components/Layout";
import { TopicList } from "~/components/TopicList";
import { Sidebar } from "~/components/Sidebar";
import { Pagination } from "~/components/Pagination";
import { apiFetch } from "~/lib/api-client";
import { kvGet, kvSet } from "~/lib/kv-cache";
import { Link } from "react-router";
import { cn } from "~/lib/utils";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { FeedGrid } from "~/components/PageShell";

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const tab = url.searchParams.get("tab") || "all";
  const limit = 20;

  const cacheKey = `topics:${tab}:${page}`;
  const kv = (context as any)?.cloudflare?.env?.KV;
  const cached = await kvGet<{ data: any[]; total: number }>(kv, cacheKey);
  if (cached) {
    return { topics: cached.data, page, tab, limit, total: cached.total, kv };
  }

  const res = await apiFetch<{ success: boolean; data: any[]; total?: number }>(
    `/api/v1/topics?page=${page}&limit=${limit}&tab=${tab}`,
  );

  const topics = res.success ? res.data : [];
  const total = res.success ? res.total ?? topics.length : 0;
  await kvSet(kv, cacheKey, { data: topics, total }, 60);

  return { topics, page, tab, limit, total, kv };
}

const TABS = [
  { key: "all", label: "全部" },
  { key: "share", label: "分享" },
  { key: "ask", label: "问答" },
  { key: "job", label: "招聘" },
  { key: "good", label: "精华" },
];

export function meta() {
  return [
    { title: "CNode · Node.js 专业中文社区" },
    { name: "description", content: "CNode Next — Node.js 专业中文社区" },
  ];
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const { topics, page, tab, limit, total } = loaderData as any;

  return (
    <Layout>
      <FeedGrid className="items-start">
        <div className="min-w-0">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/80 bg-surface-subtle p-3 sm:p-4">
              <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-background/70 p-1 ring-1 ring-border/70">
                {TABS.map((t) => {
                  const params = new URLSearchParams();
                  if (t.key !== "all") params.set("tab", t.key);
                  const search = params.toString() ? `?${params.toString()}` : "";
                  return (
                    <Link
                      key={t.key}
                      to={`/${search}`}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                        tab === t.key
                          ? "bg-cnode-ink text-white shadow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      {t.label}
                    </Link>
                  );
                })}
              </div>
            </CardHeader>
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
          />
        </div>

        <div className="min-w-0 lg:sticky lg:top-24">
          <Sidebar />
        </div>
      </FeedGrid>
    </Layout>
  );
}
