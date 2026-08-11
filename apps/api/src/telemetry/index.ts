import type { Context, TextMapGetter, TextMapPropagator, TextMapSetter } from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";
import { RuntimeNodeInstrumentation } from "@opentelemetry/instrumentation-runtime-node";
import { UndiciInstrumentation } from "@opentelemetry/instrumentation-undici";
import { defaultResource, resourceFromAttributes } from "@opentelemetry/resources";
import {
  BatchLogRecordProcessor,
  type LogRecordExporter,
  type LogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import {
  type IMetricReader,
  PeriodicExportingMetricReader,
  type PushMetricExporter,
} from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  BatchSpanProcessor,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
  type SpanExporter,
  type SpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { parseTelemetryConfig, type TelemetryRole } from "./config";
import { appLog, configureApplicationLogger } from "./logger";
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
  signals: {
    traces: boolean;
    logs: boolean;
    metrics: boolean;
  };
  shutdown(): Promise<void>;
}

export interface TelemetryDependencies {
  exporter?: SpanExporter;
  logExporter?: LogRecordExporter;
  metricExporter?: PushMetricExporter;
  createTraceExporter?: (url: string) => SpanExporter;
  createLogExporter?: (url: string) => LogRecordExporter;
  createMetricExporter?: (url: string) => PushMetricExporter;
  createSdk?: (configuration: ConstructorParameters<typeof NodeSDK>[0]) => NodeSDK;
  diagnostic?: (message: string) => void;
}

const disabledRuntime = (): TelemetryRuntime => ({
  enabled: false,
  signals: { traces: false, logs: false, metrics: false },
  shutdown: async () => undefined,
});

function signalEndpoint(baseEndpoint: string, signal: "traces" | "logs" | "metrics") {
  return `${baseEndpoint.replace(/\/$/, "")}/v1/${signal}`;
}

function postgresOperation(text: string) {
  const operation = text
    .trimStart()
    .match(/^[a-z]+/i)?.[0]
    ?.toLowerCase();
  return operation && /^[a-z]+$/.test(operation) ? operation : "query";
}

export async function initializeTelemetry(
  role: TelemetryRole,
  env: NodeJS.ProcessEnv = process.env,
  dependencies: TelemetryDependencies = {},
): Promise<TelemetryRuntime> {
  configureApplicationLogger(role === "api" ? "cnode-api" : "cnode-moderation-worker");
  const diagnostic =
    dependencies.diagnostic ??
    ((message) =>
      appLog("telemetry.diagnostic", "WARN", {
        "telemetry.signal": "all",
        "telemetry.detail": message,
      }));
  let config;

  try {
    config = parseTelemetryConfig(role, env);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "configuration is invalid";
    diagnostic(`[telemetry] disabled: ${reason}`);
    return disabledRuntime();
  }

  if (!config.enabled) return disabledRuntime();

  for (const [signal, reason] of Object.entries(config.signalErrors)) {
    diagnostic(`[telemetry] ${signal} disabled: ${String(reason)}`);
  }

  try {
    const signals = {
      traces: config.tracesEnabled,
      logs: config.logsEnabled,
      metrics: config.metricsEnabled,
    };
    const spanProcessors: SpanProcessor[] = [];
    const logRecordProcessors: LogRecordProcessor[] = [];
    const metricReaders: IMetricReader[] = [];

    if (signals.traces && config.baseEndpoint) {
      try {
        const url = signalEndpoint(config.baseEndpoint, "traces");
        const exporter =
          dependencies.exporter ??
          dependencies.createTraceExporter?.(url) ??
          new OTLPTraceExporter({ url, timeoutMillis: 2_000 });
        spanProcessors.push(
          new SanitizingSpanProcessor(
            new BatchSpanProcessor(exporter, {
              maxQueueSize: 512,
              maxExportBatchSize: 128,
              scheduledDelayMillis: 1_000,
              exportTimeoutMillis: 2_000,
            }),
          ),
        );
      } catch {
        signals.traces = false;
        diagnostic("[telemetry] traces disabled: exporter initialization failed");
      }
    }
    if (signals.logs && config.baseEndpoint) {
      try {
        const url = signalEndpoint(config.baseEndpoint, "logs");
        const exporter =
          dependencies.logExporter ??
          dependencies.createLogExporter?.(url) ??
          new OTLPLogExporter({ url, timeoutMillis: 2_000 });
        logRecordProcessors.push(
          new BatchLogRecordProcessor({
            exporter,
            maxQueueSize: 512,
            maxExportBatchSize: 128,
            scheduledDelayMillis: 1_000,
            exportTimeoutMillis: 2_000,
          }),
        );
      } catch {
        signals.logs = false;
        diagnostic("[telemetry] logs disabled: exporter initialization failed");
      }
    }
    if (signals.metrics && config.baseEndpoint) {
      try {
        const url = signalEndpoint(config.baseEndpoint, "metrics");
        const exporter =
          dependencies.metricExporter ??
          dependencies.createMetricExporter?.(url) ??
          new OTLPMetricExporter({ url, timeoutMillis: 2_000 });
        metricReaders.push(
          new PeriodicExportingMetricReader({
            exporter,
            exportIntervalMillis: 10_000,
            exportTimeoutMillis: 2_000,
          }),
        );
      } catch {
        signals.metrics = false;
        diagnostic("[telemetry] metrics disabled: exporter initialization failed");
      }
    }

    if (!signals.traces && !signals.logs && !signals.metrics) return disabledRuntime();

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
      spanProcessors,
      logRecordProcessors,
      metricReaders,
      textMapPropagator: new OutboundOnlyTraceContextPropagator(),
      instrumentations: [
        ...(signals.traces
          ? [
              new HttpInstrumentation({
                headersToSpanAttributes: {
                  client: { requestHeaders: [], responseHeaders: [] },
                  server: { requestHeaders: [], responseHeaders: [] },
                },
              }),
            ]
          : []),
        ...(signals.traces
          ? [
              new UndiciInstrumentation({
                headersToSpanAttributes: { requestHeaders: [], responseHeaders: [] },
                requireParentforSpans: true,
              }),
            ]
          : []),
        ...(signals.traces
          ? [
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
            ]
          : []),
        ...(signals.metrics
          ? [new RuntimeNodeInstrumentation({ monitoringPrecision: 5_000 })]
          : []),
      ],
    };
    const sdk = dependencies.createSdk
      ? dependencies.createSdk(sdkConfiguration)
      : new NodeSDK(sdkConfiguration);
    sdk.start();

    return {
      enabled: true,
      signals,
      async shutdown() {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        try {
          const completed = await Promise.race([
            sdk.shutdown().then(() => true),
            new Promise<boolean>((resolve) => {
              timeout = setTimeout(() => resolve(false), SHUTDOWN_TIMEOUT_MS);
              timeout.unref?.();
            }),
          ]);
          if (!completed) diagnostic("[telemetry] shutdown incomplete");
        } catch {
          diagnostic("[telemetry] shutdown incomplete");
        } finally {
          if (timeout) clearTimeout(timeout);
        }
      },
    };
  } catch {
    diagnostic("[telemetry] disabled: SDK initialization failed");
    return disabledRuntime();
  }
}
