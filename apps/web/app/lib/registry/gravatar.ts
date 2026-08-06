import { md5 } from "@noble/hashes/legacy.js";
import { bytesToHex } from "@noble/hashes/utils.js";

export function gravatarHash(email: string | undefined) {
  if (!email) return null;
  return bytesToHex(md5(new TextEncoder().encode(email.trim().toLowerCase())));
}

export function gravatarUrl(hash: string | null, size = 64) {
  return hash
    ? `https://www.gravatar.com/avatar/${hash}?s=${size}&d=retro`
    : undefined;
}

export function initials(name: string | undefined) {
  if (!name) return "?";
  return name.slice(0, 2).toUpperCase();
}
