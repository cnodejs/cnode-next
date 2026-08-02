import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  getCurrentUser: vi.fn(),
  kvGet: vi.fn(),
  kvSet: vi.fn(),
}));

vi.mock("~/lib/api-client", () => ({ apiFetch: mocks.apiFetch, getCurrentUser: mocks.getCurrentUser }));
vi.mock("~/lib/kv-cache", () => ({ kvGet: mocks.kvGet, kvSet: mocks.kvSet }));

import { loader } from "~/routes/topic.$tid";

describe("话题详情作者资料 loader", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getCurrentUser.mockResolvedValue(null);
    mocks.kvGet.mockResolvedValue(null);
    mocks.kvSet.mockResolvedValue(undefined);
  });

  it("queries and caches the public profile after loading the topic", async () => {
    mocks.apiFetch
      .mockResolvedValueOnce({ success: true, data: { id: "1", author: { loginname: "alice", avatar_url: "" } } })
      .mockResolvedValueOnce({ success: true, data: { loginname: "alice", identities: ["admin"] } });

    const result = await loader({
      params: { tid: "1" },
      request: new Request("http://localhost/topic/1"),
      context: { cloudflare: { env: { KV: {} } } },
    } as any);

    expect(mocks.apiFetch).toHaveBeenNthCalledWith(1, "/api/v1/topic/1?mdrender=false", { headers: { cookie: "" } });
    expect(mocks.apiFetch).toHaveBeenNthCalledWith(2, "/api/v1/user/alice", { headers: { cookie: "" } });
    expect(result.authorProfile).toEqual({ loginname: "alice", identities: ["admin"] });
    expect(mocks.kvSet).toHaveBeenCalledWith(expect.anything(), "user:alice", result.authorProfile, 60);
  });

  it("keeps the topic usable when the public profile request fails", async () => {
    mocks.apiFetch
      .mockResolvedValueOnce({ success: true, data: { id: "1", author: { loginname: "alice", avatar_url: "" } } })
      .mockRejectedValueOnce(new Error("profile unavailable"));

    const result = await loader({
      params: { tid: "1" },
      request: new Request("http://localhost/topic/1"),
      context: {},
    } as any);

    expect(result.topic.id).toBe("1");
    expect(result.authorProfile).toBeNull();
  });
});
