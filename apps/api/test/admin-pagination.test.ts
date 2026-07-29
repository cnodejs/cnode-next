import { expect, test } from "vitest";
import { parseAdminPagination } from "../src/routes/admin";

test("admin pagination defaults", () => {
  expect(parseAdminPagination({})).toEqual({ page: 1, limit: 50, offset: 0 });
});

test("admin pagination parses valid input", () => {
  expect(parseAdminPagination({ page: "3", limit: "20" })).toEqual({ page: 3, limit: 20, offset: 40 });
});

test("admin pagination clamps invalid input", () => {
  expect(parseAdminPagination({ page: "0", limit: "999" })).toEqual({ page: 1, limit: 100, offset: 0 });
  expect(parseAdminPagination({ page: "99", limit: "10" })).toEqual({ page: 99, limit: 10, offset: 980 });
});
