import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { REGISTRY } from "~/lib/registry/client";
import CnpmLanding from "~/routes/cnpm";
import CnpmSearch from "~/routes/cnpm.search";
import CnpmPkg from "~/routes/cnpm.pkg";

const manifest = {
  name: "react",
  description: "React is a JavaScript library for building user interfaces.",
  license: "MIT",
  homepage: "https://react.dev",
  "dist-tags": { latest: "19.2.8" },
  versions: {
    "19.2.8": { name: "react", version: "19.2.8", publish_time: 1720000000000 },
    "18.2.0": {
      name: "react",
      version: "18.2.0",
      publish_time: 1660000000000,
      dependencies: { "loose-envify": "^1.1.0" },
    },
  },
  readme: "# React\n\nUsage example",
  maintainers: [{ name: "fb" }],
};

const searchResponse = {
  total: 2,
  objects: [
    { package: { name: "react", version: "19.2.8", description: "A" }, downloads: { all: 100 } },
    { package: { name: "react-dom", version: "19.2.8", description: "B" }, downloads: { all: 90 } },
  ],
};

const stats = { doc_count: 6000000, download: { thisweek: 1000000000, today: 100000000 } };

const downloads = {
  downloads: [
    { day: "2026-07-30", downloads: 10 },
    { day: "2026-07-31", downloads: 12 },
  ],
};

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function renderRoute(element: React.ReactNode, entry: string, path = "*") {
  const router = createMemoryRouter([{ path, element }], { initialEntries: [entry] });
  return render(<RouterProvider router={router} />);
}

describe("cnpm landing", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        if (url === `${REGISTRY}/`) return jsonResponse(stats);
        return jsonResponse({ error: "not found" });
      }),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("renders search box, stats and popular package links", async () => {
    renderRoute(<CnpmLanding />, "/cnpm");

    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "搜索 npm 包" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "react" })).toHaveAttribute("href", "/cnpm/pkg/react");
    expect(await screen.findByText("包数量")).toBeInTheDocument();
    expect(screen.getByText("6m")).toBeInTheDocument();
  });

  it("hides registry stats silently when the stats request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("network down");
      }),
    );

    renderRoute(<CnpmLanding />, "/cnpm");
    await waitFor(() => {
      expect(screen.queryByText("包数量")).not.toBeInTheDocument();
    });
  });
});

describe("cnpm search", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        if (url.includes("/-/v1/search")) return jsonResponse(searchResponse);
        return jsonResponse({ error: "not found" });
      }),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows a keyword empty state without a q parameter", async () => {
    renderRoute(<CnpmSearch />, "/cnpm/search");
    expect(await screen.findByText("输入关键词搜索")).toBeInTheDocument();
  });

  it("renders search result items linking to package pages", async () => {
    renderRoute(<CnpmSearch />, "/cnpm/search?q=react");

    expect(await screen.findByRole("link", { name: "react" })).toHaveAttribute(
      "href",
      "/cnpm/pkg/react",
    );
    expect(screen.getByRole("link", { name: "react-dom" })).toHaveAttribute(
      "href",
      "/cnpm/pkg/react-dom",
    );
    expect(screen.getByText("react-dom")).toBeInTheDocument();
  });

  it("shows a no-result empty state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ total: 0, objects: [] })),
    );
    renderRoute(<CnpmSearch />, "/cnpm/search?q=zzz-not-exist");

    expect(await screen.findByText("未找到相关包")).toBeInTheDocument();
  });
});

describe("cnpm package page", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        if (url === `${REGISTRY}/react`) return jsonResponse(manifest);
        if (url.includes("/downloads/range/")) return jsonResponse(downloads);
        return jsonResponse({ error: "not found" });
      }),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("renders package header, README and download card", async () => {
    renderRoute(<CnpmPkg />, "/cnpm/pkg/react", "cnpm/pkg/*");

    expect(await screen.findByRole("heading", { name: /react/ })).toBeInTheDocument();
    expect(screen.getByText("React is a JavaScript library for building user interfaces.")).toBeInTheDocument();
    expect(await screen.findByText("近 7 天下载")).toBeInTheDocument();
    expect(screen.getByText("Usage example")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /npm install react/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "版本" })).toBeInTheDocument();
  });

  it("shows a 404 hint for missing packages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "not found" }), { status: 404 })),
    );
    renderRoute(<CnpmPkg />, "/cnpm/pkg/not-exist", "cnpm/pkg/*");

    expect(await screen.findByText(/未查询到 not-exist/)).toBeInTheDocument();
  });
});
