import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { useAuthStore } from "~/lib/stores/auth-store";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock("~/lib/api-client", () => ({ apiFetch }));

beforeEach(() => {
  apiFetch.mockReset().mockResolvedValue({ success: true, data: 0 });
  useAuthStore.setState({ user: null, unreadCount: 0, hydrated: false });
});

describe("auth store loader synchronization", () => {
  it("replaces the initial anonymous state when revalidation returns a user", () => {
    const { hydrateFromLoader } = useAuthStore.getState();

    hydrateFromLoader(null);
    hydrateFromLoader({ loginname: "alice", avatar_url: "/alice.png" });

    expect(useAuthStore.getState()).toMatchObject({
      user: { loginname: "alice", avatar_url: "/alice.png" },
      hydrated: true,
    });
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it("does not refetch unread messages when the same user is revalidated", () => {
    const { hydrateFromLoader } = useAuthStore.getState();
    const user = { loginname: "alice", avatar_url: "/alice.png" };

    hydrateFromLoader(user);
    hydrateFromLoader({ ...user, is_mod: true });

    expect(useAuthStore.getState().user).toMatchObject({ loginname: "alice", is_mod: true });
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });
});
