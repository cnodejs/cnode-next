import Redis from "ioredis";
import { parseRedisConfig, type RuntimeEnv } from "@cnode/shared";
import { MockRedis } from "./mock-redis";
import type { MockRedis as MockRedisType } from "./mock-redis";

export type RedisClient = MockRedisType;

let client: RedisClient | null = null;

export function createRedisOptions(env: RuntimeEnv = process.env) {
  const config = parseRedisConfig(env);
  return {
    host: config.host,
    port: config.port,
    password: config.password,
    db: config.database,
  };
}

export function getRedis(): RedisClient {
  if (client) return client;

  if (process.env.NODE_ENV === "test") {
    client = new MockRedis();
  } else {
    const instance = new Redis(createRedisOptions());
    // Wrap to match MockRedis interface
    client = {
      get: (key: string) => instance.get(key),
      set: (key: string, value: string, mode?: string, seconds?: number) =>
        seconds !== undefined
          ? (instance.set as any)(key, value, mode, seconds)
          : instance.set(key, value),
      setex: (key: string, seconds: number, value: string) => instance.setex(key, seconds, value),
      setnx: (key: string, value: string) => instance.setnx(key, value),
      incr: (key: string) => instance.incr(key),
      expire: (key: string, seconds: number) => instance.expire(key, seconds),
      del: (key: string) => instance.del(key),
      exists: (key: string) => instance.exists(key),
      flushall: () => instance.flushall(),
      disconnect: () => instance.disconnect(),
    } as RedisClient;
  }

  return client;
}
