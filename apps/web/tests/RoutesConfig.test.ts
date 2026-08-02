import { matchRoutes } from "react-router";
import { describe, expect, it } from "vitest";
import routes from "../app/routes";

describe("Web route surface", () => {
  it("removes legacy help and short-user routes", () => {
    expect(matchRoutes(routes as any, "/help")).toBeNull();
    expect(matchRoutes(routes as any, "/faq")).toBeNull();
    expect(matchRoutes(routes as any, "/getstart")).toBeNull();
    expect(matchRoutes(routes as any, "/alice")).toBeNull();
  });

  it("keeps the canonical About and user routes", () => {
    expect(matchRoutes(routes as any, "/about")).not.toBeNull();
    expect(matchRoutes(routes as any, "/user/alice")?.at(-1)?.params.name).toBe("alice");
    expect(matchRoutes(routes as any, "/user/alice/topics")?.at(-1)?.params.name).toBe("alice");
    expect(matchRoutes(routes as any, "/user/alice/replies")?.at(-1)?.params.name).toBe("alice");
    expect(matchRoutes(routes as any, "/user/alice/collections")?.at(-1)?.params.name).toBe("alice");
  });
});
