import assert from "node:assert/strict";
import { test } from "node:test";
import { createHitDedupeKey, createHitPreview, matchContent } from "../src/lib/moderation";

const words = [
  { id: 1, word: "BadWord" },
  { id: 2, word: "敏感" },
];

test("matchContent matches case-insensitive ASCII", () => {
  const hits = matchContent("hello badword and 敏感内容", words);
  assert.equal(hits.length, 2);
  assert.equal(hits[0]?.word, "BadWord");
  assert.equal(hits[0]?.index, 6);
});

test("matchContent matches CJK", () => {
  const hits = matchContent("hello badword and 敏感内容", words);
  assert.equal(hits[1]?.word, "敏感");
});

test("createHitPreview creates bounded preview", () => {
  const preview = createHitPreview("0123456789SensitiveContentABCDEFGHIJ", 10, 5);
  assert.equal(preview, "...56789Sensi...");
});

test("createHitDedupeKey normalizes to lowercase", () => {
  const dedupeKey = createHitDedupeKey("topic", 123, "content", "BadWord");
  assert.equal(dedupeKey, "topic:123:content:badword");
});
