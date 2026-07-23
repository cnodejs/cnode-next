// Mock Redis for local development — in-memory implementation
// Swap with real ioredis in production via REDIS_HOST env

type TTLCallback = (err: Error | null, result: any) => void;

interface CacheEntry {
  value: string;
  expireAt: number | null;
}

export class MockRedis {
  private store = new Map<string, CacheEntry>();

  private isExpired(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return true;
    if (entry.expireAt !== null && Date.now() > entry.expireAt) {
      this.store.delete(key);
      return true;
    }
    return false;
  }

  async get(key: string): Promise<string | null> {
    if (this.isExpired(key)) return null;
    return this.store.get(key)?.value ?? null;
  }

  async set(key: string, value: string, mode?: string, seconds?: number): Promise<string> {
    const entry: CacheEntry = {
      value,
      expireAt: mode === "EX" && seconds ? Date.now() + seconds * 1000 : null,
    };
    this.store.set(key, entry);
    return "OK";
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    return this.set(key, value, "EX", seconds);
  }

  async incr(key: string): Promise<number> {
    const current = this.isExpired(key) ? 0 : Number(this.store.get(key)?.value ?? 0);
    const next = current + 1;
    const existing = this.store.get(key);
    this.store.set(key, {
      value: String(next),
      expireAt: existing?.expireAt ?? null,
    });
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || this.isExpired(key)) return 0;
    entry.expireAt = Date.now() + seconds * 1000;
    return 1;
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    return this.isExpired(key) ? 0 : 1;
  }

  async flushall(): Promise<string> {
    this.store.clear();
    return "OK";
  }

  disconnect(): void {
    this.store.clear();
  }
}

let instance: MockRedis | null = null;

export function getRedis(): MockRedis {
  if (!instance) {
    instance = new MockRedis();
  }
  return instance;
}
