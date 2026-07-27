import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url);
const mail = await readFile(new URL("apps/api/src/lib/mail.ts", root), "utf8");
const auth = await readFile(new URL("apps/api/src/routes/auth.ts", root), "utf8");
const admin = await readFile(new URL("apps/api/src/routes/admin.ts", root), "utf8");
const topic = await readFile(new URL("apps/api/src/routes/topic.ts", root), "utf8");
const reply = await readFile(new URL("apps/api/src/routes/reply.ts", root), "utf8");
const setting = await readFile(new URL("apps/web/app/routes/setting.tsx", root), "utf8");
const signin = await readFile(new URL("apps/web/app/routes/signin.tsx", root), "utf8");
const signup = await readFile(new URL("apps/web/app/routes/signup.tsx", root), "utf8");
const searchPass = await readFile(new URL("apps/web/app/routes/search_pass.tsx", root), "utf8");
const topicCreate = await readFile(new URL("apps/web/app/routes/topic.create.tsx", root), "utf8");
const topicDetail = await readFile(new URL("apps/web/app/routes/topic.$tid.tsx", root), "utf8");
const turnstile = await readFile(new URL("apps/api/src/lib/turnstile.ts", root), "utf8");
const penalty = await readFile(new URL("apps/api/src/lib/penalty.ts", root), "utf8");

assert.match(mail, /APP_WEB_BASE_URL/, "account emails use web base URL");
assert.doesNotMatch(mail, /APP_API_BASE_URL \|\| "http:\/\/localhost:3001"/, "account emails do not use API base URL");
assert.match(mail, /throw new Error\(message\)/, "missing SMTP fails outside development");
assert.match(signin, /to="\/search_pass"/, "signin links to password recovery");

assert.match(auth, /GITHUB_OAUTH_COOKIE/, "GitHub OAuth state cookie exists");
assert.match(auth, /oauthState\.intent === "bind"/, "GitHub bind intent is handled");
assert.match(setting, /github_bound/, "settings page displays GitHub binding status");
assert.match(setting, /body: JSON\.stringify\(values\)/, "settings page posts only editable profile values");

assert.match(signup, /allowSignup/, "signup page reads registration switch");
assert.match(auth, /当前暂不开放注册/, "signup API enforces registration switch");
assert.match(topic, /new_user_min_hours/, "topic creation enforces new-user minimum hours");
assert.match(topic, /new_user_min_replies/, "topic creation enforces new-user minimum replies");
assert.match(topic, /perUserPerDaySetting\("create_topic", "rate_topic"/, "topic rate limit reads settings");
assert.match(reply, /perUserPerDaySetting\("create_reply", "rate_reply"/, "reply rate limit reads settings");
assert.match(admin, /pendingReports/, "admin stats exposes real pending reports count");

assert.match(topicDetail, /ReportButton targetType="topic"/, "topic detail has report entry");
assert.match(topicDetail, /ReportButton targetType="reply"/, "reply item has report entry");
assert.match(admin, /getReportTargetSummary/, "report API builds target summaries");
assert.match(admin, /report_auto_hide_threshold/, "report auto-hide threshold is implemented");
assert.match(admin, /report_auto_hide/, "report auto-hide writes audit log");

assert.match(turnstile, /siteverify/, "Turnstile siteverify is used server-side");
assert.match(signup, /TurnstileWidget/, "signup renders Turnstile widget");
assert.match(searchPass, /TurnstileWidget/, "password recovery renders Turnstile widget");
assert.match(topicCreate, /TurnstileWidget/, "topic creation renders Turnstile widget");
assert.match(topicDetail, /TurnstileWidget/, "reply form renders Turnstile widget");

assert.match(penalty, /temp_mute_7d/, "progressive penalty applies 7-day mute");
assert.match(penalty, /temp_mute_30d/, "progressive penalty applies 30-day mute");
assert.match(penalty, /permanent_block_mute/, "progressive penalty applies permanent block/mute");
assert.match(topic, /ensureMuteNotExpired/, "topic creation restores expired temporary mute");
assert.match(reply, /ensureMuteNotExpired/, "reply creation restores expired temporary mute");

assert.match(admin, /topics\.content} LIKE/, "local search includes topic content");
assert.match(admin, /userSummary\(author\)/, "local search returns TopicDTO author shape");
assert.match(admin, /topics\.tab} NOT IN \('dev', 'test'\)/, "local search excludes internal tabs");
assert.match(admin, /author\?\.isBlock/, "local search excludes blocked authors");

console.log("account integrity change checks passed");
