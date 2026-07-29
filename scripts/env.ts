import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

type Env = Record<string, string | undefined>;

export interface LoadRootEnvOptions {
  cwd?: string;
  env?: Env;
  envFile?: string;
}

function parseValue(value: string) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseEnv(content: string) {
  const values = new Map<string, string>();

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const index = line.indexOf("=");
    if (index === -1) continue;

    const key = line.slice(0, index).trim();
    if (!key) continue;

    values.set(key, parseValue(line.slice(index + 1)));
  }

  return values;
}

function loadEnvFile(path: string, env: Env, protectedKeys: Set<string>, overrideLoaded: boolean) {
  if (!existsSync(path)) return false;

  const values = parseEnv(readFileSync(path, "utf8"));
  for (const [key, value] of values) {
    if (protectedKeys.has(key)) continue;
    if (!overrideLoaded && env[key] !== undefined) continue;
    env[key] = value;
  }

  return true;
}

export function findWorkspaceRoot(cwd = process.cwd()) {
  let current = resolve(cwd);

  while (true) {
    const manifestPath = resolve(current, "package.json");
    if (existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { name?: string };
        if (manifest.name === "cnode-next") return current;
      } catch {
        // Keep walking upward if this package.json is not readable JSON.
      }
    }

    const parent = resolve(current, "..");
    if (parent === current) return resolve(cwd);
    current = parent;
  }
}

export function resolveEnvFile(root: string, envFile: string) {
  return isAbsolute(envFile) ? envFile : resolve(root, envFile);
}

export function loadRootEnv(options: LoadRootEnvOptions = {}) {
  const env = options.env ?? process.env;
  const root = findWorkspaceRoot(options.cwd);
  const protectedKeys = new Set(Object.keys(env).filter((key) => env[key] !== undefined));
  const defaultEnvPath = resolve(root, ".env");
  const explicitEnvFile = options.envFile ?? env.CNODE_ENV_FILE;

  loadEnvFile(defaultEnvPath, env, protectedKeys, false);

  if (explicitEnvFile) {
    const explicitPath = resolveEnvFile(root, explicitEnvFile);
    if (!existsSync(explicitPath)) {
      throw new Error(`CNODE_ENV_FILE does not exist: ${explicitEnvFile}`);
    }
    loadEnvFile(explicitPath, env, protectedKeys, true);
  }

  return { root, defaultEnvPath, explicitEnvFile };
}
