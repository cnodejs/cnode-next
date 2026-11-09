import { describe, expect, test } from "vite-plus/test";
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

describe("matchContent evasion detection", () => {
  const strictWords = [
    { id: 10, word: "科学" },
    { id: 11, word: "VPN" },
  ];

  test.each([
    "科学",
    "科 学",
    "科\u3000学",
    "科\n学",
    "科\u200b学",
    "科-学",
    "科🙂学",
    "科a学",
    "科1学",
    "科测试学",
    "科**学",
  ])("matches bounded inserted variant %j", (content) => {
    expect(matchContent(content, strictWords).map((hit) => hit.word)).toContain("科学");
  });

  test("normalizes case and compatibility-width characters", () => {
    const hits = matchContent("使用Ｖ p Ｎ连接", strictWords);
    expect(hits.map((hit) => hit.word)).toContain("VPN");
  });

  test("maps normalized graphemes and supplementary characters to original UTF-16 ranges", () => {
    const compatibility = matchContent("前Ａ后", [{ id: 12, word: "a" }])[0];
    expect(compatibility).toMatchObject({ index: 1, endIndex: 2 });

    const composed = matchContent("前e\u0301后", [{ id: 13, word: "é" }])[0];
    expect(composed).toMatchObject({ index: 1, endIndex: 3 });

    const emoji = matchContent("前科🙂学后", strictWords)[0];
    expect(emoji).toMatchObject({ index: 1, endIndex: 5 });
  });

  test("includes the insertion boundaries", () => {
    expect(matchContent(`科${"a".repeat(3)}学`, strictWords)).toHaveLength(1);
    expect(matchContent(`科${"-".repeat(16)}学`, strictWords)).toHaveLength(1);
  });

  test("rejects candidate positions beyond either insertion boundary", () => {
    expect(matchContent(`科${"a".repeat(4)}学`, strictWords)).toHaveLength(0);
    expect(matchContent(`科${"-".repeat(17)}学`, strictWords)).toHaveLength(0);
  });

  test("backtracks across repeated target characters within the bounded window", () => {
    const hits = matchContent("a-a-------------a-------------b", [{ id: 14, word: "aab" }]);
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ index: 0, endIndex: 31 });
  });

  test("matches single-character words and reports each word at most once", () => {
    const hits = matchContent("科学科学", [
      { id: 15, word: "科" },
      { id: 10, word: "科学" },
    ]);
    expect(hits).toHaveLength(2);
    expect(hits.map((hit) => hit.word)).toEqual(["科", "科学"]);
  });

  test("does not exempt ordinary contexts", () => {
    expect(matchContent("计算机科学", strictWords).map((hit) => hit.word)).toContain("科学");
  });

  test("matches a 10000-character post within the existing performance budget", () => {
    const content = `${"x".repeat(9_990)}科测试学尾部内容`;
    const realisticWords = [
      { id: 20, word: "科学上网" },
      { id: 21, word: "VPN" },
      { id: 22, word: "机场" },
      { id: 23, word: "科学" },
    ];
    const startedAt = performance.now();
    const hits = matchContent(content, realisticWords);
    const duration = performance.now() - startedAt;

    expect(hits.map((hit) => hit.word)).toContain("科学");
    expect(duration).toBeLessThan(100);
  });
});

test("createHitPreview creates bounded preview", () => {
  const preview = createHitPreview("0123456789SensitiveContentABCDEFGHIJ", 10, 5);
  expect(preview).toBe("...56789Sensi...");
});

test("createHitPreview retains the complete original match range", () => {
  const content = `prefix-${"x".repeat(100)}科🙂学-${"y".repeat(100)}-suffix`;
  const hit = matchContent(content, [{ id: 1, word: "科学" }])[0];
  expect(hit).toBeDefined();
  const preview = createHitPreview(content, hit!.index, 5, hit!.endIndex);
  expect(preview).toContain("科🙂学");
});

test("createHitDedupeKey normalizes to lowercase", () => {
  const dedupeKey = createHitDedupeKey("topic", 123, "content", "BadWord");
  expect(dedupeKey).toBe("topic:123:content:badword");
});
