import { context, SpanKind, trace, TraceFlags } from "@opentelemetry/api";
import {
  InMemorySpanExporter,
  ParentBasedSampler,
  SamplingDecision,
  TraceIdRatioBasedSampler,
} from "@opentelemetry/sdk-trace-base";
import { describe, expect, test, vi } from "vite-plus/test";
import {
  initializeTelemetry,
  OutboundOnlyTraceContextPropagator,
} from "../src/telemetry/index";

describe("telemetry SDK configuration", () => {
  test("builds stable role resources without request-scoped values", async () => {
    let configuration: any;
    const start = vi.fn();
    const shutdown = vi.fn(async () => undefined);
    const runtime = await initializeTelemetry(
      "moderation-worker",
      {
        CNODE_OTEL_ENABLED: "1",
        CNODE_OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector:4318/v1/traces",
        CNODE_OTEL_TRACE_SAMPLE_RATIO: "1",
        CNODE_ENV: "test",
        CNODE_GIT_SHA: "abc123",
      },
      {
        exporter: new InMemorySpanExporter(),
        createSdk: (value) => {
          configuration = value;
          return { start, shutdown } as any;
        },
      },
    );

    expect(runtime.enabled).toBe(true);
    expect(start).toHaveBeenCalledOnce();
    expect(configuration.resource.attributes).toMatchObject({
      "service.name": "cnode-moderation-worker",
      "service.version": "0.1.0",
      "vcs.ref.head.revision": "abc123",
      "deployment.environment.name": "test",
    });
    expect(configuration.resource.attributes).not.toHaveProperty("cnode.request.id");
    await runtime.shutdown();
    expect(shutdown).toHaveBeenCalledOnce();
  });

  test("keeps public trace context out while preserving outbound injection", () => {
    const propagator = new OutboundOnlyTraceContextPropagator();
    const incoming = {
      traceparent: "00-11111111111111111111111111111111-2222222222222222-01",
    };
    const extracted = propagator.extract(context.active(), incoming, {
      get: (carrier, key) => (carrier as Record<string, string>)[key],
      keys: (carrier) => Object.keys(carrier as object),
    });
    expect(trace.getSpanContext(extracted)).toBeUndefined();

    const local = trace.setSpanContext(context.active(), {
      traceId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      spanId: "bbbbbbbbbbbbbbbb",
      traceFlags: TraceFlags.SAMPLED,
    });
    const carrier: Record<string, string> = {};
    propagator.inject(local, carrier, {
      set: (target, key, value) => {
        (target as Record<string, string>)[key] = String(value);
      },
    });
    expect(carrier.traceparent).toContain("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  test("inherits local parent decisions and honors deterministic root ratios", () => {
    const traceId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const sampledParent = trace.setSpanContext(context.active(), {
      traceId,
      spanId: "bbbbbbbbbbbbbbbb",
      traceFlags: TraceFlags.SAMPLED,
    });
    const unsampledParent = trace.setSpanContext(context.active(), {
      traceId,
      spanId: "cccccccccccccccc",
      traceFlags: TraceFlags.NONE,
    });
    const sampler = new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(0) });
    const sample = (parentContext: typeof sampledParent) =>
      sampler.shouldSample(parentContext, traceId, "child", SpanKind.INTERNAL, {}, []);

    expect(sample(sampledParent).decision).toBe(SamplingDecision.RECORD_AND_SAMPLED);
    expect(sample(unsampledParent).decision).toBe(SamplingDecision.NOT_RECORD);
    expect(
      new TraceIdRatioBasedSampler(0).shouldSample(context.active(), traceId).decision,
    ).toBe(SamplingDecision.NOT_RECORD);
    expect(
      new TraceIdRatioBasedSampler(1).shouldSample(context.active(), traceId).decision,
    ).toBe(SamplingDecision.RECORD_AND_SAMPLED);
  });
});
