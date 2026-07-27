import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { canRunTopicAction } from "../apps/api/src/routes/admin";

assert.equal(canRunTopicAction("top", false, true), true, "mod can toggle top");
assert.equal(canRunTopicAction("top", true, true), true, "admin can toggle top");
assert.equal(canRunTopicAction("top", false, false), false, "regular user cannot toggle top");
assert.equal(canRunTopicAction("delete", false, true), true, "mod can delete topics");
assert.equal(canRunTopicAction("delete", true, true), true, "admin can delete topics");
assert.equal(canRunTopicAction("good", false, true), true, "mod can toggle good");
assert.equal(canRunTopicAction("unknown", true, true), false, "unknown actions are rejected");

const dbSource = await readFile(new URL("../apps/api/src/lib/db.ts", import.meta.url), "utf8");
assert.match(
  dbSource,
  /orderBy\(desc\(topics\.top\), desc\(topics\.lastReplyAt\)\)/,
  "public topic list sorts by top then lastReplyAt",
);

console.log("topic pin management checks passed");
