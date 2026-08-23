export const CSP_REPORT_MAX_BYTES = 16 * 1024;
const CSP_REPORT_WINDOW_MS = 60_000;
const DEFAULT_REPORT_LIMIT = 60;
const MAX_IDENTITIES = 5_000;

type RuntimeEnv = Readonly<Record<string, string | undefined>>;

type RateEntry = { count: number; resetAt: number };
const reportRates = new Map<string, RateEntry>();

function reportLimit(env: RuntimeEnv = process.env) {
  const parsed = Number(env.CNODE_CSP_REPORT_LIMIT_PER_MINUTE);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 1_000 ? parsed : DEFAULT_REPORT_LIMIT;
}

function requestIdentity(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ||
    "unknown"
  );
}

export function consumeCspReportRateLimit(
  request: Request,
  env: RuntimeEnv = process.env,
  now = Date.now(),
) {
  const identity = requestIdentity(request);
  const current = reportRates.get(identity);
  if (!current || current.resetAt <= now) {
    if (reportRates.size >= MAX_IDENTITIES) {
      for (const [key, entry] of reportRates) {
        if (entry.resetAt <= now) reportRates.delete(key);
      }
      if (reportRates.size >= MAX_IDENTITIES) reportRates.delete(reportRates.keys().next().value!);
    }
    reportRates.set(identity, { count: 1, resetAt: now + CSP_REPORT_WINDOW_MS });
    return true;
  }
  current.count += 1;
  return current.count <= reportLimit(env);
}

export function resetCspReportRateLimitsForTest() {
  reportRates.clear();
}

export async function readBoundedBody(request: Request, maxBytes = CSP_REPORT_MAX_BYTES) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) return null;
  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function boundedString(value: unknown, maxLength = 512) {
  return typeof value === "string" && value ? value.slice(0, maxLength) : undefined;
}

function sanitizeExternalUrl(value: unknown) {
  const raw = boundedString(value, 2_048);
  if (!raw) return undefined;
  if (/^(inline|eval|data|blob):?$/i.test(raw)) return raw.toLowerCase();
  try {
    const url = new URL(raw);
    return `${url.origin}${url.pathname}`.slice(0, 512);
  } catch {
    return undefined;
  }
}

function sanitizeDocumentPath(value: unknown, reportRequest: Request) {
  const raw = boundedString(value, 2_048);
  if (!raw) return undefined;
  try {
    const documentUrl = new URL(raw);
    if (documentUrl.origin !== new URL(reportRequest.url).origin) return undefined;
    return documentUrl.pathname.slice(0, 512);
  } catch {
    return undefined;
  }
}

function reportBody(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const legacy = record["csp-report"];
  if (legacy && typeof legacy === "object") return legacy as Record<string, unknown>;
  if (record.type === "csp-violation" && record.body && typeof record.body === "object") {
    return record.body as Record<string, unknown>;
  }
  return record;
}

export type SanitizedCspReport = {
  event: "csp_violation";
  cspMode: string;
  effectiveDirective?: string;
  violatedDirective?: string;
  blockedUrl?: string;
  sourceFile?: string;
  documentPath?: string;
};

export function sanitizeCspReport(
  value: unknown,
  request: Request,
  env: RuntimeEnv = process.env,
): SanitizedCspReport | null {
  const body = reportBody(value);
  if (!body) return null;
  const effectiveDirective = boundedString(
    body.effectiveDirective ?? body["effective-directive"],
    128,
  );
  const violatedDirective = boundedString(
    body.violatedDirective ?? body["violated-directive"],
    128,
  );
  if (!effectiveDirective && !violatedDirective) return null;

  return {
    event: "csp_violation",
    cspMode: env.CNODE_WEB_CSP_MODE || (env.CNODE_ENV === "production" ? "report-only" : "off"),
    effectiveDirective,
    violatedDirective,
    blockedUrl: sanitizeExternalUrl(body.blockedURL ?? body["blocked-uri"]),
    sourceFile: sanitizeExternalUrl(body.sourceFile ?? body["source-file"]),
    documentPath: sanitizeDocumentPath(body.documentURL ?? body["document-uri"], request),
  };
}

export function parseCspReportPayload(value: unknown, request: Request, env: RuntimeEnv = process.env) {
  const values = Array.isArray(value) ? value : [value];
  const reports = values
    .map((item) => sanitizeCspReport(item, request, env))
    .filter((item): item is SanitizedCspReport => item !== null);
  return reports.length ? reports : null;
}
