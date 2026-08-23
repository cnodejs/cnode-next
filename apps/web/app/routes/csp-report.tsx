import {
  consumeCspReportRateLimit,
  parseCspReportPayload,
  readBoundedBody,
} from "~/lib/csp-report";

const ACCEPTED_CONTENT_TYPES = new Set(["application/csp-report", "application/reports+json"]);

export async function action({ request }: { request: Request }) {
  if (!consumeCspReportRateLimit(request)) {
    return new Response(null, { status: 429 });
  }

  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (!contentType || !ACCEPTED_CONTENT_TYPES.has(contentType)) {
    return new Response(null, { status: 415 });
  }

  const bytes = await readBoundedBody(request);
  if (!bytes) return new Response(null, { status: 413 });

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return new Response(null, { status: 400 });
  }

  const reports = parseCspReportPayload(payload, request);
  if (!reports) return new Response(null, { status: 400 });
  for (const report of reports) console.info(JSON.stringify(report));
  return new Response(null, { status: 204 });
}
