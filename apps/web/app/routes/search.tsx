import { Layout } from "~/components/Layout";
import { TopicList } from "~/components/TopicList";
import { apiFetch } from "~/lib/api-client";
import { Link, useSearchParams } from "react-router";
import { useEffect, useRef, useState } from "react";
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
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();

    if (!q) {
      setResults(null);
      setLoading(false);
      setError("");
      return;
    }

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError("");
    setResults(null);

    apiFetch<{ success: boolean; data: any[] }>(
      `/api/v1/search?q=${encodeURIComponent(q)}&engine=local`,
      { signal: controller.signal },
    )
      .then((res) => {
        if (requestIdRef.current !== requestId) return;
        if (res.success) {
          setResults(res.data || []);
        } else {
          setError("搜索失败，请重试");
        }
      })
      .catch((err) => {
        if (requestIdRef.current !== requestId) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("搜索失败，请重试");
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [q, retryCount]);

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
        <section className="rounded-3xl bg-cnode-soft p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-primary">SEARCH</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">搜索 CNode 内容</h1>
          <p className="mt-2 text-sm text-muted-foreground">输入关键词查找话题标题、内容和社区讨论。</p>
        </section>
        <form onSubmit={handleSubmit} aria-busy={loading}>
          <div className="flex gap-2">
            <label htmlFor="site-search" className="sr-only">搜索话题</label>
            <Input
              id="site-search"
              name="q"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="搜索话题 (Cmd+K 快捷键)"
              autoFocus
            />
            <Button type="submit" disabled={loading}>
              <SearchIcon className="h-4 w-4" /> 搜索
            </Button>
          </div>
        </form>

        {loading && (
          <div role="status" aria-label={`正在搜索 ${q}`} className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {error}
            <Button type="button" variant="outline" size="sm" className="ml-3" onClick={() => setRetryCount((count) => count + 1)}>
              重试
            </Button>
          </div>
        )}

        {!loading && !error && q && results !== null && (
          <>
            {results.length > 0 ? (
              <Card className="overflow-hidden">
                <div role="status" className="mx-2 mt-2 rounded-xl bg-surface-subtle px-3 py-2 text-sm text-muted-foreground">
                  找到 {results.length} 条与 “{q}” 相关的结果
                </div>
                <TopicList topics={results} />
              </Card>
            ) : (
              <EmptyState
                title="没有匹配的搜索结果"
                message={`未找到与 "${q}" 相关的内容`}
                action={<Button render={<Link to="/search" />} variant="outline">清除搜索</Button>}
              />
            )}
          </>
        )}
      </ContentPage>
    </Layout>
  );
}
