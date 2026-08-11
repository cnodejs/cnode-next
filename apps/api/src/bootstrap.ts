import { pathToFileURL } from "node:url";
import { configureProxy } from "./load-env";
import { initializeTelemetry, type TelemetryRuntime } from "./telemetry/index";
import type { TelemetryRole } from "./telemetry/config";
import { appLog, errorType } from "./telemetry/logger";

interface BootstrapDependencies {
  initialize?: (role: TelemetryRole) => Promise<TelemetryRuntime>;
  configureRuntimeProxy?: () => Promise<void>;
  importTarget?: (role: TelemetryRole) => Promise<unknown>;
  installSignalHandlers?: boolean;
}

function parseRole(value: string | undefined): TelemetryRole {
  if (value === "api" || value === "moderation-worker") return value;
  throw new Error("bootstrap role must be api or moderation-worker");
}

async function importTarget(role: TelemetryRole) {
  return role === "api" ? import("./index") : import("./worker/moderation-scan");
}

function registerShutdown(runtime: TelemetryRuntime) {
  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    appLog("application.stopping", "INFO");
    await runtime.shutdown();
    process.exit(0);
  };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
}

export async function runBootstrap(role: TelemetryRole, dependencies: BootstrapDependencies = {}) {
  const initialize = dependencies.initialize ?? initializeTelemetry;
  const runtime = await initialize(role);

  try {
    await (dependencies.configureRuntimeProxy ?? configureProxy)();
    if (dependencies.installSignalHandlers !== false) registerShutdown(runtime);
    await (dependencies.importTarget ?? importTarget)(role);
  } catch (error) {
    await runtime.shutdown();
    throw error;
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  runBootstrap(parseRole(process.argv[2])).catch((error) => {
    appLog("application.startup.failed", "ERROR", { "error.type": errorType(error) });
    process.exit(1);
  });
}
