export {};

const runtime = (globalThis as unknown as {
  process: { env: Record<string, string | undefined>; exitCode?: number };
}).process;
const webBase = (runtime.env.CNODE_WEB_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const expectedMode = runtime.env.CNODE_WEB_CSP_MODE || "report-only";
const expectedHstsMaxAge = runtime.env.CNODE_WEB_HSTS_MAX_AGE || "300";

const paths = ["/", "/signin", "/about", "/__web-security-missing"];

function assertHeader(response: Response, name: string, expected: string) {
  const value = response.headers.get(name);
  if (value !== expected) throw new Error(`${response.url} has invalid ${name}`);
}

function cspHeader(response: Response) {
  const enforce = response.headers.get("content-security-policy");
  const reportOnly = response.headers.get("content-security-policy-report-only");
  if (expectedMode === "off") {
    if (enforce || reportOnly) throw new Error(`${response.url} unexpectedly enables CSP`);
    return null;
  }
  if (expectedMode === "enforce") {
    if (!enforce || reportOnly) throw new Error(`${response.url} is not in enforce CSP mode`);
    return enforce;
  }
  if (!reportOnly || enforce) throw new Error(`${response.url} is not in report-only CSP mode`);
  return reportOnly;
}

async function verifyPath(path: string) {
  const response = await fetch(`${webBase}${path}`, { redirect: "manual" });
  if (path === "/__web-security-missing") {
    if (response.status !== 404) throw new Error(`${path} returned ${response.status}, expected 404`);
  } else if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  assertHeader(response, "x-content-type-options", "nosniff");
  assertHeader(response, "referrer-policy", "strict-origin-when-cross-origin");
  assertHeader(response, "x-frame-options", "DENY");
  assertHeader(
    response,
    "permissions-policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  if (new URL(response.url).protocol === "https:") {
    const hsts = response.headers.get("strict-transport-security");
    if (expectedHstsMaxAge === "0" ? hsts !== null : hsts !== `max-age=${expectedHstsMaxAge}`) {
      throw new Error(`${path} has invalid strict-transport-security`);
    }
  }
  const policy = cspHeader(response);
  const html = await response.text();

  if (policy) {
    const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
    if (!nonce) throw new Error(`${path} CSP does not contain a nonce`);
    if (policy.match(/script-src [^;]*/)?.[0]?.includes("'unsafe-inline'")) {
      throw new Error(`${path} script-src contains unsafe-inline`);
    }
    const scripts = html.match(/<script\b[^>]*>/g) || [];
    if (!scripts.length || scripts.some((tag) => !tag.includes(`nonce="${nonce}"`))) {
      throw new Error(`${path} contains a script without the response nonce`);
    }
  }

  console.log(`web security smoke passed: ${path} (${response.status})`);
}

async function main() {
  for (const path of paths) await verifyPath(path);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "web security smoke failed");
  runtime.exitCode = 1;
});
