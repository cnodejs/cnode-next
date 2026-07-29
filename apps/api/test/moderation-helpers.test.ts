import { expect, test } from "vitest";
import { createHitDedupeKey, createHitPreview, matchContent } from "../src/lib/moderation";

const words = [
  { id: 1, word: "BadWord" },
  { id: 2, word: "敏感" },
];

test("matchContent matches case-insensitive ASCII", () => {
  const hits = matchContent("hello badword and 敏感内容", words);
  expect(hits.length).toBe(2);
  expect(hits[0]?.word).toBe("BadWord");
  expect(hits[0]?.index).toBe(6);
});

test("matchContent matches CJK", () => {
  const hits = matchContent("hello badword and 敏感内容", words);
  expect(hits[1]?.word).toBe("敏感");
});

test("createHitPreview creates bounded preview", () => {
  const preview = createHitPreview("0123456789SensitiveContentABCDEFGHIJ", 10, 5);
  expect(preview).toBe("...56789Sensi...");
});

test("createHitDedupeKey normalizes to lowercase", () => {
  const dedupeKey = createHitDedupeKey("topic", 123, "content", "BadWord");
  expect(dedupeKey).toBe("topic:123:content:badword");
});
