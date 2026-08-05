import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router";
import { Layout } from "~/components/Layout";
import { PageContainer, ReadingGrid } from "~/components/PageShell";
import { PkgHeader } from "~/components/cnpm/PkgHeader";
import { PkgSidebar } from "~/components/cnpm/PkgSidebar";
import { VersionTable } from "~/components/cnpm/VersionTable";
import { DepsView } from "~/components/cnpm/DepsView";
import { FilesView } from "~/components/cnpm/FilesView";
import { DownloadCard } from "~/components/cnpm/DownloadCard";
import { MarkdownView } from "~/components/MarkdownView";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "~/components/ui/empty";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { getManifest, RegistryError, useRegistryQuery } from "~/lib/registry/client";
import { parsePkgPath } from "~/lib/registry/parse";
import { useRecentVisited } from "~/lib/registry/use-recent";
import { seoMeta } from "~/lib/seo";

export function meta({ params }: { params: { "*"?: string } }) {
  const { name, tab } = parsePkgPath(params["*"]);
  const path = name
    ? tab === "home"
      ? `/cnpm/pkg/${name}`
      : `/cnpm/pkg/${name}/${tab}`
    : "/cnpm";
  return seoMeta({
    title: name ? `${name} · CNPM 镜像` : "CNPM 包浏览器",
    description: name ? `查看 npm 包 ${name} 的 README、版本、依赖与文件。` : undefined,
    path,
  });
}

export default function CnpmPkg() {
  const { "*": rest } = useParams();
  return <CnpmPkgInner rest={rest} />;
}

function CnpmPkgInner({ rest }: { rest?: string }) {
  const [params, setParams] = useSearchParams();
  const { name, tab } = parsePkgPath(rest);
  const { addRecent } = useRecentVisited();

  const { data: manifest, error, loading, retry } = useRegistryQuery(
    () => (name ? getManifest(name) : Promise.reject(new RegistryError("Missing package name", 404))),
    [name],
  );

  useEffect(() => {
    if (name) addRecent(name);
  }, [name, addRecent]);

  if (!name) {
    return (
      <Layout>
        <PageContainer className="py-6">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>无效的包名</EmptyTitle>
              <EmptyDescription>URL 中的包名无法解析</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </PageContainer>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <PageContainer className="flex flex-col gap-6 py-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-96 w-full" />
        </PageContainer>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <PageContainer className="py-6">
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between gap-3">
              {error instanceof RegistryError && error.status === 404
                ? `未查询到 ${name}，这可能是由于包尚未同步到镜像站`
                : "加载失败，请重试"}
              <Button type="button" variant="outline" size="sm" onClick={retry}>
                重试
              </Button>
            </AlertDescription>
          </Alert>
        </PageContainer>
      </Layout>
    );
  }

  if (!manifest?.name) return null;

  const requestedVersion = params.get("version") || "";
  const version =
    requestedVersion && manifest.versions[requestedVersion]
      ? requestedVersion
      : manifest["dist-tags"]?.latest || Object.keys(manifest.versions || {})[0];

  const handleVersionChange = (next: string) => {
    const nextParams = new URLSearchParams(params);
    nextParams.set("version", next);
    setParams(nextParams, { replace: true });
  };

  return (
    <Layout>
      <PageContainer className="flex flex-col gap-6 py-6">
        <PkgHeader manifest={manifest} version={version} active={tab} onVersionChange={handleVersionChange} />

        {tab === "home" && (
          <ReadingGrid aside={<PkgSidebar manifest={manifest} version={version} />}>
            {manifest.readme ? (
              <Card>
                <CardContent className="pt-4">
                  <MarkdownView content={manifest.readme} />
                </CardContent>
              </Card>
            ) : (
              <Empty>
                <EmptyTitle>没有 README</EmptyTitle>
                <EmptyDescription>该包未提供 README 文档</EmptyDescription>
              </Empty>
            )}
          </ReadingGrid>
        )}

        {tab === "versions" && <VersionTable manifest={manifest} version={version} />}

        {tab === "deps" && <DepsView manifest={manifest} version={version} />}

        {tab === "files" && <FilesView pkgName={name} spec={version} />}

        {tab === "trends" && (
          <div className="flex flex-col gap-4">
            <DownloadCard pkgName={name} range={30} />
            <Empty>
              <EmptyTitle>趋势对比即将到来</EmptyTitle>
              <EmptyDescription>多包下载对比与时间范围切换将在此提供</EmptyDescription>
            </Empty>
          </div>
        )}
      </PageContainer>
    </Layout>
  );
}
