export type GithubBindDecision = "bind" | "refresh" | "reject-different" | "reject-occupied";

export function decideGithubBind(
  currentGithubId: string | null,
  targetGithubId: string,
  occupyingUserId: number | null,
  currentUserId: number,
): GithubBindDecision {
  if (currentGithubId && currentGithubId !== targetGithubId) return "reject-different";
  if (occupyingUserId && occupyingUserId !== currentUserId) return "reject-occupied";
  return currentGithubId === targetGithubId ? "refresh" : "bind";
}

export function isGithubIdUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const value = error as { constraint?: string; message?: string; cause?: unknown };
  if (
    value.constraint === "users_github_id_unique" ||
    value.message?.includes("users.github_id") === true ||
    value.message?.includes("users_github_id_unique") === true
  ) {
    return true;
  }
  return value.cause ? isGithubIdUniqueViolation(value.cause) : false;
}

export type GithubTokenRevokeResult =
  | { revoked: true; reason: "revoked" | "missing" }
  | { revoked: false; reason: "configuration" | "temporary" };

export async function revokeGithubToken(
  accessToken: string | null | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<GithubTokenRevokeResult> {
  if (!accessToken) return { revoked: true, reason: "missing" };

  const clientId = process.env.AUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.AUTH_GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return { revoked: false, reason: "configuration" };

  try {
    const response = await fetchImpl(`https://api.github.com/applications/${clientId}/token`, {
      method: "DELETE",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/json",
        "User-Agent": "cnode-next",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ access_token: accessToken }),
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status === 204 || response.status === 404) {
      return { revoked: true, reason: response.status === 204 ? "revoked" : "missing" };
    }
    return { revoked: false, reason: "temporary" };
  } catch {
    return { revoked: false, reason: "temporary" };
  }
}

type GithubUnbindUser = {
  id: number;
  pass: string | null;
  githubId: string | null;
  githubAccessToken: string | null;
};

type GithubUnbindDependencies = {
  verifyPassword: (password: string, hash: string) => Promise<boolean>;
  revokeToken: (token: string | null) => Promise<GithubTokenRevokeResult>;
  clearGithubInfo: (userId: number, githubId: string) => Promise<boolean>;
};

export type GithubUnbindResult =
  | { success: true; tokenRevoke: "revoked" | "missing" }
  | {
      success: false;
      reason: "not-bound" | "invalid-password" | "revoke-failed" | "binding-changed";
    };

export async function executeGithubUnbind(
  user: GithubUnbindUser,
  password: string,
  dependencies: GithubUnbindDependencies,
): Promise<GithubUnbindResult> {
  if (!user.githubId) return { success: false, reason: "not-bound" };
  if (!user.pass || !(await dependencies.verifyPassword(password, user.pass))) {
    return { success: false, reason: "invalid-password" };
  }

  const revoke = await dependencies.revokeToken(user.githubAccessToken);
  if (!revoke.revoked) return { success: false, reason: "revoke-failed" };

  const cleared = await dependencies.clearGithubInfo(user.id, user.githubId);
  if (!cleared) return { success: false, reason: "binding-changed" };
  return { success: true, tokenRevoke: revoke.reason };
}
import { Buffer } from "node:buffer";
