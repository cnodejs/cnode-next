import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vite-plus/test";

const css = readFileSync(resolve(process.cwd(), "app/styles/global.css"), "utf8");

describe("Base Nova semantic theme", () => {
  it("declares complete core, chart and sidebar token families", () => {
    for (const token of [
      "background",
      "foreground",
      "card",
      "card-foreground",
      "popover",
      "popover-foreground",
      "primary",
      "primary-foreground",
      "secondary",
      "secondary-foreground",
      "muted",
      "muted-foreground",
      "accent",
      "accent-foreground",
      "destructive",
      "border",
      "input",
      "ring",
      "chart-1",
      "chart-2",
      "chart-3",
      "chart-4",
      "chart-5",
      "sidebar",
      "sidebar-foreground",
      "sidebar-primary",
      "sidebar-primary-foreground",
      "sidebar-accent",
      "sidebar-accent-foreground",
      "sidebar-border",
      "sidebar-ring",
    ]) {
      expect(css).toContain(`--${token}:`);
      expect(css).toContain(`--color-${token}: var(--${token})`);
    }
  });

  it("uses the Nova radius and dark alpha boundaries", () => {
    expect(css).toContain("--radius: 0.625rem");
    expect(css).toContain("--radius-4xl: calc(var(--radius) * 2.6)");
    expect(css).toContain("--border: oklch(1 0 0 / 10%)");
    expect(css).toContain("--input: oklch(1 0 0 / 15%)");
  });

  it("exposes only semantic and exceptional brand roles", () => {
    expect(css).not.toMatch(/--color-(?:cnode|surface|brand-(?:ink|on)|shadow)/);
    expect(css).toContain("--color-brand: var(--brand)");
    expect(css).toContain("--color-brand-foreground: var(--brand-foreground)");
    expect(css).toContain("--color-brand-accent: var(--brand-accent)");
  });
});
