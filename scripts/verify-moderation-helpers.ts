import { createHitDedupeKey, createHitPreview, matchContent } from "../apps/api/src/lib/moderation";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const words = [
  { id: 1, word: "BadWord" },
  { id: 2, word: "敏感" },
];

const hits = matchContent("hello badword and 敏感内容", words);
assert(hits.length === 2, "should match multiple words");
assert(hits[0]?.word === "BadWord", "should preserve original word text");
assert(hits[0]?.index === 6, "should report match index");
assert(hits[1]?.word === "敏感", "should match CJK words");

const preview = createHitPreview("0123456789SensitiveContentABCDEFGHIJ", 10, 5);
assert(preview === "...56789Sensi...", "should create bounded preview");

const dedupeKey = createHitDedupeKey("topic", 123, "content", "BadWord");
assert(dedupeKey === "topic:123:content:badword", "should create normalized dedupe key");

console.log("moderation helper verification passed");
