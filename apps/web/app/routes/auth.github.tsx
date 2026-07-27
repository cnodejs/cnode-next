import { redirect } from "react-router";

const GITHUB_OAUTH_COOKIE = "github_oauth_state";

function encodeState(value: unknown) {
  return encodeURIComponent(JSON.stringify(value));
}

export async function loader({ request }: { request: Request }) {
  const clientId = process.env.AUTH_GITHUB_CLIENT_ID;
  const callbackUrl =
    process.env.AUTH_GITHUB_CALLBACK_URL || "http://localhost:5173/auth/github/callback";

  if (!clientId) {
    return redirect("/signin?error=github_not_configured");
  }

  const state = crypto.randomUUID();
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent") === "bind" ? "bind" : "login";
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    callbackUrl,
  )}&state=${state}&scope=user:email`;

  const domain = process.env.AUTH_COOKIE_DOMAIN || undefined;
  const cookie = [
    `${GITHUB_OAUTH_COOKIE}=${encodeState({ state, intent })}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=600",
    domain ? `Domain=${domain}` : "",
  ].filter(Boolean).join("; ");

  return redirect(redirectUrl, { headers: { "Set-Cookie": cookie } });
}
