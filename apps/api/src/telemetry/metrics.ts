import { metrics, type Attributes, type Meter } from "@opentelemetry/api";

export type WorkerTickOutcome = "completed" | "failed" | "lock_unavailable";

interface HttpMetricAttributes {
  method: string;
  route: string;
  status: number;
  errorType?: string;
}

export function createApplicationMetrics(meter: Meter) {
  const instruments = {
    httpRequests: meter.createCounter("cnode.http.server.requests", { unit: "{request}" }),
    httpDuration: meter.createHistogram("http.server.request.duration", { unit: "s" }),
    httpActive: meter.createUpDownCounter("http.server.active_requests", { unit: "{request}" }),
    httpErrors: meter.createCounter("cnode.http.server.errors", { unit: "{error}" }),
    workerTicks: meter.createCounter("cnode.moderation.scan.ticks", { unit: "{tick}" }),
    workerDuration: meter.createHistogram("cnode.moderation.scan.tick.duration", { unit: "s" }),
    workerLocks: meter.createCounter("cnode.moderation.scan.lock.attempts", { unit: "{attempt}" }),
    workerFailures: meter.createCounter("cnode.moderation.scan.failures", { unit: "{error}" }),
    workerJobs: meter.createCounter("cnode.moderation.scan.jobs.processed", { unit: "{job}" }),
  };
  return {
    recordHttpStart: (method: string) => {
      instruments.httpActive.add(1, { "http.request.method": method });
    },
    recordHttpCompletion: (durationMs: number, attributes: HttpMetricAttributes) => {
      const values: Attributes = {
        "http.request.method": attributes.method,
        "http.route": attributes.route,
        "http.response.status_code": attributes.status,
      };
      instruments.httpActive.add(-1, { "http.request.method": attributes.method });
      instruments.httpRequests.add(1, values);
      instruments.httpDuration.record(durationMs / 1_000, values);
      if (attributes.status >= 500) {
        instruments.httpErrors.add(1, {
          ...values,
          ...(attributes.errorType ? { "error.type": attributes.errorType } : {}),
        });
      }
    },
    recordWorkerTick: (durationMs: number, outcome: WorkerTickOutcome, jobsProcessed = 0) => {
      const attributes = { "moderation.scan.outcome": outcome };
      instruments.workerTicks.add(1, attributes);
      instruments.workerDuration.record(durationMs / 1_000, attributes);
      instruments.workerLocks.add(1, { acquired: outcome !== "lock_unavailable" });
      if (outcome === "failed") instruments.workerFailures.add(1);
      if (jobsProcessed > 0) instruments.workerJobs.add(jobsProcessed);
    },
  };
}

const applicationMetrics = createApplicationMetrics(metrics.getMeter("cnode-application"));

export const recordHttpStart = (method: string) => applicationMetrics.recordHttpStart(method);
export const recordHttpCompletion = (durationMs: number, attributes: HttpMetricAttributes) =>
  applicationMetrics.recordHttpCompletion(durationMs, attributes);
export const recordWorkerTick = (
  durationMs: number,
  outcome: WorkerTickOutcome,
  jobsProcessed = 0,
) => applicationMetrics.recordWorkerTick(durationMs, outcome, jobsProcessed);
