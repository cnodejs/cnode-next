import { Layout } from "~/components/Layout";
import { PageContainer } from "~/components/PageShell";
import { NpmSearchForm } from "~/components/cnpm/NpmSearchForm";
import { Pagination } from "~/components/Pagination";
import { useRegistryQuery, RegistryError, searchPackages } from "~/lib/registry/client";
import { formatCompactNumber } from "~/lib/registry/parse";
import { Link, useSearchParams } from "react-router";
import { Download, Package as PackageIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "~/components/ui/empty";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { seoMeta } from "~/lib/seo";
import { cn } from "~/lib/utils";

const PAGE_SIZE = 20;

export function meta({ location }: { location: { search: string } }) {
  const q = new URLSearchParams(location.search).get("q") || "";
  const label = q || "npm 包";
  return seoMeta({
    title: `搜索 ${label} · CNPM 镜像`,
    description: `在 npmmirror 镜像搜索 npm 包「${label}」。`,
    path: q ? `/cnpm/search?q=${encodeURIComponent(q)}` : "/cnpm/search",
  });
}

export default function CnpmSearch() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const { data, error, loading, retry } = useRegistryQuery(
    () =>
      q
        ? searchPackages(q, from, PAGE_SIZE)
        : Promise.resolve({ objects: [], total: 0 } as unknown as Awaited<ReturnType<typeof searchPackages>>),
    [q, from],
  );

  return (
    <Layout>
      <PageContainer className="py-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <NpmSearchForm initialValue={q} />

          {loading && (
            <div role="status" aria-label={`正在搜索 ${q}`} className="flex flex-col gap-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}

          {!loading && error && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center justify-between gap-3">
                {error instanceof RegistryError && error.status === 404
                  ? "未找到相关包"
                  : "搜索失败，请重试"}
                <Button type="button" variant="outline" size="sm" onClick={retry}>
                  重试
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {!loading && !error && data && q && (
            <>
              {data.total > 0 ? (
                <>
                  <div className="flex flex-col gap-3">
                    {data.objects.map((item) => (
                      <SearchResultItem
                        key={item.package.name}
                        name={item.package.name}
                        version={item.package.version}
                        description={item.package.description}
                        keywords={item.package.keywords}
                        downloads={item.downloads?.all}
                      />
                    ))}
                  </div>
                  <Pagination
                    page={page}
                    total={data.total}
                    limit={PAGE_SIZE}
                    basePath="/cnpm/search"
                    searchParams={{ q }}
                  />
                </>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>未找到相关包</EmptyTitle>
                    <EmptyDescription>
                      没有与「{q}」匹配的 npm 包，换个关键词试试
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </>
          )}

          {!loading && !error && !q && (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>输入关键词搜索</EmptyTitle>
                <EmptyDescription>搜索 npm 包名、描述、关键词</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </PageContainer>
    </Layout>
  );
}

function SearchResultItem({
  name,
  version,
  description,
  keywords,
  downloads,
}: {
  name: string;
  version: string;
  description?: string;
  keywords?: string[];
  downloads?: number;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <PackageIcon className="size-4 shrink-0 text-muted-foreground" />
          <Link
            to={`/cnpm/pkg/${name}`}
            className="min-w-0 flex-1 truncate font-medium text-foreground hover:text-primary"
          >
            {name}
          </Link>
          <Badge variant="secondary" className="shrink-0 font-mono">
            {version}
          </Badge>
          {downloads !== undefined && downloads > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <Download className="size-3" />
              {formatCompactNumber(downloads)}
            </span>
          )}
        </div>
        {description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
        )}
        {keywords && keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {keywords.slice(0, 6).map((keyword) => (
              <Link
                key={keyword}
                to={`/cnpm/search?q=${encodeURIComponent(keyword)}`}
                className={cn(
                  "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground",
                  "transition-colors hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {keyword}
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
