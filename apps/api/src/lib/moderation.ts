import { getDb } from "./db";
import { sensitiveWords } from "@cnode/db";
import { eq, sql } from "drizzle-orm";

export type SensitiveWordEntry = {
  id: number;
  word: string;
  category?: string | null;
};

export type ContentHit = {
  word: string;
  keywordId?: number;
  index: number;
  endIndex: number;
};

type NormalizedCodePoint = {
  value: string;
  sourceStart: number;
  sourceEnd: number;
};

let wordCache: SensitiveWordEntry[] = [];
let cacheTime = 0;
const CACHE_TTL = 60000;
const MAX_ORDINARY_INSERTIONS = 3;
const MAX_TOTAL_INSERTIONS = 16;
const ORDINARY_CODE_POINT = /[\p{L}\p{N}]/u;
const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
const normalizedWordCache = new Map<string, string[]>();

function normalizeContent(content: string): NormalizedCodePoint[] {
  const normalized: NormalizedCodePoint[] = [];
  for (const part of graphemeSegmenter.segment(content)) {
    const value = part.segment.normalize("NFKC").toLowerCase();
    const sourceStart = part.index;
    const sourceEnd = sourceStart + part.segment.length;
    for (const codePoint of value) {
      normalized.push({ value: codePoint, sourceStart, sourceEnd });
    }
  }
  return normalized;
}

function normalizeWord(word: string): string[] {
  const cached = normalizedWordCache.get(word);
  if (cached) return cached;
  const normalized = normalizeContent(word).map((entry) => entry.value);
  normalizedWordCache.set(word, normalized);
  return normalized;
}

function isOrdinaryInsertion(value: string) {
  return ORDINARY_CODE_POINT.test(value);
}

function findMatchEnd(
  content: NormalizedCodePoint[],
  keyword: string[],
  startIndex: number,
): number | null {
  if (keyword.length === 1) return startIndex;

  const memo = new Map<string, number | null>();
  const search = (contentIndex: number, keywordIndex: number): number | null => {
    if (keywordIndex === keyword.length) return contentIndex;
    const memoKey = `${contentIndex}:${keywordIndex}`;
    if (memo.has(memoKey)) return memo.get(memoKey) ?? null;

    let ordinaryInsertions = 0;
    const lastCandidate = Math.min(content.length - 1, contentIndex + MAX_TOTAL_INSERTIONS + 1);
    for (let candidate = contentIndex + 1; candidate <= lastCandidate; candidate += 1) {
      const entry = content[candidate];
      if (!entry) break;

      if (entry.value === keyword[keywordIndex] && ordinaryInsertions <= MAX_ORDINARY_INSERTIONS) {
        const end = search(candidate, keywordIndex + 1);
        if (end !== null) {
          memo.set(memoKey, end);
          return end;
        }
      }

      if (isOrdinaryInsertion(entry.value)) {
        ordinaryInsertions += 1;
        if (ordinaryInsertions > MAX_ORDINARY_INSERTIONS) break;
      }
    }

    memo.set(memoKey, null);
    return null;
  };

  return search(startIndex, 1);
}

export async function loadWords(): Promise<SensitiveWordEntry[]> {
  const now = Date.now();
  if (wordCache.length > 0 && now - cacheTime < CACHE_TTL) {
    return wordCache;
  }
  const db = getDb();
  const rows = await db.select().from(sensitiveWords);
  wordCache = rows
    .map((r: any) => ({ id: Number(r.id), word: String(r.word || ""), category: r.category }))
    .filter((word) => word.word.length > 0);
  cacheTime = now;
  return wordCache;
}

export function invalidateWordCache() {
  wordCache = [];
  cacheTime = 0;
  normalizedWordCache.clear();
}

export async function checkContent(content: string): Promise<{ hit: boolean; words: string[] }> {
  const words = await loadWords();
  const hits = matchContent(content, words);
  await incrementSensitiveWordHits(hits);
  return { hit: hits.length > 0, words: hits.map((hit) => hit.word) };
}

export async function incrementSensitiveWordHits(hits: ContentHit[]) {
  const ids = [...new Set(hits.map((hit) => hit.keywordId).filter((id): id is number => !!id))];
  if (!ids.length) return;
  const db = getDb();
  for (const id of ids) {
    await db
      .update(sensitiveWords)
      .set({ hitCount: sql`${sensitiveWords.hitCount} + 1` } as any)
      .where(eq(sensitiveWords.id, id));
  }
}

export function matchContent(content: string, words: SensitiveWordEntry[]): ContentHit[] {
  if (!content || words.length === 0) return [];

  const normalizedContent = normalizeContent(content);
  if (normalizedContent.length === 0) return [];
  const hits: ContentHit[] = [];
  for (const word of words) {
    const normalizedWord = normalizeWord(word.word);
    if (normalizedWord.length === 0) continue;

    for (let index = 0; index < normalizedContent.length; index += 1) {
      const start = normalizedContent[index];
      if (!start || start.value !== normalizedWord[0]) continue;
      const matchEnd = findMatchEnd(normalizedContent, normalizedWord, index);
      if (matchEnd !== null) {
        hits.push({
          word: word.word,
          keywordId: word.id,
          index: start.sourceStart,
          endIndex: normalizedContent[matchEnd]?.sourceEnd ?? start.sourceEnd,
        });
        break;
      }
    }
  }
  return hits;
}

export function createHitPreview(
  content: string,
  index: number,
  radius = 80,
  endIndex = index,
): string {
  if (!content) return "";
  const start = Math.max(0, index - radius);
  const end = Math.min(content.length, Math.max(index, endIndex) + radius);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < content.length ? "..." : "";
  return `${prefix}${content.slice(start, end)}${suffix}`;
}

export function createHitDedupeKey(
  targetType: string,
  targetId: number,
  field: string,
  keyword: string,
): string {
  return `${targetType}:${targetId}:${field}:${keyword.toLowerCase()}`;
}
