import type { Context } from "@opentelemetry/api";
import type { ReadableSpan, Span, SpanProcessor } from "@opentelemetry/sdk-trace-base";

const blockedAttributePatterns = [
  /authorization/i,
  /cookie/i,
  /session/i,
  /token/i,
  /password/i,
  /secret/i,
  /credential/i,
  /^url\.(?:full|query)$/i,
  /^http\.url$/i,
  /^db\.statement$/i,
  /^db\.query\.text$/i,
  /query.*param/i,
  /connection.*string/i,
  /^db\.user(?:\.name)?$/i,
  /(?:request|response|mail|email|message|topic|reply|user).*body/i,
  /user.*content/i,
  /content.*preview/i,
  /moderation.*preview/i,
  /sensitive.*word/i,
  /^exception\.(?:message|stacktrace)$/i,
];

export function isBlockedTelemetryAttribute(key: string) {
  return blockedAttributePatterns.some((pattern) => pattern.test(key));
}

function sanitizeAttributes(attributes: Record<string, unknown> | undefined) {
  if (!attributes) return;
  for (const key of Object.keys(attributes)) {
    if (isBlockedTelemetryAttribute(key)) delete attributes[key];
  }
}

export function sanitizeSpan(span: ReadableSpan) {
  sanitizeAttributes(span.attributes);
  for (const event of span.events) sanitizeAttributes(event.attributes);
  for (const link of span.links) sanitizeAttributes(link.attributes);
}

export class SanitizingSpanProcessor implements SpanProcessor {
  constructor(private readonly delegate: SpanProcessor) {}

  onStart(span: Span, parentContext: Context) {
    this.delegate.onStart(span, parentContext);
  }

  onEnd(span: ReadableSpan) {
    sanitizeSpan(span);
    this.delegate.onEnd(span);
  }

  forceFlush() {
    return this.delegate.forceFlush();
  }

  shutdown() {
    return this.delegate.shutdown();
  }
}
