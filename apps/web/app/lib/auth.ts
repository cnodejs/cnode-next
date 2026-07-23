import { redirect } from "react-router";
import { getCurrentUser } from "~/lib/api-client";

export async function requireUser(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) throw redirect("/signin");
  return user;
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  if (!user.is_admin) throw redirect("/");
  return user;
}
