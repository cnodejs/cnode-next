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
};

let wordCache: SensitiveWordEntry[] = [];
let cacheTime = 0;
const CACHE_TTL = 60000;

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

  const lowerContent = content.toLowerCase();
  const hits: ContentHit[] = [];
  for (const word of words) {
    const lowerWord = word.word.toLowerCase();
    const index = lowerContent.indexOf(lowerWord);
    if (index >= 0) {
      hits.push({ word: word.word, keywordId: word.id, index });
    }
  }
  return hits;
}

export function createHitPreview(content: string, index: number, radius = 80): string {
  if (!content) return "";
  const start = Math.max(0, index - radius);
  const end = Math.min(content.length, index + radius);
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
