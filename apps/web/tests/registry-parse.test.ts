import { describe, expect, it } from "vite-plus/test";
import {
  createReadmeUrlResolver,
  formatBytes,
  formatCompactNumber,
  normalizeVersionSpec,
  parsePkgPath,
  repoUrl,
  rewriteReadmeUrls,
  safeExternalUrl,
  sortVersions,
} from "~/lib/registry/parse";
import type { RegistryVersion } from "~/lib/registry/types";

describe("parsePkgPath", () => {
  it("解析普通包名且无 tab", () => {
    expect(parsePkgPath("react")).toEqual({ name: "react", tab: "home" });
  });

  it("解析普通包名与 tab", () => {
    expect(parsePkgPath("react/versions")).toEqual({ name: "react", tab: "versions" });
    expect(parsePkgPath("react/files")).toEqual({ name: "react", tab: "files" });
    expect(parsePkgPath("react/deps")).toEqual({ name: "react", tab: "deps" });
    expect(parsePkgPath("react/trends")).toEqual({ name: "react", tab: "trends" });
  });

  it("未知 tab 回退 home", () => {
    expect(parsePkgPath("react/whatever")).toEqual({ name: "react", tab: "home" });
  });

  it("解析 scoped 包", () => {
    expect(parsePkgPath("@babel/core")).toEqual({ name: "@babel/core", tab: "home" });
    expect(parsePkgPath("@babel/core/versions")).toEqual({
      name: "@babel/core",
      tab: "versions",
    });
  });

  it("缺少 name 返回空 name", () => {
    expect(parsePkgPath(undefined)).toEqual({ tab: "home" });
    expect(parsePkgPath("")).toEqual({ tab: "home" });
    expect(parsePkgPath("@babel")).toEqual({ tab: "home" });
  });
});

describe("normalizeVersionSpec", () => {
  it("* 归一化为 latest", () => {
    expect(normalizeVersionSpec("*")).toBe("latest");
  });

  it("undefined 归一化为 latest", () => {
    expect(normalizeVersionSpec(undefined)).toBe("latest");
  });

  it("普通版本保持不变", () => {
    expect(normalizeVersionSpec("1.2.3")).toBe("1.2.3");
  });
});

describe("sortVersions", () => {
  it("按发布时间倒序", () => {
    const versions: Record<string, RegistryVersion> = {
      "1.0.0": { name: "pkg", version: "1.0.0", publish_time: 1000 },
      "2.0.0": { name: "pkg", version: "2.0.0", publish_time: 3000 },
      "1.1.0": { name: "pkg", version: "1.1.0", publish_time: 2000 },
    };
    expect(sortVersions(versions).map((v) => v.version)).toEqual(["2.0.0", "1.1.0", "1.0.0"]);
  });

  it("缺失时间排到最后", () => {
    const versions: Record<string, RegistryVersion> = {
      "1.0.0": { name: "pkg", version: "1.0.0", publish_time: 1000 },
      "0.0.1": { name: "pkg", version: "0.0.1", _cnpmcore_publish_time: "0" },
    };
    expect(sortVersions(versions).map((v) => v.version)).toEqual(["1.0.0", "0.0.1"]);
  });
});

describe("formatBytes", () => {
  it("格式化字节", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(undefined)).toBe("-");
  });
});

describe("formatCompactNumber", () => {
  it("紧凑数字", () => {
    expect(formatCompactNumber(999)).toBe("999");
    expect(formatCompactNumber(1500)).toBe("1.5k");
    expect(formatCompactNumber(2_500_000)).toBe("2.5m");
    expect(formatCompactNumber(undefined)).toBe("-");
  });
});

describe("repoUrl", () => {
  it("规范化常见仓库地址", () => {
    expect(repoUrl("git+https://github.com/foo/bar.git")).toBe("https://github.com/foo/bar");
    expect(repoUrl("git+ssh://git@github.com/foo/bar.git")).toBe(
      "https://github.com/foo/bar",
    );
    expect(repoUrl("git://github.com/foo/bar.git")).toBe("https://github.com/foo/bar");
    expect(repoUrl({ url: "https://github.com/foo/bar" })).toBe(
      "https://github.com/foo/bar",
    );
  });

  it("无法识别的地址返回 undefined", () => {
    expect(repoUrl(undefined)).toBeUndefined();
    expect(repoUrl("")).toBeUndefined();
    expect(repoUrl("svn://example.com/foo")).toBeUndefined();
  });
});

