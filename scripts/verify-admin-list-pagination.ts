import assert from "node:assert/strict";
import { parseAdminPagination } from "../apps/api/src/routes/admin";

assert.deepEqual(parseAdminPagination({}), { page: 1, limit: 50, offset: 0 });
assert.deepEqual(parseAdminPagination({ page: "3", limit: "20" }), { page: 3, limit: 20, offset: 40 });
assert.deepEqual(parseAdminPagination({ page: "0", limit: "999" }), { page: 1, limit: 100, offset: 0 });
assert.deepEqual(parseAdminPagination({ page: "99", limit: "10" }), { page: 99, limit: 10, offset: 980 });

console.log("admin list pagination checks passed");
