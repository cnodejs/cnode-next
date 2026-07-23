interface KVNamespace {
  get(key: string, options?: { type?: "text" | "json" }): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export async function kvGet<T>(kv: KVNamespace | undefined, key: string): Promise<T | null> {
  if (!kv) return null;
  try {
    const data = await kv.get(key, { type: "text" });
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function kvSet(
  kv: KVNamespace | undefined,
  key: string,
  value: unknown,
  ttl = 60,
): Promise<void> {
  if (!kv) return;
  try {
    await kv.put(key, JSON.stringify(value), { expirationTtl: ttl });
  } catch (e) {
    console.error("kv set error:", e);
  }
}
