import type { Route } from "../../.react-router/types/app/routes/+types/auth.github.callback";
import { redirect } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error || !code || !state) {
    return redirect("/signin?error=github_cancelled");
  }

  // Redirect to API directly — the API will exchange the code,
  // set the session cookie (Set-Cookie header), and redirect back to /
  // This way the cookie is set by the browser, not by SSR fetch.
  const apiBase = process.env.APP_API_BASE_URL || "http://localhost:3001";
  return redirect(
    `${apiBase}/api/v1/auth/github/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}&redirect=${encodeURIComponent("/")}`,
  );
}
