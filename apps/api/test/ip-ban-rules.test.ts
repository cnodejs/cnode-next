import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidIpRule, matchesIpRule } from "../src/middleware/ip-ban";

test("isValidIpRule accepts single IPv4", () => {
  assert.equal(isValidIpRule("1.2.3.4"), true);
});

test("isValidIpRule accepts IPv4 CIDR", () => {
  assert.equal(isValidIpRule("1.2.3.0/24"), true);
});

test("isValidIpRule rejects invalid CIDR prefix", () => {
  assert.equal(isValidIpRule("1.2.3.0/33"), false);
});

test("isValidIpRule rejects garbage", () => {
  assert.equal(isValidIpRule("not-an-ip"), false);
});

test("matchesIpRule exact match", () => {
  assert.equal(matchesIpRule("1.2.3.4", "1.2.3.4"), true);
});

test("matchesIpRule exact miss", () => {
  assert.equal(matchesIpRule("1.2.3.5", "1.2.3.4"), false);
});

test("matchesIpRule CIDR match", () => {
  assert.equal(matchesIpRule("1.2.3.5", "1.2.3.0/24"), true);
});

test("matchesIpRule CIDR miss", () => {
  assert.equal(matchesIpRule("1.2.4.5", "1.2.3.0/24"), false);
});