describe("safeExternalUrl", () => {
  it("允许 https 和 http 地址", () => {
    expect(safeExternalUrl("https://example.com")).toBe("https://example.com");
    expect(safeExternalUrl("http://example.com")).toBe("http://example.com");
  });

  it("拒绝非 http(s) 协议", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeExternalUrl("data:text/html,<h1>x</h1>")).toBeUndefined();
    expect(safeExternalUrl("ftp://example.com")).toBeUndefined();
  });

  it("无效或空地址返回 undefined", () => {
    expect(safeExternalUrl(undefined)).toBeUndefined();
    expect(safeExternalUrl("not-a-url")).toBeUndefined();
  });
});

describe("createReadmeUrlResolver", () => {
  const repo = { type: "git", url: "git+https://github.com/koajs/koa.git" };
  const resolve = createReadmeUrlResolver(repo, "koa", "3.2.1");

  it("将图片相对路径指向 GitHub raw", () => {
    expect(resolve("/docs/logo.png", "image")).toBe(
      "https://github.com/koajs/koa/raw/HEAD/docs/logo.png",
    );
    expect(resolve("./docs/logo.png", "image")).toBe(
      "https://github.com/koajs/koa/raw/HEAD/docs/logo.png",
    );
    expect(resolve("docs/logo.png", "image")).toBe(
      "https://github.com/koajs/koa/raw/HEAD/docs/logo.png",
    );
  });

  it("将链接相对路径指向 GitHub blob", () => {
    expect(resolve("docs/guide.md", "link")).toBe(
      "https://github.com/koajs/koa/blob/HEAD/docs/guide.md",
    );
    expect(resolve("../docs/guide.md", "link")).toBe(
      "https://github.com/koajs/koa/blob/HEAD/docs/guide.md",
    );
  });

  it("保留绝对地址与锚点", () => {
    expect(resolve("https://example.com/image.png", "image")).toBe(
      "https://example.com/image.png",
    );
    expect(resolve("mailto:hi@example.com", "link")).toBe("mailto:hi@example.com");
    expect(resolve("#backers", "link")).toBe("#backers");
    expect(resolve("", "image")).toBe("");
  });

  it("仓库非 GitHub 时回退到 registry 文件地址", () => {
    const fallback = createReadmeUrlResolver(
      { type: "git", url: "git+https://gitlab.com/foo/bar.git" },
      "foo",
      "1.0.0",
    );
    expect(fallback("docs/guide.md", "link")).toBe(
      "https://registry.npmmirror.com/foo/1.0.0/files/docs/guide.md",
    );
  });
});

describe("rewriteReadmeUrls", () => {
  const repo = { type: "git", url: "git+https://github.com/koajs/koa.git" };
  const resolve = createReadmeUrlResolver(repo, "koa", "3.2.1");

  it("重写 Markdown 图片与链接的相对地址", () => {
    const input = '![logo](/docs/logo.png)\n\n[guide](docs/guide.md)\n\n[home](https://koajs.com)';
    const output = rewriteReadmeUrls(input, resolve);

    expect(output).toContain(
      "![logo](https://github.com/koajs/koa/raw/HEAD/docs/logo.png)",
    );
    expect(output).toContain(
      "[guide](https://github.com/koajs/koa/blob/HEAD/docs/guide.md)",
    );
    expect(output).toContain("[home](https://koajs.com)");
  });

  it("重写 HTML 图片与链接的相对地址", () => {
    const input = '<img src="/docs/logo.png" alt="Koa"/>\n\n<a href="docs/guide.md">guide</a>';
    const output = rewriteReadmeUrls(input, resolve);

    expect(output).toContain(
      '<img src="https://github.com/koajs/koa/raw/HEAD/docs/logo.png" alt="Koa"/>',
    );
    expect(output).toContain(
      '<a href="https://github.com/koajs/koa/blob/HEAD/docs/guide.md">guide</a>',
    );
  });

  it("不修改代码块内的地址", () => {
    const input = '```sh\nnpm i -g pnpm\n```\n\n![diagram](https://example.com/a.png)';
    const output = rewriteReadmeUrls(input, resolve);

    expect(output).toContain("npm i -g pnpm");
    expect(output).toContain("https://example.com/a.png");
  });
});
