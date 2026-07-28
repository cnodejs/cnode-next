import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const oasPath = resolve(root, "docs/api/openapi.yaml");
const manifestPath = resolve(root, "apps/web/api-contract.manifest.json");
const webAppPath = resolve(root, "apps/web/app");

const oas = readFileSync(oasPath, "utf8");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
  contracts: Array<{ method: string; path: string; responseFields?: string[] }>;
};

const errors: string[] = [];

function requireText(pattern: RegExp, message: string) {
  if (!pattern.test(oas)) errors.push(message);
}

requireText(/^openapi:\s*3\./m, "OAS must define an OpenAPI 3.x version");
requireText(/^info:\s*$/m, "OAS must define info");
requireText(/^servers:\s*$/m, "OAS must define servers");
requireText(/^paths:\s*$/m, "OAS must define paths");
requireText(/^components:\s*$/m, "OAS must define components");
requireText(/^\s{2}securitySchemes:\s*$/m, "OAS must define components.securitySchemes");
requireText(/^\s{2}schemas:\s*$/m, "OAS must define components.schemas");
requireText(/ErrorEnvelope:/, "OAS must define a common ErrorEnvelope schema");

for (const tag of ["topics", "replies", "users", "collections", "messages", "auth", "search", "system config", "admin", "internal"]) {
  requireText(new RegExp(`name: ${tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), `OAS missing tag: ${tag}`);
}

const secretPatterns = [
  /postgres(?:ql)?:\/\//i,
  /mongodb(?:\+srv)?:\/\//i,
  /redis:\/\//i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /sk-[A-Za-z0-9]{20,}/,
  /accesstoken:\s*[A-Za-z0-9_-]{16,}/i,
];

for (const pattern of secretPatterns) {
  if (pattern.test(oas)) errors.push(`OAS appears to contain a secret or private connection string matching ${pattern}`);
}

const operations = new Map<string, Set<string>>();
const responseFields = new Map<string, Set<string>>();
let currentPath: string | null = null;
let currentMethod: string | null = null;

for (const rawLine of oas.split("\n")) {
  const pathMatch = rawLine.match(/^\s{2}(\/[^"]\S*):\s*$/);
  if (pathMatch) {
    currentPath = pathMatch[1];
    currentMethod = null;
    operations.set(currentPath, operations.get(currentPath) ?? new Set());
    continue;
  }

  const methodMatch = rawLine.match(/^\s{4}(get|post|put|patch|delete):\s*$/);
  if (currentPath && methodMatch) {
    currentMethod = methodMatch[1].toUpperCase();
    operations.get(currentPath)?.add(currentMethod);
    responseFields.set(`${currentMethod} ${currentPath}`, new Set());
    continue;
  }

  const fieldMatch = rawLine.match(/^\s{6}x-contract-response-fields:\s*\[(.*)]\s*$/);
  if (currentPath && currentMethod && fieldMatch) {
    const fields = fieldMatch[1]
      .split(",")
      .map((field) => field.trim())
      .filter(Boolean);
    responseFields.set(`${currentMethod} ${currentPath}`, new Set(fields));
  }
}

for (const contract of manifest.contracts) {
  const method = contract.method.toUpperCase();
  const key = `${method} ${contract.path}`;
  const pathOperations = operations.get(contract.path);
  if (!pathOperations?.has(method)) {
    errors.push(`Web contract calls undocumented core API: ${key}`);
    continue;
  }

  const documentedFields = responseFields.get(key) ?? new Set();
  for (const field of contract.responseFields ?? []) {
    if (!documentedFields.has(field)) {
      errors.push(`OAS operation ${key} is missing core response field used by Web: ${field}`);
    }
  }
}

function listSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const path = resolve(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...listSourceFiles(path));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(path);
    }
  }
  return files;
}

function normalizePath(path: string) {
  return path
    .split("?")[0]
    .replace(/\$\{[^}]+}/g, "{param}")
    .replace(/:[A-Za-z_][A-Za-z0-9_]*/g, "{param}")
    .replace(/\/\d+(?=\/|$)/g, "/{param}");
}

function pathsMatch(actual: string, documented: string) {
  const actualParts = actual.split("/").filter(Boolean);
  const documentedParts = documented.split("/").filter(Boolean);
  if (actualParts.length !== documentedParts.length) return false;
  return actualParts.every((part, index) => {
    const docPart = documentedParts[index];
    return part === docPart || (part.startsWith("{") && docPart.startsWith("{"));
  });
}

function isCoreWebPath(path: string) {
  if (path.startsWith("/api/v1/admin/")) return false;
  if (/\/api\/v1\/topic\/\{param}\/(top|good|delete)$/.test(path)) return false;
  if (path.endsWith("/api/v1/topic/{param}/{param}")) return false;
  if (/\/api\/v1\/user\/\{param}\/(block|unblock|mute|unmute|delete_all)$/.test(path)) return false;
  if (path.endsWith("/api/v1/user/{param}/{param}")) return false;
  if (path.endsWith("/api/v1/user/{param}/reset_password")) return false;
  if (path.endsWith("/api/v1/admin")) return false;
  return true;
}

for (const file of listSourceFiles(webAppPath)) {
  const source = readFileSync(file, "utf8");
  const paths = new Set<string>();

  for (const match of source.matchAll(/\/api\/v1\/[A-Za-z0-9_/${}.:?-]+/g)) {
    paths.add(match[0]);
  }

  for (const path of paths) {
    const sourcePath = normalizePath(path);
    if (sourcePath.includes("${")) continue;
    if (!isCoreWebPath(sourcePath)) continue;
    const documented = [...operations.keys()].some((path) => pathsMatch(sourcePath, path));
    if (!documented) {
      errors.push(`apps/web calls undocumented core API path ${sourcePath} in ${file.replace(`${root}/`, "")}`);
    }
  }
}

if (errors.length > 0) {
  console.error("OpenAPI contract verification failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`OpenAPI contract verification passed (${operations.size} paths, ${manifest.contracts.length} web contracts).`);
