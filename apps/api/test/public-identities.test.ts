import { expect, test } from "vitest";
import { publicIdentitiesSchema } from "@cnode/shared";
import { PgDialect } from "drizzle-orm/pg-core";
import { activeUserRoleCondition } from "../src/lib/db";
import { resolveUserAccess } from "../src/lib/user-access";

test("public identities remain independent from inherited permissions", () => {
  expect(resolveUserAccess("alice", [], ["alice"])).toEqual({
    identities: ["admin"],
    isAdmin: true,
    isMod: true,
  });
  expect(resolveUserAccess("alice", ["recruiter"], ["alice"]).identities).toEqual(["admin", "recruiter"]);
  expect(resolveUserAccess("alice", ["moderator", "recruiter", "moderator"], []).identities).toEqual([
    "moderator",
    "recruiter",
  ]);
  expect(resolveUserAccess("alice", ["recruiter", "moderator"], ["alice"]).identities).toEqual([
    "admin",
    "moderator",
    "recruiter",
  ]);
});

test("omitted database roles do not grant public identities", () => {
  expect(resolveUserAccess("alice", [], [])).toEqual({
    identities: [],
    isAdmin: false,
    isMod: false,
  });
});

test("active role queries exclude revoked database roles", () => {
  const query = new PgDialect().sqlToQuery(activeUserRoleCondition);
  expect(query.sql).toContain('"user_roles"."revoked_at" is null');
});

test("public identity schema rejects duplicates and unknown identities", () => {
  expect(publicIdentitiesSchema.safeParse(["admin", "recruiter"]).success).toBe(true);
  expect(publicIdentitiesSchema.safeParse(["admin", "admin"]).success).toBe(false);
  expect(publicIdentitiesSchema.safeParse(["owner"]).success).toBe(false);
});
