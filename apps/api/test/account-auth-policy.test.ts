import bcryptjs from "bcryptjs";
import { Buffer } from "node:buffer";
import { schema } from "@cnode/db";
import { drizzle } from "drizzle-orm/node-postgres";
import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import app from "../src/app";
import { buildUserByTokenQuery, roleQueries, userQueries } from "../src/lib/db";
import { getRedis } from "../src/lib/redis";
import { authMiddleware, setSessionCookie, type AuthVars } from "../src/middleware/auth";
import { activeAccount } from "../src/lib/account-activation";

const originalEnvironment = process.env.CNODE_ENV;
const originalGithubClientId = process.env.AUTH_GITHUB_CLIENT_ID;
const originalGithubClientSecret = process.env.AUTH_GITHUB_CLIENT_SECRET;

beforeEach(async () => {
  process.env.CNODE_ENV = "development";
  await getRedis().flushall();
});

afterEach(() => {
  vi.restoreAllMocks();
  if (originalEnvironment === undefined) delete process.env.CNODE_ENV;
  else process.env.CNODE_ENV = originalEnvironment;
  if (originalGithubClientId === undefined) delete process.env.AUTH_GITHUB_CLIENT_ID;
  else process.env.AUTH_GITHUB_CLIENT_ID = originalGithubClientId;
  if (originalGithubClientSecret === undefined) delete process.env.AUTH_GITHUB_CLIENT_SECRET;
  else process.env.AUTH_GITHUB_CLIENT_SECRET = originalGithubClientSecret;
});

describe("inactive account authentication policy", () => {
  test("rejects inactive users at shared GitHub and session identity boundaries", () => {
    expect(activeAccount({ id: 1, active: false })).toBeNull();
    expect(activeAccount({ id: 2, active: true })).toEqual({ id: 2, active: true });
  });

  test("requires an active account in access token lookup SQL", () => {
    const query = buildUserByTokenQuery(drizzle.mock({ schema }), "access-token").toSQL();
    expect(query.sql).toContain('"users"."access_token" = $1');
    expect(query.sql).toContain('"users"."active" = $2');
    expect(query.params).toEqual(["access-token", true, 1]);
  });
  test("local login returns the stable inactive account error without a session", async () => {
    const pass = await bcryptjs.hash("password123", 4);
    vi.spyOn(userQueries, "getByLoginName").mockResolvedValue({
      id: 1,
      loginname: "alice",
      pass,
      active: false,
    } as any);

    const response = await app.request("/api/v1/auth/local/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "alice", pass: "password123" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error_code: "account_inactive",
    });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  test("a signed cookie for an inactive account remains anonymous", async () => {
    const issuer = new Hono();
    issuer.get("/", (c) => {
      setSessionCookie(c, 1);
      return c.text("issued");
    });
    const issued = await issuer.request("/");
    const cookie = issued.headers.get("set-cookie")?.split(";", 1)[0];
    expect(cookie).toBeTruthy();

    vi.spyOn(userQueries, "getById").mockResolvedValue({
      id: 1,
      loginname: "alice",
      active: false,
    } as any);
    const listRoles = vi.spyOn(roleQueries, "listByUserId").mockResolvedValue([]);
    const protectedApp = new Hono<{ Variables: AuthVars }>();
    protectedApp.use("*", authMiddleware());
    protectedApp.get("/", (c) => c.json({ isLogin: c.get("isLogin"), user: c.get("user") }));

    const response = await protectedApp.request("/", { headers: { Cookie: cookie || "" } });
    await expect(response.json()).resolves.toEqual({ isLogin: false, user: null });
    expect(listRoles).not.toHaveBeenCalled();
  });

  test("rejects linking GitHub to an inactive local account and clears the pending profile", async () => {
    process.env.AUTH_GITHUB_CLIENT_ID = "test-client";
    process.env.AUTH_GITHUB_CLIENT_SECRET = "test-secret";
    const pass = await bcryptjs.hash("password123", 4);
    const pendingProfile = Buffer.from(
      JSON.stringify({
        id: "123",
        login: "github-alice",
        email: "alice@example.com",
        avatarUrl: "https://example.com/avatar.png",
        accessToken: "test-access-token",
      }),
    ).toString("base64url");
    vi.spyOn(userQueries, "getByLoginName").mockResolvedValue({
      id: 1,
      loginname: "alice",
      pass,
      active: false,
    } as any);
    const updateGithubInfo = vi.spyOn(userQueries, "updateGithubInfo");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    const response = await app.request("/api/v1/auth/github/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `github_profile=${pendingProfile}`,
      },
      body: JSON.stringify({ name: "alice", pass: "password123" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error_code: "account_inactive" });
    expect(response.headers.get("set-cookie")).toContain("github_profile=");
    expect(updateGithubInfo).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).not.toContain("node_club=");
  });

  test("rejects GitHub login for a bound inactive account without persisting its token", async () => {
    process.env.AUTH_GITHUB_CLIENT_ID = "test-client";
    process.env.AUTH_GITHUB_CLIENT_SECRET = "test-secret";
    const oauthState = encodeURIComponent(JSON.stringify({ state: "test-state", intent: "login" }));
    vi.spyOn(userQueries, "getByGithubId").mockResolvedValue({
      id: 1,
      loginname: "alice",
      active: false,
    } as any);
    const updateGithubInfo = vi.spyOn(userQueries, "updateGithubInfo");
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "test-access-token" }), {
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 123,
            login: "github-alice",
            email: "alice@example.com",
            avatar_url: "https://example.com/avatar.png",
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const response = await app.request(
      "/api/v1/auth/github/callback?code=test-code&state=test-state",
      { headers: { Cookie: `github_oauth_state=${oauthState}` } },
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toContain(
      "/resend_activation?error=account_inactive",
    );
    expect(response.headers.get("set-cookie")).toContain("github_oauth_state=");
    expect(updateGithubInfo).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).not.toContain("node_club=");
  });

  test("resend activation uses a generic response and enforces account limits", async () => {
    vi.spyOn(userQueries, "getByLoginName").mockResolvedValue(null as any);
    const request = () =>
      app.request("/api/v1/auth/local/resend_activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "missing-limit-probe", pass: "password123" }),
      });

    for (let attempt = 0; attempt < 5; attempt++) {
      const response = await request();
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({ success: true });
    }
    const limited = await request();
    expect(limited.status).toBe(403);
    expect(limited.headers.get("X-RateLimit-Remaining")).toBe("0");
  });
});
