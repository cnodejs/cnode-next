import { afterEach, describe, expect, it } from "vite-plus/test";
import { applyResolvedTheme } from "~/lib/stores/theme-store";

describe("theme system integration", () => {
  afterEach(() => {
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "";
    document.querySelector('meta[name="theme-color"]')?.remove();
  });

  it.each([
    [false, "light", "#fbfdf7"],
    [true, "dark", "#071207"],
  ] as const)("synchronizes the %s resolved theme with browser chrome", (dark, theme, color) => {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.append(meta);

    applyResolvedTheme(dark);

    expect(document.documentElement.classList.contains("dark")).toBe(dark);
    expect(document.documentElement).toHaveAttribute("data-theme", theme);
    expect(document.documentElement.style.colorScheme).toBe(theme);
    expect(meta).toHaveAttribute("content", color);
  });
});
