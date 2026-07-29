import { expect, test } from "vitest";
import { toRssPubDate, topicUrl } from "../src/routes/feed";

test("rss source builds canonical topic URLs", () => {
  expect(topicUrl(123, "https://cnodejs.org")).toBe("https://cnodejs.org/topic/123");
  expect(topicUrl(123, "https://cnodejs.org/")).toBe("https://cnodejs.org/topic/123");
});

test("rss source formats valid and invalid pubDate values", () => {
  expect(toRssPubDate("2026-07-29T17:00:00.000Z")).toBe("Wed, 29 Jul 2026 17:00:00 GMT");
  expect(toRssPubDate("not-a-date")).toMatch(/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} /);
});
