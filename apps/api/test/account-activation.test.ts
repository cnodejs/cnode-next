import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import app from "../src/app";
import { userQueries } from "../src/lib/db";
import { createPendingAccount, resendAccountActivation } from "../src/lib/account-activation";
import { userUniqueConflict } from "../src/lib/user-registration";

afterEach(() => vi.restoreAllMocks());

describe("pending account activation", () => {
  test("keeps the created account recoverable when mail fails", async () => {
    const created: Array<Record<string, unknown>> = [];
    const result = await createPendingAccount(
      { loginname: "alice", passhash: "hash", email: "alice@example.com" },
      {
        createKey: () => "activation-key",
        now: () => 42,
        createUser: async (input) => void created.push(input),
        sendActivation: async () => {
          throw new Error("mail unavailable");
        },
      },
    );

    expect(result.status).toBe("email_failed");
    expect(created).toEqual([
      expect.objectContaining({
        active: false,
        retrieveKey: "activation-key",
        retrieveTime: 42,
      }),
    ]);
  });

  test("reports a successful account and activation mail", async () => {
    const sendActivation = vi.fn(async () => undefined);
    await expect(
      createPendingAccount(
        { loginname: "alice", passhash: "hash", email: "alice@example.com" },
        {
          createKey: () => "activation-key",
          now: () => 42,
          createUser: async () => undefined,
          sendActivation,
        },
      ),
    ).resolves.toEqual({ status: "created" });
    expect(sendActivation).toHaveBeenCalledWith("alice@example.com", "activation-key");
  });

  test("rotates the key before sending and allows retry after failure", async () => {
    const user = { id: 1, email: "alice@example.com", pass: "hash", active: false };
    let storedKey = "old-key";
    let attempt = 0;
    const dependencies = {
      createKey: () => `new-key-${++attempt}`,
      now: () => 42,
      findUser: async () => user,
      verifyPassword: async () => true,
      updateKey: async (_userId: number, key: string) => {
        storedKey = key;
      },
      sendActivation: async () => {
        if (attempt === 1) throw new Error("temporary failure");
      },
    };

    await expect(
      resendAccountActivation({ name: "alice", pass: "secret" }, dependencies),
    ).resolves.toEqual({ status: "email_failed" });
    expect(storedKey).toBe("new-key-1");
    await expect(
      resendAccountActivation({ name: "alice", pass: "secret" }, dependencies),
    ).resolves.toEqual({ status: "sent" });
    expect(storedKey).toBe("new-key-2");
  });

  test("invalidates the previous key after resend", async () => {
    const user = { id: 1, email: "alice@example.com", pass: "hash", active: false };
    let storedKey: string | null = "old-key";
    await resendAccountActivation(
      { name: "alice", pass: "secret" },
      {
        createKey: () => "new-key",
        now: () => 42,
        findUser: async () => user,
        verifyPassword: async () => true,
        updateKey: async (_userId, key) => {
          storedKey = key;
        },
        sendActivation: async () => undefined,
      },
    );
    vi.spyOn(userQueries, "getByRetrieveKey").mockImplementation(async (key) =>
      key === storedKey ? (user as any) : null,
    );
    vi.spyOn(userQueries, "updateActive").mockResolvedValue(undefined);
    vi.spyOn(userQueries, "updateRetrieveKey").mockImplementation(async (_userId, key) => {
      storedKey = key;
    });

    const oldKeyResponse = await app.request("/api/v1/auth/local/active_account?key=old-key");
    expect(oldKeyResponse.status).toBe(400);

    const newKeyResponse = await app.request("/api/v1/auth/local/active_account?key=new-key");
    expect(newKeyResponse.status).toBe(200);
    expect(storedKey).toBeNull();
  });

  test.each([
    [null, false],
    [{ id: 1, email: "alice@example.com", pass: "hash", active: true }, true],
    [{ id: 1, email: "alice@example.com", pass: "hash", active: false }, false],
  ])("does not mutate or send for an ineligible account", async (user, passwordMatches) => {
    const updateKey = vi.fn(async () => undefined);
    const sendActivation = vi.fn(async () => undefined);
    await expect(
      resendAccountActivation(
        { name: "alice", pass: "secret" },
        {
          createKey: () => "new-key",
          now: () => 42,
          findUser: async () => user,
          verifyPassword: async () => passwordMatches,
          updateKey,
          sendActivation,
        },
      ),
    ).resolves.toEqual({ status: "ignored" });
    expect(updateKey).not.toHaveBeenCalled();
    expect(sendActivation).not.toHaveBeenCalled();
  });

  test("classifies concurrent PostgreSQL unique conflicts", () => {
    expect(userUniqueConflict({ code: "23505", constraint: "users_loginname_unique" })).toBe(
      "loginname",
    );
    expect(userUniqueConflict({ cause: { code: "23505", constraint: "users_email_unique" } })).toBe(
      "email",
    );
    expect(userUniqueConflict(new Error("connection failed"))).toBeNull();
  });
});
