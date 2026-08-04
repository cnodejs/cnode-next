import { Pool } from "pg";
import { parsePostgresConfig } from "@cnode/shared";
import { pathToFileURL } from "node:url";
import { repairTopicReplyAggregates } from "../packages/db/src/topic-reply-repair";
import { loadRootEnv } from "./env";

loadRootEnv({ cwd: import.meta.dirname });

export function parseRepairMode(args: string[]) {
  if (args.includes("--apply") && args.includes("--dry-run")) {
    throw new Error("choose either --dry-run or --apply");
  }
  if (args.some((arg) => arg !== "--dry-run" && arg !== "--apply")) {
    throw new Error("usage: pnpm repair:topic-replies [--dry-run|--apply]");
  }
  return args.includes("--apply") ? "apply" as const : "dry-run" as const;
}

async function main() {
  const mode = parseRepairMode(process.argv.slice(2));
  const pool = new Pool(parsePostgresConfig());
  try {
    const result = await repairTopicReplyAggregates(pool, mode === "dry-run");
    console.log(JSON.stringify(result));
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    console.error("topic reply aggregate repair failed");
    process.exitCode = 1;
  });
}
