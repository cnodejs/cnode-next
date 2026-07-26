import "../load-env";
import {
  acquireScanWorkerLock,
  claimNextScanJob,
  createScheduledScanJobIfNeeded,
  failScanJob,
  processScanBatch,
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

async function processJob(job: any) {
  const maxBatches = Number(job.maxBatchesPerRun || process.env.MODERATION_SCAN_MAX_BATCHES_PER_RUN || 100);
  const throttleMs = Number(job.throttleMs ?? process.env.MODERATION_SCAN_THROTTLE_MS ?? 500);
  for (let i = 0; i < maxBatches; i += 1) {
    const result = await processScanBatch(job);
    if (result.done) break;
    if (throttleMs > 0) await sleep(throttleMs);
  }
}

async function tick() {
  const owner = await acquireScanWorkerLock();
  if (!owner) return;
  try {
    if (scheduledEnabled()) {
      await createScheduledScanJobIfNeeded();
    }
    const job = await claimNextScanJob();
    if (!job) return;
    try {
      await processJob(job);
    } catch (error) {
      await failScanJob(job.id, error);
      throw error;
    }
  } finally {
    await releaseScanWorkerLock(owner);
  }
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
