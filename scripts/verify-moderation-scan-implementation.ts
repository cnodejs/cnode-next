import { readFile } from "node:fs/promises";

function required(name: string, content: string, needle: string) {
  if (!content.includes(needle)) {
    throw new Error(`${name} is missing ${needle}`);
  }
}

async function main() {
  const files = {
    schema: await readFile("packages/db/src/schema/moderation_scan.ts", "utf8"),
    service: await readFile("apps/api/src/lib/moderation-scan.ts", "utf8"),
    admin: await readFile("apps/api/src/routes/admin.ts", "utf8"),
    worker: await readFile("apps/api/src/worker/moderation-scan.ts", "utf8"),
    compose: await readFile("docker-compose.prod.yml", "utf8"),
    seed: await readFile("packages/db/src/seed.ts", "utf8"),
  };

  required("schema", files.schema, "moderationScanJobs");
  required("schema", files.schema, "moderationHits");
  required("schema", files.schema, "moderation_hits_dedupe_idx");
  required("service", files.service, "createScanJob");
  required("service", files.service, "processScanBatch");
  required("service", files.service, "createScheduledScanJobIfNeeded");
  required("service", files.service, "acquireScanWorkerLock");
  required("admin", files.admin, "/admin/moderation/jobs");
  required("admin", files.admin, "handleModerationHit");
  required("admin", files.admin, "reason: \"keyword_added\"");
  required("admin", files.admin, "replyQueries.softDelete");
  required("admin", files.admin, "topicQueries.decrementReplyCount");
  required("admin", files.admin, "auditQueries.log");
  required("worker", files.worker, "moderation scan worker running");
  required("compose", files.compose, "worker:");
  required("seed", files.seed, "科学上网");
  required("seed", files.seed, "翻墙");

  console.log("moderation scan implementation verification passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
