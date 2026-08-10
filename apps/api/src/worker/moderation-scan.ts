import { SpanStatusCode, trace } from "@opentelemetry/api";
import {
  acquireScanWorkerLock,
  createScheduledScanJobIfNeeded,
  drainScanQueue,
  releaseScanWorkerLock,
} from "../lib/moderation-scan";

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
  return trace.getTracer("cnode-moderation-worker").startActiveSpan("moderation.scan.tick", async (span) => {
    let owner: string | null = null;
    try {
      owner = await acquireScanWorkerLock();
      if (!owner) return;
      if (scheduledEnabled()) {
        await createScheduledScanJobIfNeeded();
      }
      await drainScanQueue(owner);
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.setAttribute("error.type", error instanceof Error ? error.name : "unknown");
      throw error;
    } finally {
      if (owner) await releaseScanWorkerLock(owner);
      span.end();
    }
  });
}

async function main() {
  const intervalMs = scheduleIntervalMs();
  console.log(`moderation scan worker running, interval=${intervalMs}ms`);
  while (true) {
    await tick().catch((error) => console.error("[moderation worker]", error));
    await sleep(intervalMs);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
