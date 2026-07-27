import { createMiddleware } from "hono/factory";
import { isIP } from "node:net";
import { ipBanQueries } from "../lib/db";
import type { AuthVars } from "./auth";

function requestIp(c: any) {
  const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  return c.req.header("x-real-ip") || c.req.header("cf-connecting-ip") || forwarded || "";
}

function ipv4ToNumber(ip: string) {
  return ip.split(".").reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

function matchesCidr(ip: string, cidr: string) {
  const [base, prefixRaw] = cidr.split("/");
  const prefix = Number(prefixRaw);
  if (isIP(ip) !== 4 || isIP(base) !== 4 || prefix < 0 || prefix > 32) return false;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipv4ToNumber(ip) & mask) === (ipv4ToNumber(base) & mask);
}

export function isValidIpRule(rule: string) {
  if (isIP(rule)) return true;
  const [base, prefixRaw] = rule.split("/");
  const prefix = Number(prefixRaw);
  return !!base && prefixRaw !== undefined && isIP(base) === 4 && Number.isInteger(prefix) && prefix >= 0 && prefix <= 32;
}

export function matchesIpRule(ip: string, rule: string) {
  return rule.includes("/") ? matchesCidr(ip, rule) : ip === rule;
}

export function ipBanMiddleware() {
  return createMiddleware<{
    Variables: AuthVars;
  }>(async (c, next) => {
    const ip = requestIp(c);
    const bans = ip ? await ipBanQueries.list() : [];
    if (ip && bans.some((ban: any) => matchesIpRule(ip, ban.ip))) {
      return c.json({ success: false, error_msg: "IP 已被封禁" }, 403);
    }

    await next();
  });
}
