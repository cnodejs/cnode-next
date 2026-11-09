import { Hono } from "hono";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
import type { AuthVars } from "../src/middleware/auth";

const mocks = vi.hoisted(() => ({
  createScanJob: vi.fn(),
  pauseScanJob: vi.fn(),
  resumeScanJob: vi.fn(),
  runScanJobNow: vi.fn(),
  cancelScanJob: vi.fn(),
  triggerScanDrain: vi.fn(async () => true),
  auditLog: vi.fn(),
}));

vi.mock("../src/lib/db", async (importActual) => {
  const actual = await importActual<typeof import("../src/lib/db")>();
  return {
    ...actual,
    auditQueries: { ...actual.auditQueries, log: mocks.auditLog },
  };
});

vi.mock("../src/lib/moderation-scan", async (importActual) => {
  const actual = await importActual<typeof import("../src/lib/moderation-scan")>();
  return {
    ...actual,
    createScanJob: mocks.createScanJob,
    pauseScanJob: mocks.pauseScanJob,
    resumeScanJob: mocks.resumeScanJob,
    runScanJobNow: mocks.runScanJobNow,
    cancelScanJob: mocks.cancelScanJob,
    triggerScanDrain: mocks.triggerScanDrain,
  };
});

import { adminRoutes } from "../src/routes/admin";

function createAdminApp() {
  const app = new Hono<{ Variables: AuthVars }>();
  app.use("*", async (c, next) => {
    c.set("user", { id: 1, loginname: "admin" } as AuthVars["user"]);
    c.set("isLogin", true);
    c.set("isAdmin", true);
    c.set("isMod", true);
    c.set("roles", []);
    await next();
  });
  app.route("/", adminRoutes);
  return app;
}

async function post(path: string, body?: Record<string, unknown>) {
  return createAdminApp().request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createScanJob.mockResolvedValue({
    id: 41,
    scope: "all",
    mode: "historical",
    reason: "manual",
    status: "pending",
  });
  mocks.runScanJobNow.mockResolvedValue({ id: 41, status: "pending" });
  mocks.cancelScanJob.mockResolvedValue({ id: 41, status: "cancelled" });
});

describe("moderation scan controls in an isolated environment", () => {
  test("creates an all-scope historical scan through the existing admin entry", async () => {
    const response = await post("/admin/moderation/jobs", {
      scope: "all",
      mode: "historical",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { scope: "all", mode: "historical", status: "pending" },
    });
    expect(mocks.createScanJob).toHaveBeenCalledWith({
      scope: "all",
      mode: "historical",
      reason: "manual",
    });
    expect(mocks.triggerScanDrain).toHaveBeenCalledTimes(1);
    expect(mocks.auditLog).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["pause", mocks.pauseScanJob],
    ["resume", mocks.resumeScanJob],
    ["run", mocks.runScanJobNow],
    ["cancel", mocks.cancelScanJob],
  ] as const)("supports the %s control", async (action, operation) => {
    const response = await post(`/admin/moderation/jobs/41/${action}`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(operation).toHaveBeenCalledWith(41);
    expect(mocks.auditLog).toHaveBeenCalledTimes(1);
  });

  test.each(["done", "failed"])("keeps the %s terminal state protected", async (status) => {
    mocks.cancelScanJob.mockResolvedValueOnce({ id: 41, status });
    const response = await post("/admin/moderation/jobs/41/cancel");

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({ success: false });
    expect(mocks.auditLog).not.toHaveBeenCalled();
  });
});
