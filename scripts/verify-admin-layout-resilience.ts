import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url);
const adminLayout = await readFile(new URL("apps/web/app/components/AdminLayout.tsx", root), "utf8");
const audit = await readFile(new URL("apps/web/app/routes/admin/audit.tsx", root), "utf8");
const users = await readFile(new URL("apps/web/app/routes/admin/users.tsx", root), "utf8");
const topics = await readFile(new URL("apps/web/app/routes/admin/topics.tsx", root), "utf8");
const mod = await readFile(new URL("apps/web/app/routes/admin/mod.tsx", root), "utf8");
const reports = await readFile(new URL("apps/web/app/routes/admin/reports.tsx", root), "utf8");
const bans = await readFile(new URL("apps/web/app/routes/admin/bans.tsx", root), "utf8");
const keywords = await readFile(new URL("apps/web/app/routes/admin/keywords.tsx", root), "utf8");

assert.match(adminLayout, /max-w-screen-2xl/, "admin shell uses wide container");
assert.match(adminLayout, /md:grid-cols-\[220px_minmax\(0,1fr\)\]/, "admin layout keeps main column min-w-0");
assert.match(audit, /overflow-x-auto/, "audit table scrolls horizontally");
assert.match(audit, /whitespace-nowrap/, "audit time/result columns stay readable");
assert.match(users, /overflow-x-auto/, "users table scrolls horizontally");
assert.match(users, /break-all/, "users table breaks long usernames and emails");
assert.match(users, /flex-wrap/, "users operations can wrap on narrow screens");
assert.match(topics, /min-w-\[980px\]/, "topics table has stable minimum width");
assert.match(topics, /truncate/, "topics table truncates long titles");
assert.match(mod, /break-words/, "moderation long previews/errors wrap");
assert.match(reports, /break-words/, "report long title/description text wraps");
assert.match(bans, /break-all/, "ban IP/CIDR rules break inside table cells");
assert.match(keywords, /break-all/, "keyword table handles long keywords");

console.log("admin layout resilience checks passed");
