import type { Route } from "../../.react-router/types/app/routes/+types/legacy-user-redirect.$name";
import { redirect } from "react-router";

const RESERVED = new Set([
  "about",
  "active_account",
  "admin",
  "api",
  "app",
  "auth",
  "faq",
  "getstart",
  "my",
  "reply",
  "robots.txt",
  "rss",
  "search",
  "search_pass",
  "setting",
  "signin",
  "signup",
  "sitemap.xml",
  "stars",
  "topic",
  "user",
  "users",
]);

export async function loader({ params }: Route.LoaderArgs) {
  const name = params.name || "";
  if (!name || RESERVED.has(name)) {
    throw new Response("Not Found", { status: 404 });
  }

  return redirect(`/user/${encodeURIComponent(name)}`);
}
