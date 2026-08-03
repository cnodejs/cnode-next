import { describe, expect, it } from "vitest";

type Pair = [name: string, foreground: string, background: string, minimum: number];

const lightPairs: Pair[] = [
  ["body", "#10210c", "#fbfdf7", 4.5],
  ["muted", "#66715d", "#fbfdf7", 4.5],
  ["link", "#4f7300", "#fbfdf7", 4.5],
  ["destructive", "#fff7f7", "#dc2626", 4.5],
  ["focus ring", "#4f7300", "#fbfdf7", 3],
  ["border", "#7f9070", "#fbfdf7", 3],
  ["brand button", "#ffffff", "#10210c", 4.5],
];

const darkPairs: Pair[] = [
  ["body", "#edf8e7", "#071207", 4.5],
  ["muted", "#9eb092", "#071207", 4.5],
  ["link", "#9de330", "#071207", 4.5],
  ["destructive", "#fff7f7", "#dc2626", 4.5],
  ["focus ring", "#9de330", "#071207", 3],
  ["border", "#526b48", "#071207", 3],
  ["brand button", "#071207", "#9de330", 4.5],
];

function luminance(hex: string) {
  const [r, g, b] = hex
    .replace("#", "")
    .match(/.{2}/g)!
    .map((channel) => {
      const value = Number.parseInt(channel, 16) / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe("theme token contrast", () => {
  it.each([...lightPairs, ...darkPairs])("keeps %s above WCAG minimum", (_name, foreground, background, minimum) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(minimum);
  });
});
