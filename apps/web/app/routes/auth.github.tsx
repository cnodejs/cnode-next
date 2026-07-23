import { redirect } from "react-router";

export async function loader() {
  const clientId = process.env.AUTH_GITHUB_CLIENT_ID;
  const callbackUrl =
    process.env.AUTH_GITHUB_CALLBACK_URL || "http://localhost:5173/auth/github/callback";

  if (!clientId) {
    return redirect("/signin?error=github_not_configured");
  }

  const state = crypto.randomUUID();
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    callbackUrl,
  )}&state=${state}&scope=user:email`;

  return redirect(redirectUrl);
}
