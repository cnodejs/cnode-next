import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { appLog } from "./telemetry/logger";

function findWorkspaceRoot(cwd: string) {
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

function parseValue(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadEnvFile(path: string, protectedKeys: Set<string>, overrideLoaded: boolean) {
  if (!existsSync(path)) return;

  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const index = line.indexOf("=");
    if (index === -1) continue;

    const key = line.slice(0, index).trim();
    if (!key || protectedKeys.has(key)) continue;
    if (!overrideLoaded && process.env[key] !== undefined) continue;

    process.env[key] = parseValue(line.slice(index + 1));
  }
}

function loadRootEnv() {
  const root = findWorkspaceRoot(import.meta.dirname);
  const protectedKeys = new Set(
    Object.keys(process.env).filter((key) => process.env[key] !== undefined),
  );

  loadEnvFile(resolve(root, ".env"), protectedKeys, false);

  const envFile = process.env.CNODE_ENV_FILE;
  if (!envFile) return;

  const explicitPath = isAbsolute(envFile) ? envFile : resolve(root, envFile);
  if (!existsSync(explicitPath)) throw new Error(`CNODE_ENV_FILE does not exist: ${envFile}`);
  loadEnvFile(explicitPath, protectedKeys, true);
}

loadRootEnv();

export async function configureProxy() {
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (!proxy) return;
  const { setGlobalDispatcher, ProxyAgent } = await import("undici");
  setGlobalDispatcher(new ProxyAgent(proxy));
  appLog("proxy.configured", "INFO");
}
