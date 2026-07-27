import assert from "node:assert/strict";
import { isValidIpRule, matchesIpRule } from "../apps/api/src/middleware/ip-ban";

assert.equal(isValidIpRule("1.2.3.4"), true, "single IPv4 is valid");
assert.equal(isValidIpRule("1.2.3.0/24"), true, "IPv4 CIDR is valid");
assert.equal(isValidIpRule("1.2.3.0/33"), false, "invalid CIDR prefix is rejected");
assert.equal(isValidIpRule("not-an-ip"), false, "invalid rule is rejected");

assert.equal(matchesIpRule("1.2.3.4", "1.2.3.4"), true, "single IP exact match works");
assert.equal(matchesIpRule("1.2.3.5", "1.2.3.4"), false, "single IP mismatch is not blocked");
assert.equal(matchesIpRule("1.2.3.5", "1.2.3.0/24"), true, "CIDR match works");
assert.equal(matchesIpRule("1.2.4.5", "1.2.3.0/24"), false, "CIDR miss is not blocked");

console.log("IP ban rule checks passed");
