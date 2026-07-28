import { readFile } from "node:fs/promises";

const forbiddenRuntimeTerms = [
  ["DB", "DIALECT"].join("_"),
  ["better", String.fromCharCode(115, 113, 108, 105, 116, 101, 51)].join("-"),
  [String.fromCharCode(115, 113, 108, 105, 116, 101), "core"].join("-"),
];

const sourceFiles = [
  "packages/db/src/client.ts",
  "apps/api/src/lib/db-compat.ts",
  "apps/api/src/lib/moderation-scan.ts",
  "packages/db/src/schema/index.ts",
  "packages/db/src/schema/user.ts",
  "packages/db/src/schema/topic.ts",
  "packages/db/src/schema/reply.ts",
  "packages/db/src/schema/reply_ups.ts",
  "packages/db/src/schema/message.ts",
  "packages/db/src/schema/topic_collect.ts",
  "packages/db/src/schema/audit_log.ts",
  "packages/db/src/schema/sensitive_word.ts",
  "packages/db/src/schema/report.ts",
  "packages/db/src/schema/ip_ban.ts",
  "packages/db/src/schema/site_setting.ts",
  "packages/db/src/schema/moderation_scan.ts",
];

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  for (const file of sourceFiles) {
    const content = await readFile(file, "utf8");
    for (const term of forbiddenRuntimeTerms) {
      assert(!content.includes(term), `${file} contains forbidden database runtime term: ${term}`);
    }
  }

  console.log("moderation scan runtime verification passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
