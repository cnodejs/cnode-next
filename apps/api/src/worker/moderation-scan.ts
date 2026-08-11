import { SpanStatusCode, trace } from "@opentelemetry/api";
import {
  acquireScanWorkerLock,
  createScheduledScanJobIfNeeded,
  drainScanQueue,
  releaseScanWorkerLock,
} from "../lib/moderation-scan";
import { appLog, errorType } from "../telemetry/logger";
import { recordWorkerTick, type WorkerTickOutcome } from "../telemetry/metrics";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function scheduledEnabled() {
  return process.env.MODERATION_SCHEDULE_ENABLED === "1";
}

function scheduleIntervalMs() {
  return Number(process.env.MODERATION_SCHEDULE_INTERVAL_MS || 60 * 60 * 1000);
}

async function tick() {
  return trace
    .getTracer("cnode-moderation-worker")
    .startActiveSpan("moderation.scan.tick", async (span) => {
      const startedAt = Date.now();
      let owner: string | null = null;
      let jobsProcessed = 0;
      let outcome: WorkerTickOutcome = "completed";
      let releaseError: unknown;
      try {
        owner = await acquireScanWorkerLock();
        if (!owner) {
          outcome = "lock_unavailable";
          return;
        }
        if (scheduledEnabled()) {
          await createScheduledScanJobIfNeeded();
        }
        jobsProcessed = await drainScanQueue(owner);
      } catch (error) {
        outcome = "failed";
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.setAttribute("error.type", errorType(error));
        throw error;
      } finally {
        if (owner) {
          try {
            await releaseScanWorkerLock(owner);
          } catch (error) {
            outcome = "failed";
            releaseError = error;
            span.setStatus({ code: SpanStatusCode.ERROR });
            span.setAttribute("error.type", errorType(error));
          }
        }
        const durationMs = Math.max(0, Date.now() - startedAt);
        recordWorkerTick(durationMs, outcome, jobsProcessed);
        appLog("moderation.scan.tick.completed", outcome === "failed" ? "ERROR" : "INFO", {
          "moderation.scan.outcome": outcome,
          "moderation.scan.jobs_processed": jobsProcessed,
          duration_ms: durationMs,
          ...(releaseError ? { "error.type": errorType(releaseError) } : {}),
        });
        span.end();
      }
    });
}

async function main() {
  const intervalMs = scheduleIntervalMs();
  appLog("application.started", "INFO", { "worker.interval_ms": intervalMs });
  while (true) {
    await tick().catch(() => undefined);
    await sleep(intervalMs);
  }
}

main().catch((error) => {
  appLog("application.startup.failed", "ERROR", { "error.type": errorType(error) });
  process.exit(1);
});
