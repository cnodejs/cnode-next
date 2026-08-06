import { describe, expect, it } from "vite-plus/test";
import { messageContentSummary } from "@cnode/shared";

describe("messageContentSummary", () => {
  it("decodes valid named and numeric HTML entities", () => {
    expect(messageContentSummary("&copy; &hellip; &frac12; &#20320; &#x597D;")).toBe("© … ½ 你 好");
  });

  it("does not throw for numeric entities outside the Unicode range", () => {
    expect(messageContentSummary("unsafe &#99999999; entity")).toBe("unsafe &#99999999; entity");
    expect(messageContentSummary("unsafe &#x110000; entity")).toBe("unsafe &#x110000; entity");
  });
});
