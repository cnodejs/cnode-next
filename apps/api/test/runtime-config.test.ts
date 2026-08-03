import { describe, expect, test } from "vitest";
import { parsePostgresConfig, parseRedisConfig } from "@cnode/shared";
import { createRedisOptions } from "../src/lib/redis";

describe("runtime resource config", () => {
  test("parses the namespaced PostgreSQL contract with one default port", () => {
    expect(parsePostgresConfig({
      POSTGRES_HOST: "postgres.internal",
      POSTGRES_DB: "cnode",
      POSTGRES_USER: "cnode",
      POSTGRES_PASSWORD: "postgres-secret",
    })).toEqual({
      host: "postgres.internal",
      port: 5432,
      database: "cnode",
      user: "cnode",
      password: "postgres-secret",
    });
  });

  test("rejects legacy-only PostgreSQL variables without exposing their values", () => {
    const legacySecret = "legacy-postgres-secret";
    expect(() => parsePostgresConfig({
      DB_HOST: "legacy.internal",
      DB_NAME: "cnode",
      DB_USER: "cnode",
      DB_PASSWORD: legacySecret,
    })).toThrow("POSTGRES_HOST is required");

    try {
      parsePostgresConfig({
        POSTGRES_HOST: "postgres.internal",
        POSTGRES_DB: "cnode",
        POSTGRES_USER: "cnode",
        POSTGRES_PASSWORD: "",
      });
    } catch (error) {
      expect(String(error)).not.toContain(legacySecret);
      expect(String(error)).not.toContain("postgres-secret");
    }
  });

  test("rejects invalid PostgreSQL ports before connecting", () => {
    expect(() => parsePostgresConfig({
      POSTGRES_HOST: "postgres.internal",
      POSTGRES_PORT: "70000",
      POSTGRES_DB: "cnode",
      POSTGRES_USER: "cnode",
      POSTGRES_PASSWORD: "postgres-secret",
    })).toThrow("POSTGRES_PORT must be an integer between 1 and 65535");
  });

  test("parses Redis defaults and maps the semantic database field for ioredis", () => {
    const env = { REDIS_HOST: "redis.internal" };
    expect(parseRedisConfig(env)).toEqual({
      host: "redis.internal",
      port: 6379,
      database: 0,
      password: undefined,
    });
    expect(createRedisOptions(env)).toEqual({
      host: "redis.internal",
      port: 6379,
      db: 0,
      password: undefined,
    });
  });

  test("parses REDIS_DB and rejects invalid Redis config without exposing password", () => {
    const redisSecret = "redis-secret";
    expect(parseRedisConfig({
      REDIS_HOST: "redis.internal",
      REDIS_DB: "3",
      REDIS_PASSWORD: redisSecret,
    }).database).toBe(3);

    try {
      parseRedisConfig({
        REDIS_HOST: "redis.internal",
        REDIS_DB: "-1",
        REDIS_PASSWORD: redisSecret,
      });
    } catch (error) {
      expect(String(error)).toContain("REDIS_DB");
      expect(String(error)).not.toContain(redisSecret);
    }
  });
});
