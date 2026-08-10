import { describe, expect, test, vi } from "vite-plus/test";
import { runBootstrap } from "../src/bootstrap";
import { initializeTelemetry } from "../src/telemetry/index";

describe("telemetry bootstrap", () => {
  test.each([
    ["api", "cnode-api"],
    ["moderation-worker", "cnode-moderation-worker"],
  ] as const)("initializes %s before proxy and target imports", async (role, serviceName) => {
    const events: string[] = [];
    await runBootstrap(role, {
      initialize: async (selectedRole) => {
        events.push(`telemetry:${selectedRole}:${serviceName}`);
        return { enabled: true, shutdown: vi.fn(async () => undefined) };
      },
      configureRuntimeProxy: async () => {
        events.push("proxy");
      },
      importTarget: async () => {
        events.push("target");
      },
      installSignalHandlers: false,
    });

    expect(events).toEqual([`telemetry:${role}:${serviceName}`, "proxy", "target"]);
  });

  test("keeps startup fail-open when telemetry config is invalid", async () => {
    const diagnostics: string[] = [];
    const runtime = await initializeTelemetry(
      "api",
      { CNODE_OTEL_ENABLED: "1" },
      { diagnostic: (message) => diagnostics.push(message) },
    );

    expect(runtime.enabled).toBe(false);
    expect(diagnostics).toEqual([
      "[telemetry] disabled: CNODE_OTEL_EXPORTER_OTLP_ENDPOINT is required",
    ]);
  });

  test("keeps startup fail-open when SDK initialization throws", async () => {
    const diagnostics: string[] = [];
    const runtime = await initializeTelemetry(
      "api",
      {
        CNODE_OTEL_ENABLED: "1",
        CNODE_OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector:4318/v1/traces",
      },
      {
        createSdk: () => {
          throw new Error("private initialization detail");
        },
        diagnostic: (message) => diagnostics.push(message),
      },
    );

    expect(runtime.enabled).toBe(false);
    expect(diagnostics).toEqual(["[telemetry] disabled: SDK initialization failed"]);
    expect(JSON.stringify(diagnostics)).not.toContain("private initialization detail");
  });
});
