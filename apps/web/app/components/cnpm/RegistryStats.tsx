import { getRegistryStats, useRegistryQuery } from "~/lib/registry/client";
import { formatCompactNumber } from "~/lib/registry/parse";
import { Skeleton } from "~/components/ui/skeleton";

export function RegistryStats() {
  const { data, loading } = useRegistryQuery(getRegistryStats, []);

  if (loading) {
    return (
      <div className="flex w-full max-w-md items-center justify-center gap-2 rounded-xl border bg-card py-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    );
  }

  if (!data) {
    return null;
  }
  if (typeof data.doc_count !== "number") {
    return null;
  }

  const items = [
    { label: "包数量", value: formatCompactNumber(data.doc_count) },
    { label: "本周下载", value: formatCompactNumber(data.download?.thisweek) },
    { label: "今日下载", value: formatCompactNumber(data.download?.today) },
  ];

  return (
    <div className="flex w-full max-w-md items-center justify-center divide-x divide-border rounded-xl border bg-card py-3.5">
      {items.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-0.5 px-3">
          <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
            {item.value}
          </span>
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
