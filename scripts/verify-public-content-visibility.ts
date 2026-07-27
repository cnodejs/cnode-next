import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const dbSchema = await readFile(new URL("../packages/db/src/schema/user.ts", import.meta.url), "utf8");
const dbSource = await readFile(new URL("../apps/api/src/lib/db.ts", import.meta.url), "utf8");
const topicRoute = await readFile(new URL("../apps/api/src/routes/topic.ts", import.meta.url), "utf8");
const replyRoute = await readFile(new URL("../apps/api/src/routes/reply.ts", import.meta.url), "utf8");
const userRoute = await readFile(new URL("../apps/api/src/routes/user.ts", import.meta.url), "utf8");
const communityRoute = await readFile(new URL("../apps/api/src/routes/community.ts", import.meta.url), "utf8");
const collectRoute = await readFile(new URL("../apps/api/src/routes/collect.ts", import.meta.url), "utf8");
const adminRoute = await readFile(new URL("../apps/api/src/routes/admin.ts", import.meta.url), "utf8");
const userPage = await readFile(new URL("../apps/web/app/routes/user.$name.tsx", import.meta.url), "utf8");

assert.match(dbSchema, /isMuted: .*\("is_muted"\)/, "user schema has is_muted");
assert.match(topicRoute, /user\.isMuted \|\| user\.isBlock/, "topic creation rejects muted users and legacy blocked users");
assert.match(replyRoute, /user\.isMuted \|\| user\.isBlock/, "reply creation rejects muted users and legacy blocked users");

for (const [name, source] of [
  ["topic queries", dbSource],
  ["user routes", userRoute],
  ["community routes", communityRoute],
  ["collect routes", collectRoute],
] as const) {
  assert.match(source, /dev/, `${name} filters dev tab`);
  assert.match(source, /test/, `${name} filters test tab`);
  assert.match(source, /isBlock/, `${name} filters block state where public visibility matters`);
}

assert.match(dbSource, /publicVisible/, "topic query helper supports publicVisible");
assert.doesNotMatch(dbSource, /isMuted[\s\S]{0,120}publicVisible/, "public visibility does not depend on mute");
assert.match(adminRoute, /\/user\/:name\/mute/, "admin API has mute endpoint");
assert.match(adminRoute, /\/user\/:name\/unmute/, "admin API has unmute endpoint");
assert.match(userPage, /隐藏用户内容/, "user page exposes block content visibility action");
assert.match(userPage, /禁言用户/, "user page exposes mute action");
assert.match(userPage, /删除所有发言/, "user page exposes delete-all action");

console.log("public content visibility checks passed");
