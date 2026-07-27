import "../load-env";
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
  const owner = await acquireScanWorkerLock();
  if (!owner) return;
  try {
    if (scheduledEnabled()) {
      await createScheduledScanJobIfNeeded();
    }
    await drainScanQueue(owner);
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
