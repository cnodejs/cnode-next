import { Layout } from "~/components/Layout";
import { TopicList } from "~/components/TopicList";
import { apiFetch } from "~/lib/api-client";
import { useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { EmptyState } from "~/components/EmptyState";
import { Search as SearchIcon } from "lucide-react";
import { ContentPage } from "~/components/PageShell";

export function meta() {
  return [{ title: "搜索 · CNode" }];
}

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [input, setInput] = useState(q);
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) {
      setResults(null);
      return;
    }
    setLoading(true);
    apiFetch<{ success: boolean; data: any[] }>(
      `/api/v1/search?q=${encodeURIComponent(q)}&engine=local`,
    )
      .then((res) => setResults(res.success ? res.data || [] : []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [q]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) setParams({ q: input.trim() });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        (document.querySelector('input[type="text"]') as HTMLInputElement)?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <Layout>
      <ContentPage className="space-y-6">
        <section className="rounded-3xl border border-cnode-green/20 bg-cnode-soft p-6 sm:p-8">
          <p className="text-sm font-medium text-primary">SEARCH</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">搜索 CNode 内容</h1>
          <p className="mt-2 text-sm text-muted-foreground">输入关键词查找话题标题、内容和社区讨论。</p>
        </section>
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="搜索话题 (Cmd+K 快捷键)"
              autoFocus
            />
            <Button type="submit">
              <SearchIcon className="h-4 w-4" /> 搜索
            </Button>
          </div>
        </form>

        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {!loading && q && results !== null && (
          <>
            {results.length > 0 ? (
              <Card className="p-2">
                <div className="border-b border-border px-3 py-2 text-sm text-muted-foreground">
                  找到 {results.length} 条与 “{q}” 相关的结果
                </div>
                <TopicList topics={results} />
              </Card>
            ) : (
              <EmptyState message={`未找到与 "${q}" 相关的内容`} />
            )}
          </>
        )}
      </ContentPage>
    </Layout>
  );
}
