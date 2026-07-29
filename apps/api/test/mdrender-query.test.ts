import { expect, test } from "vitest";
import { mdrenderQuerySchema } from "@cnode/shared";

test("mdrender query parses explicit false strings", () => {
  expect(mdrenderQuerySchema.parse({}).mdrender).toBe(true);
  expect(mdrenderQuerySchema.parse({ mdrender: "false" }).mdrender).toBe(false);
  expect(mdrenderQuerySchema.parse({ mdrender: "0" }).mdrender).toBe(false);
});

test("mdrender query parses explicit true strings", () => {
  expect(mdrenderQuerySchema.parse({ mdrender: "true" }).mdrender).toBe(true);
  expect(mdrenderQuerySchema.parse({ mdrender: "1" }).mdrender).toBe(true);
});
