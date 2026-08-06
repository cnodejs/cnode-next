import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Layout } from "~/components/Layout";
import { PageContainer } from "~/components/PageShell";
import { NpmSearchForm } from "~/components/cnpm/NpmSearchForm";
import { RegistryStats } from "~/components/cnpm/RegistryStats";
import { RecentVisited } from "~/components/cnpm/RecentVisited";
import { RegistryGuide } from "~/components/cnpm/RegistryGuide";
import { seoMeta } from "~/lib/seo";

const POPULAR_PACKAGES = [
  "react",
  "vue",
  "next",
  "nuxt",
  "vite",
  "typescript",
  "express",
  "koa",
];

function useDesktopAutoFocus() {
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) setFocused(true);
  }, []);
  return focused;
}

export function meta() {
  return seoMeta({
    title: "CNPM 镜像 · CNode",
    description: "搜索并浏览 npm 包信息（npmmirror 镜像）。",
    path: "/cnpm",
  });
}

export default function CnpmLanding() {
  const autoFocus = useDesktopAutoFocus();
  return (
    <Layout>
      <PageContainer size="reading" className="flex flex-col gap-14 py-16">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
          <span className="inline-flex h-6 items-center rounded-full border px-3 text-xs font-medium text-muted-foreground">
            npmmirror · npm 镜像
          </span>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            搜索并浏览 npm 包信息，配合 npmmirror 国内镜像加速安装。
          </p>
          <NpmSearchForm autoFocus={autoFocus} size="lg" />
        </div>

        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8">
          <RegistryStats />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">热门：</span>
            {POPULAR_PACKAGES.map((name) => (
              <Link
                key={name}
                to={`/cnpm/pkg/${name}`}
                className="inline-flex h-7 items-center rounded-full bg-muted px-2.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {name}
              </Link>
            ))}
          </div>
          <RecentVisited />
        </div>

        <div className="mx-auto w-full max-w-3xl">
          <RegistryGuide />
        </div>
      </PageContainer>
    </Layout>
  );
}
