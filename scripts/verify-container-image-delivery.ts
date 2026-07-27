import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url);
const compose = await readFile(new URL("docker-compose.prod.yml", root), "utf8");
const webDockerfile = await readFile(new URL("apps/web/Dockerfile", root), "utf8");
const apiClient = await readFile(new URL("apps/web/app/lib/api-client.ts", root), "utf8");
const rootDocument = await readFile(new URL("apps/web/app/root.tsx", root), "utf8");
const uploadClient = await readFile(new URL("apps/web/app/lib/upload-client.ts", root), "utf8");
const workflow = await readFile(new URL(".github/workflows/build-container-images.yml", root), "utf8");
const docs = await readFile(new URL("docs/deployment.md", root), "utf8");

const services = ["api", "web", "worker", "migrate-schema", "migrate-data", "reconcile"];
for (const service of services) {
  const match = compose.match(new RegExp(`\\n  ${service}:\\n([\\s\\S]*?)(?=\\n  [a-zA-Z0-9_-]+:|\\nvolumes:)`));
  assert(match, `compose service ${service} exists`);
  assert.doesNotMatch(match[1], /\n    build:/, `${service} must not define build`);
  assert.match(match[1], /^    image:/m, `${service} must define image`);
}

assert.match(compose, /CNODE_API_IMAGE:-ghcr\.io\/cnodejs\/cnode-api:latest/g, "api image default uses GHCR");
assert.match(compose, /CNODE_WEB_IMAGE:-ghcr\.io\/cnodejs\/cnode-web:latest/, "web image default uses GHCR");
assert.doesNotMatch(compose, /VITE_APP_API_BASE_URL/, "compose must not pass build-time API URL");
assert.doesNotMatch(webDockerfile, /VITE_APP_API_BASE_URL/, "web Dockerfile must not use build-time API URL");
assert.match(rootDocument, /__CNODE_CONFIG__/, "root document injects runtime public config");
assert.match(rootDocument, /APP_API_BASE_URL/, "root document reads runtime APP_API_BASE_URL");
assert.match(apiClient, /window\.__CNODE_CONFIG__\?\.apiBaseUrl/, "browser api client reads runtime config");
assert.doesNotMatch(apiClient, /VITE_APP_API_BASE_URL/, "api client must not read VITE API base");
assert.match(uploadClient, /getApiBaseUrl\(\)/, "upload client reuses API base helper");

assert.match(workflow, /permissions:\s*[\s\S]*contents: read[\s\S]*packages: write/, "workflow grants minimal package permissions");
assert.match(workflow, /actions\/checkout@v5/, "workflow uses Node 24 compatible checkout action");
assert.match(workflow, /docker\/setup-buildx-action@v4/, "workflow uses Node 24 compatible Buildx action");
assert.match(workflow, /docker\/login-action@v4/, "workflow logs in to GHCR with Node 24 compatible action");
assert.match(workflow, /docker\/build-push-action@v7/, "workflow uses Node 24 compatible build/push action");
assert.match(workflow, /secrets\.GITHUB_TOKEN/, "workflow uses GITHUB_TOKEN");
assert.match(workflow, /ghcr\.io\/cnodejs\/cnode-api:latest/, "workflow pushes API latest");
assert.match(workflow, /ghcr\.io\/cnodejs\/cnode-web:latest/, "workflow pushes Web latest");
assert.doesNotMatch(workflow, /ssh|QCloud|docker compose|HOST|PRIVATE_KEY/i, "workflow must not deploy to remote server");

assert.match(docs, /docker compose -f docker-compose\.prod\.yml pull api web worker/, "docs include pull step");
assert.match(docs, /up -d --no-build/, "docs include no-build deployment step");
assert.match(docs, /APP_API_INTERNAL_BASE_URL/, "docs explain SSR internal API base");
assert.match(docs, /APP_API_BASE_URL/, "docs explain browser runtime API base");

console.log("container image delivery checks passed");
