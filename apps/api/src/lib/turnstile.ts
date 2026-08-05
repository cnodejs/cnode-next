export async function verifyTurnstile(token: string | undefined, remoteIp?: string) {
  if (process.env.CNODE_ENV === "development") return true;

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("[turnstile] TURNSTILE_SECRET_KEY not set");
    return false;
  }
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await res.json().catch(() => null)) as { success?: boolean } | null;
  return data?.success === true;
}

export function requestIp(c: any) {
  return (
    c.req.header("x-real-ip") ||
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim()
  );
}
