import {
  AggregationTemporality,
  InMemoryMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import { describe, expect, test } from "vite-plus/test";
import { createApplicationMetrics } from "../src/telemetry/metrics";
import type { Attributes } from "@opentelemetry/api";

interface MetricPoint {
  attributes: Attributes;
  value: unknown;
}

function points(exporter: InMemoryMetricExporter, name: string): MetricPoint[] {
  const result: MetricPoint[] = [];
  for (const resource of exporter.getMetrics()) {
    for (const scope of resource.scopeMetrics) {
      for (const metric of scope.metrics) {
        if (metric.descriptor.name !== name) continue;
        result.push(...(metric.dataPoints as MetricPoint[]));
      }
    }
  }
  return result;
}

describe("application metrics", () => {
  test("records full HTTP metrics with route templates and balanced active requests", async () => {
    const exporter = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE);
    const reader = new PeriodicExportingMetricReader({ exporter, exportIntervalMillis: 60_000 });
    const provider = new MeterProvider({ readers: [reader] });
    const telemetry = createApplicationMetrics(provider.getMeter("test"));

    telemetry.recordHttpStart("GET");
    telemetry.recordHttpCompletion(250, {
      method: "GET",
      route: "/items/:id",
      status: 500,
      errorType: "Error",
    });
    await provider.forceFlush();

    expect(points(exporter, "cnode.http.server.requests")[0]?.attributes).toEqual({
      "http.request.method": "GET",
      "http.route": "/items/:id",
      "http.response.status_code": 500,
    });
    expect(points(exporter, "http.server.request.duration")[0]?.value).toMatchObject({
      count: 1,
      sum: 0.25,
    });
    expect(points(exporter, "http.server.active_requests")[0]?.value).toBe(0);
    expect(points(exporter, "cnode.http.server.errors")[0]?.attributes).toMatchObject({
      "error.type": "Error",
    });
    expect(JSON.stringify(exporter.getMetrics())).not.toContain("request_id");
    await provider.shutdown();
  });

  test("records worker outcomes and natural processed job counts", async () => {
    const exporter = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE);
    const reader = new PeriodicExportingMetricReader({ exporter, exportIntervalMillis: 60_000 });
    const provider = new MeterProvider({ readers: [reader] });
    const telemetry = createApplicationMetrics(provider.getMeter("test"));

    telemetry.recordWorkerTick(100, "completed", 3);
    telemetry.recordWorkerTick(50, "lock_unavailable", 0);
    await provider.forceFlush();

    expect(points(exporter, "cnode.moderation.scan.ticks")).toHaveLength(2);
    expect(points(exporter, "cnode.moderation.scan.jobs.processed")[0]?.value).toBe(3);
    expect(JSON.stringify(exporter.getMetrics())).not.toContain("job.id");
    await provider.shutdown();
  });
});
