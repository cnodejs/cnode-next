export async function gravatarHash(email: string | undefined) {
  if (!email || typeof crypto === "undefined" || !crypto.subtle) return null;
  try {
    const data = new TextEncoder().encode(email.trim().toLowerCase());
    const digest = await crypto.subtle.digest("MD5", data);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
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
