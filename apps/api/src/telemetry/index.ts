import type {
  Context,
  TextMapGetter,
  TextMapPropagator,
  TextMapSetter,
} from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";
import { UndiciInstrumentation } from "@opentelemetry/instrumentation-undici";
import { defaultResource, resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  BatchSpanProcessor,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
  type SpanExporter,
} from "@opentelemetry/sdk-trace-base";
import { parseTelemetryConfig, type TelemetryRole } from "./config";
import { SanitizingSpanProcessor } from "./sanitize";

const SHUTDOWN_TIMEOUT_MS = 3_000;

export class OutboundOnlyTraceContextPropagator implements TextMapPropagator {
  private readonly delegate = new W3CTraceContextPropagator();

  inject(context: Context, carrier: unknown, setter: TextMapSetter) {
    this.delegate.inject(context, carrier, setter);
  }

  extract(context: Context, _carrier: unknown, _getter: TextMapGetter) {
    return context;
  }

  fields() {
    return this.delegate.fields();
  }
}

export interface TelemetryRuntime {
  enabled: boolean;
  shutdown(): Promise<void>;
}

export interface TelemetryDependencies {
  exporter?: SpanExporter;
  createSdk?: (configuration: ConstructorParameters<typeof NodeSDK>[0]) => NodeSDK;
  diagnostic?: (message: string) => void;
}

function postgresOperation(text: string) {
  const operation = text.trimStart().match(/^[a-z]+/i)?.[0]?.toLowerCase();
  return operation && /^[a-z]+$/.test(operation) ? operation : "query";
}

export async function initializeTelemetry(
  role: TelemetryRole,
  env: NodeJS.ProcessEnv = process.env,
  dependencies: TelemetryDependencies = {},
): Promise<TelemetryRuntime> {
  const diagnostic = dependencies.diagnostic ?? ((message) => console.warn(message));
  let config;

  try {
    config = parseTelemetryConfig(role, env);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "configuration is invalid";
    diagnostic(`[telemetry] disabled: ${reason}`);
    return { enabled: false, shutdown: async () => undefined };
  }

  if (!config.enabled) return { enabled: false, shutdown: async () => undefined };

  try {
    const exporter =
      dependencies.exporter ??
      new OTLPTraceExporter({
        url: config.endpoint,
        timeoutMillis: 2_000,
      });
    const batchProcessor = new BatchSpanProcessor(exporter, {
      maxQueueSize: 512,
      maxExportBatchSize: 128,
      scheduledDelayMillis: 1_000,
      exportTimeoutMillis: 2_000,
    });
    const sdkConfiguration: ConstructorParameters<typeof NodeSDK>[0] = {
      autoDetectResources: false,
      resource: defaultResource().merge(
        resourceFromAttributes({
          "service.name": config.serviceName,
          "service.version": config.serviceVersion,
          "vcs.ref.head.revision": config.commitRevision,
          "deployment.environment.name": config.deploymentEnvironment,
        }),
      ),
      sampler: new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(config.sampleRatio),
      }),
      spanProcessors: [new SanitizingSpanProcessor(batchProcessor)],
      textMapPropagator: new OutboundOnlyTraceContextPropagator(),
      instrumentations: [
        new HttpInstrumentation({
          headersToSpanAttributes: {
            client: { requestHeaders: [], responseHeaders: [] },
            server: { requestHeaders: [], responseHeaders: [] },
          },
        }),
        new UndiciInstrumentation({
          headersToSpanAttributes: { requestHeaders: [], responseHeaders: [] },
          requireParentforSpans: true,
        }),
        new PgInstrumentation({
          enhancedDatabaseReporting: false,
          addSqlCommenterCommentToQueries: false,
          enableTraceContextPropagation: false,
          requireParentSpan: true,
          requestHook(span, { query }) {
            const operation = postgresOperation(query.text);
            span.updateName(`postgresql.${operation}`);
            span.setAttribute("db.operation.name", operation);
          },
        }),
      ],
    };
    const sdk = dependencies.createSdk
      ? dependencies.createSdk(sdkConfiguration)
      : new NodeSDK(sdkConfiguration);
    sdk.start();

    return {
      enabled: true,
      async shutdown() {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        try {
          await Promise.race([
            sdk.shutdown(),
            new Promise<void>((resolve) => {
              timeout = setTimeout(resolve, SHUTDOWN_TIMEOUT_MS);
              timeout.unref?.();
            }),
          ]);
        } catch {
          diagnostic("[telemetry] shutdown incomplete");
        } finally {
          if (timeout) clearTimeout(timeout);
        }
      },
    };
  } catch {
    diagnostic("[telemetry] disabled: SDK initialization failed");
    return { enabled: false, shutdown: async () => undefined };
  }
}
