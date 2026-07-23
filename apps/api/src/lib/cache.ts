import { getRedis } from "./redis";
import type { RedisClient } from "./redis";

export class CacheService {
  private redis: RedisClient;

  constructor() {
    this.redis = getRedis();
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, seconds?: number): Promise<void> {
    const data = JSON.stringify(value);
    if (seconds) {
      await this.redis.setex(key, seconds, data);
    } else {
      await this.redis.set(key, data);
    }
  }

  async incr(key: string, seconds?: number): Promise<number> {
    const count = await this.redis.incr(key);
    if (count === 1 && seconds) {
      await this.redis.expire(key, seconds);
    }
    return count;
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

let cacheInstance: CacheService | null = null;

export function getCache(): CacheService {
  if (!cacheInstance) {
    cacheInstance = new CacheService();
  }
  return cacheInstance;
}
