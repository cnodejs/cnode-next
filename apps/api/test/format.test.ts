import { describe, expect, it } from "vitest";
import { normalizeAvatarUrl } from "../src/lib/format";

describe("normalizeAvatarUrl", () => {
  it("upgrades legacy Gravatar URLs to HTTPS", () => {
    expect(normalizeAvatarUrl("http://www.gravatar.com/avatar/hash?size=48"))
      .toBe("https://www.gravatar.com/avatar/hash?size=48");
    expect(normalizeAvatarUrl("http://gravatar.com/avatar/hash"))
      .toBe("https://gravatar.com/avatar/hash");
  });

  it("does not rewrite unrelated absolute avatar URLs", () => {
    expect(normalizeAvatarUrl("http://images.example.com/avatar.png"))
      .toBe("http://images.example.com/avatar.png");
  });
});
