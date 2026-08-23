import { randomBytes } from "node:crypto";

export type CspMode = "off" | "report-only" | "enforce";

type RuntimeEnv = Readonly<Record<string, string | undefined>>;

export type WebSecurityConfig = {
  cspMode: CspMode;
  hstsMaxAge: number;
  isProduction: boolean;
  warnings: string[];
};

const CSP_REPORT_PATH = "/__csp-report";
const DEFAULT_HSTS_MAX_AGE = 300;
const MAX_HSTS_MAX_AGE = 31_536_000;

export function createCspNonce() {
  return randomBytes(18).toString("base64url");
}

export function resolveWebSecurityConfig(env: RuntimeEnv = process.env): WebSecurityConfig {
  const isProduction = env.CNODE_ENV === "production" || env.NODE_ENV === "production";
  const warnings: string[] = [];
  const rawMode = env.CNODE_WEB_CSP_MODE?.trim();
  let cspMode: CspMode = isProduction ? "report-only" : "off";

  if (rawMode) {
    if (rawMode === "off" || rawMode === "report-only" || rawMode === "enforce") {
      cspMode = rawMode;
    } else {
      warnings.push("CNODE_WEB_CSP_MODE is invalid; using the environment default");
    }
  }

  const rawHsts = env.CNODE_WEB_HSTS_MAX_AGE?.trim();
  let hstsMaxAge = isProduction ? DEFAULT_HSTS_MAX_AGE : 0;
  if (rawHsts) {
    const parsed = Number(rawHsts);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed <= MAX_HSTS_MAX_AGE) {
      hstsMaxAge = parsed;
    } else {
      warnings.push("CNODE_WEB_HSTS_MAX_AGE is invalid; using the environment default");
    }
  }

  return { cspMode, hstsMaxAge, isProduction, warnings };
}

function origin(value: string | undefined) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function buildContentSecurityPolicy(
  nonce: string,
  env: RuntimeEnv = process.env,
): string {
  const apiOrigin = origin(env.CNODE_API_BASE_URL || "https://api.cnodejs.org");
  const connectSources = ["'self'", "https://challenges.cloudflare.com"];
  if (apiOrigin && !connectSources.includes(apiOrigin)) connectSources.push(apiOrigin);

  // Arbitrary HTTPS images are existing user-content behavior; scripts remain nonce-restricted.
  const directives = [
    ["default-src", "'self'"],
    ["base-uri", "'self'"],
    ["object-src", "'none'"],
    ["frame-ancestors", "'none'"],
    ["form-action", "'self'"],
    [
      "script-src",
      "'self'",
      `'nonce-${nonce}'`,
      "https://challenges.cloudflare.com",
    ],
    ["script-src-attr", "'none'"],
    ["style-src", "'self'", "'unsafe-inline'"],
    ["connect-src", ...connectSources],
    ["img-src", "'self'", "data:", "blob:", "https:"],
    ["font-src", "'self'", "data:"],
    ["manifest-src", "'self'"],
    ["frame-src", "https://challenges.cloudflare.com"],
    ["worker-src", "'self'", "blob:"],
    ["report-uri", CSP_REPORT_PATH],
  ];

  return directives.map((parts) => parts.join(" ")).join("; ");
}

export function isSecureRequest(request: Request) {
  if (new URL(request.url).protocol === "https:") return true;
  return request.headers.get("x-forwarded-proto")?.split(",", 1)[0]?.trim() === "https";
}

export function applyDocumentSecurityHeaders(
  headers: Headers,
  request: Request,
  nonce: string,
  env: RuntimeEnv = process.env,
) {
  const config = resolveWebSecurityConfig(env);

  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");

  headers.delete("Content-Security-Policy");
  headers.delete("Content-Security-Policy-Report-Only");
  if (config.cspMode !== "off") {
    const headerName =
      config.cspMode === "enforce"
        ? "Content-Security-Policy"
        : "Content-Security-Policy-Report-Only";
    headers.set(headerName, buildContentSecurityPolicy(nonce, env));
  }

  headers.delete("Strict-Transport-Security");
  if (config.isProduction && config.hstsMaxAge > 0 && isSecureRequest(request)) {
    headers.set("Strict-Transport-Security", `max-age=${config.hstsMaxAge}`);
  }

  return config;
}
