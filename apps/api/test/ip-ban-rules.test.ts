import { expect, test } from "vite-plus/test";
import { isValidIpRule, matchesIpRule } from "../src/middleware/ip-ban";

test("isValidIpRule accepts single IPv4", () => {
  expect(isValidIpRule("1.2.3.4")).toBe(true);
});

test("isValidIpRule accepts IPv4 CIDR", () => {
  expect(isValidIpRule("1.2.3.0/24")).toBe(true);
});

test("isValidIpRule rejects invalid CIDR prefix", () => {
  expect(isValidIpRule("1.2.3.0/33")).toBe(false);
});

test("isValidIpRule rejects garbage", () => {
  expect(isValidIpRule("not-an-ip")).toBe(false);
});

test("matchesIpRule exact match", () => {
  expect(matchesIpRule("1.2.3.4", "1.2.3.4")).toBe(true);
});

test("matchesIpRule exact miss", () => {
  expect(matchesIpRule("1.2.3.5", "1.2.3.4")).toBe(false);
});

test("matchesIpRule CIDR match", () => {
  expect(matchesIpRule("1.2.3.5", "1.2.3.0/24")).toBe(true);
});

test("matchesIpRule CIDR miss", () => {
  expect(matchesIpRule("1.2.4.5", "1.2.3.0/24")).toBe(false);
});
