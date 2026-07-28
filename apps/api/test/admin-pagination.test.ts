import assert from "node:assert/strict";
import { test } from "node:test";
import { parseAdminPagination } from "../src/routes/admin";

test("admin pagination defaults", () => {
  assert.deepEqual(parseAdminPagination({}), { page: 1, limit: 50, offset: 0 });
});

test("admin pagination parses valid input", () => {
  assert.deepEqual(parseAdminPagination({ page: "3", limit: "20" }), { page: 3, limit: 20, offset: 40 });
});

test("admin pagination clamps invalid input", () => {
  assert.deepEqual(parseAdminPagination({ page: "0", limit: "999" }), { page: 1, limit: 100, offset: 0 });
  assert.deepEqual(parseAdminPagination({ page: "99", limit: "10" }), { page: 99, limit: 10, offset: 980 });
});
