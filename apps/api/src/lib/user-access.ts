import type { PublicIdentity } from "@cnode/shared";

export function parseAdminLoginNames(value = process.env.CNODE_ADMINS): string[] {
  return (value || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

export function resolveUserAccess(
  loginname: string,
  roles: readonly string[],
  adminLoginNames: readonly string[] = parseAdminLoginNames(),
) {
  const roleSet = new Set(roles);
  const isAdmin = adminLoginNames.includes(loginname);
  const identities: PublicIdentity[] = [];

  if (isAdmin) identities.push("admin");
  if (roleSet.has("moderator")) identities.push("moderator");
  if (roleSet.has("recruiter")) identities.push("recruiter");

  return {
    identities,
    isAdmin,
    isMod: isAdmin || roleSet.has("moderator"),
  };
}
