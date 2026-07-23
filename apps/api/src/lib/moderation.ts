import { getDb } from "./db";
import { sensitiveWords } from "@cnode/db";
import { eq } from "drizzle-orm";

let wordCache: string[] = [];
let cacheTime = 0;
const CACHE_TTL = 60000;

async function loadWords(): Promise<string[]> {
  const now = Date.now();
  if (wordCache.length > 0 && now - cacheTime < CACHE_TTL) {
    return wordCache;
  }
  const db = getDb();
  const rows = await db.select().from(sensitiveWords);
  wordCache = rows.map((r: any) => r.word);
  cacheTime = now;
  return wordCache;
}

export function invalidateWordCache() {
  wordCache = [];
  cacheTime = 0;
}

export async function checkContent(content: string): Promise<{ hit: boolean; words: string[] }> {
  const words = await loadWords();
  if (words.length === 0) return { hit: false, words: [] };

  const lowerContent = content.toLowerCase();
  const hitWords: string[] = [];
  for (const word of words) {
    if (lowerContent.includes(word.toLowerCase())) {
      hitWords.push(word);
    }
  }
  return { hit: hitWords.length > 0, words: hitWords };
}
