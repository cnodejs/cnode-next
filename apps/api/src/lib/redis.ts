import { MockRedis } from "./mock-redis";
import type { MockRedis as MockRedisType } from "./mock-redis";

export type RedisClient = MockRedisType;

let client: RedisClient | null = null;

export function getRedis(): RedisClient {
  if (client) return client;

  const hasRedis = process.env.REDIS_HOST && process.env.REDIS_PORT;

  if (hasRedis) {
    // Lazy load ioredis only when needed
    const { Redis } = require("ioredis") as typeof import("ioredis");
    const instance = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB) || 0,
    });
    // Wrap to match MockRedis interface
    client = {
      get: (key: string) => instance.get(key),
      set: (key: string, value: string, mode?: string, seconds?: number) =>
        seconds !== undefined ? instance.set(key, value, mode!, seconds) : instance.set(key, value),
      setex: (key: string, seconds: number, value: string) => instance.setex(key, seconds, value),
      incr: (key: string) => instance.incr(key),
      expire: (key: string, seconds: number) => instance.expire(key, seconds),
      del: (key: string) => instance.del(key),
      exists: (key: string) => instance.exists(key),
      flushall: () => instance.flushall(),
      disconnect: () => instance.disconnect(),
    } as RedisClient;
  } else {
    client = new MockRedis();
  }

  return client;
}
