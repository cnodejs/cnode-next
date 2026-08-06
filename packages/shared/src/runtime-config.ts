export type RuntimeEnv = Readonly<Record<string, string | undefined>>;

export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  database: number;
  password?: string;
}

function required(env: RuntimeEnv, name: string): string {
  const value = env[name];
  if (!value?.trim()) throw new Error(`${name} is required`);
  return value;
}

function integer(
  env: RuntimeEnv,
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const raw = env[name];
  if (raw === undefined || raw === "") return fallback;

  const value = Number(raw);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return value;
}

export function parsePostgresConfig(env: RuntimeEnv = process.env): PostgresConfig {
  return {
    host: required(env, "POSTGRES_HOST"),
    port: integer(env, "POSTGRES_PORT", 5432, 1, 65535),
    database: required(env, "POSTGRES_DB"),
    user: required(env, "POSTGRES_USER"),
    password: required(env, "POSTGRES_PASSWORD"),
  };
}

export function parseRedisConfig(env: RuntimeEnv = process.env): RedisConfig {
  return {
    host: required(env, "REDIS_HOST"),
    port: integer(env, "REDIS_PORT", 6379, 1, 65535),
    database: integer(env, "REDIS_DB", 0, 0, Number.MAX_SAFE_INTEGER),
    password: env.REDIS_PASSWORD || undefined,
  };
}
