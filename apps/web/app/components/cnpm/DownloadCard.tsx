import { getDownloads, useRegistryQuery } from "~/lib/registry/client";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Skeleton } from "~/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyTitle } from "~/components/ui/empty";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";

const chartConfig = {
  downloads: {
    label: "下载量",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function DownloadCard({
  pkgName,
  range = 7,
}: {
  pkgName: string;
  range?: number;
}) {
  const { data, error, loading, retry } = useRegistryQuery(
    () => getDownloads(pkgName, range),
    [pkgName, range],
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>下载量</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>下载量</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between gap-3">
              下载数据加载失败
              <Button type="button" variant="outline" size="sm" onClick={retry}>
                重试
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const points = data?.downloads || [];
  const total = points.reduce((sum, point) => sum + point.downloads, 0);

  if (points.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>下载量</CardTitle>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyTitle>暂无数据</EmptyTitle>
            <EmptyDescription>该包暂无下载数据</EmptyDescription>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-baseline gap-2">
          近 {range} 天下载
          <span className="font-mono text-xl font-semibold tabular-nums text-foreground">
            {total.toLocaleString("en-US")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="h-32 aspect-auto [&_.recharts-text]:fill-muted-foreground"
        >
          <AreaChart data={points} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="cnpm-download-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-downloads)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-downloads)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="4 4" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(value: string) => value.slice(5)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="downloads"
              type="monotone"
              fill="url(#cnpm-download-fill)"
              stroke="var(--color-downloads)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
