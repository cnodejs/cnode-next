import type { Route } from "../../.react-router/types/app/routes/+types/_index";
import { Layout } from "~/components/Layout";
import { TopicList } from "~/components/TopicList";
import { Sidebar } from "~/components/Sidebar";
import { Pagination } from "~/components/Pagination";
import { apiFetch } from "~/lib/api-client";
import { kvGet, kvSet } from "~/lib/kv-cache";
import { Link, useNavigate, useRouteLoaderData } from "react-router";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { FeedGrid, FeedPage, PageHeader } from "~/components/PageShell";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { seoMeta } from "~/lib/seo";
import { getAvatarUrl } from "~/lib/brand";

function normalizeTopicAvatars(topics: any[]) {
  return topics.map((topic) => ({
    ...topic,
    author: topic.author
      ? { ...topic.author, avatar_url: getAvatarUrl(topic.author.avatar_url, 48) }
      : topic.author,
  }));
}

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
    return {
      topics: normalizeTopicAvatars(cached.data),
      page,
      tab,
      limit,
      total: cached.total,
      kv,
    };
  }

  const res = await apiFetch<{ success: boolean; data: any[]; total?: number }>(
    `/api/v1/topics?page=${page}&limit=${limit}&tab=${tab}`,
    { headers: { cookie } },
  );

  const topics = normalizeTopicAvatars(res.success ? res.data : []);
  const total = res.success ? (res.total ?? topics.length) : 0;
  await kvSet(kv, cacheKey, { data: topics, total }, 60);

  return { topics, page, tab, limit, total, kv };
}

export function meta() {
  return seoMeta({
    title: "CNode · Node.js 专业中文社区",
    description: "浏览最新 Node.js 技术讨论、问答、实践分享与招聘信息。",
    path: "/",
  });
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const { topics, page, tab, limit, total } = loaderData as any;
  const navigate = useNavigate();
  const rootData = useRouteLoaderData("root") as { tabs?: any[]; user?: any } | undefined;
  const allTabs = rootData?.tabs || [];
  const isAdmin = !!rootData?.user?.is_admin;
  const visibleTabs = allTabs
    .filter((t: any) => t.visible && ((t.scope || "public") === "public" || isAdmin))
    .sort((a: any, b: any) => a.sort_order - b.sort_order);
  const tabs = [
    { key: "all", label: "全部" },
    ...visibleTabs.map((t: any) => ({ key: t.key, label: t.label })),
  ];

  return (
    <Layout>
      <FeedPage>
        <PageHeader
          variant="marketing"
          eyebrow="COMMUNITY"
          title="Node.js 专业中文社区"
          description="浏览最新讨论、技术问答与实践分享。"
          action={
            <div className="flex flex-wrap gap-2">
              <Button render={<Link to="/topic/create" />}>发布话题</Button>
              <Button render={<Link to="/about" />} variant="secondary">
                了解社区
              </Button>
            </div>
          }
        />
        <FeedGrid className="items-start">
          <div className="min-w-0">
            <Tabs
              value={tab}
              onValueChange={(value) => {
                const params = new URLSearchParams();
                if (value !== "all") params.set("tab", value);
                navigate(params.size ? `/?${params.toString()}` : "/");
              }}
            >
              <Card>
                <CardHeader>
                  <TabsList
                    aria-label="话题分类"
                    className="w-full max-w-full justify-start overflow-x-auto"
                  >
                    {tabs.map((t) => {
                      return (
                        <TabsTrigger key={t.key} value={t.key} className="flex-none">
                          {t.label}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </CardHeader>
                <CardContent>
                  <TabsContent value={tab}>
                    <TopicList topics={topics} />
                  </TabsContent>
                </CardContent>
              </Card>
            </Tabs>

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
      </FeedPage>
    </Layout>
  );
}
