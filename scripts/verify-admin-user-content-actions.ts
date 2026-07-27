import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { canRunTopicAction } from "../apps/api/src/routes/admin";

const adminRouteSource = await readFile(new URL("../apps/api/src/routes/admin.ts", import.meta.url), "utf8");
const userRouteSource = await readFile(new URL("../apps/api/src/routes/user.ts", import.meta.url), "utf8");
const topicRouteSource = await readFile(new URL("../apps/api/src/routes/topic.ts", import.meta.url), "utf8");
const collectRouteSource = await readFile(new URL("../apps/api/src/routes/collect.ts", import.meta.url), "utf8");
const communityRouteSource = await readFile(new URL("../apps/api/src/routes/community.ts", import.meta.url), "utf8");
const userPageSource = await readFile(new URL("../apps/web/app/routes/user.$name.tsx", import.meta.url), "utf8");
const topicPageSource = await readFile(new URL("../apps/web/app/routes/topic.$tid.tsx", import.meta.url), "utf8");

assert.equal(canRunTopicAction("top", false, true), true, "mod can toggle top");
assert.equal(canRunTopicAction("good", false, true), true, "mod can toggle good");
assert.equal(canRunTopicAction("delete", false, true), true, "mod can delete topics");
assert.equal(canRunTopicAction("delete", false, false), false, "regular users cannot delete topics through admin batch actions");

assert.match(adminRouteSource, /admin\.post\("\/user\/:name\/block", adminRequired\(\)/, "block requires admin");
assert.match(adminRouteSource, /admin\.post\("\/user\/:name\/unblock", adminRequired\(\)/, "unblock requires admin");
assert.match(adminRouteSource, /admin\.post\("\/topic\/:tid\/good", modRequired\(\)/, "good toggle requires mod");
assert.match(adminRouteSource, /admin\.post\("\/admin\/reply\/:rid\/delete", modRequired\(\)/, "reply delete requires mod");
assert.match(adminRouteSource, /status: "deleted"/, "topic delete writes deleted status");
assert.match(adminRouteSource, /"delete_reply"/, "reply delete writes audit action");
assert.match(adminRouteSource, /decrementScoreAndReplyCount\(reply\.authorId, 5, 1\)/, "reply delete decrements author score and reply count");
assert.match(adminRouteSource, /topicQueries\.decrementReplyCount\(reply\.topicId\)/, "reply delete decrements topic reply count");

for (const [name, source] of [
  ["user routes", userRouteSource],
  ["topic detail", topicRouteSource],
  ["collect routes", collectRouteSource],
  ["community sidebar", communityRouteSource],
] as const) {
  assert.match(source, /deleted/, `${name} references deleted filtering`);
}

assert.match(userRouteSource, /boolEq\(replies\.deleted, false\)/, "user replies filter deleted replies");
assert.match(userRouteSource, /boolEq\(topics\.deleted, false\)/, "user lists filter deleted topics");
assert.match(userRouteSource, /is_block: !!userData\.isBlock/, "user profile exposes block state");
assert.match(topicRouteSource, /!topicData \|\| topicData\.deleted/, "topic detail hides deleted topics");
assert.match(topicRouteSource, /visibleParentReply/, "topic detail avoids deleted parent reply anchors");
assert.match(communityRouteSource, /replyTopicVisible/, "latest replies filter deleted topics");
assert.match(communityRouteSource, /replyNotDeleted/, "latest replies filter deleted replies");

assert.match(userPageSource, /currentUser\?\.is_admin/, "user page shows management only to admin");
assert.match(userPageSource, /封禁用户/, "user page has block action");
assert.match(userPageSource, /解禁用户/, "user page has unblock action");
assert.match(topicPageSource, /currentUser\?\.is_mod/, "topic page shows content management only to mod or admin");
assert.match(topicPageSource, /删除帖子/, "topic page has explicit delete-topic label");
assert.match(topicPageSource, /置顶帖子/, "topic page has top action");
assert.match(topicPageSource, /高亮帖子/, "topic page has good action");
assert.match(topicPageSource, /\/api\/v1\/admin\/reply\/\$\{reply\.id\}\/delete/, "mod reply delete uses audited endpoint");
assert.match(topicPageSource, /删除回复/, "reply item has explicit delete-reply label");

console.log("admin user content action checks passed");
