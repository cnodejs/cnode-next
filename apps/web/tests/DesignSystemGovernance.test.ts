import { readFileSync, readdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const webRoot = process.cwd();

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return [".ts", ".tsx"].includes(extname(path)) ? [path] : [];
  });
}

describe("design system governance", () => {
  it("locks the shadcn registry to Base Nova", () => {
    const config = JSON.parse(readFileSync(resolve(webRoot, "components.json"), "utf8"));
    expect(config.style).toBe("base-nova");
  });

  it("keeps primitive source free of legacy and CNode visual contracts", () => {
    const uiRoot = resolve(webRoot, "app/components/ui");
    for (const file of sourceFiles(uiRoot)) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/cnode-|surface-|new-york|--radix-|\binverse\b/);
    }
  });

  it("keeps routes on semantic tokens and named rhythm", () => {
    const routesRoot = resolve(webRoot, "app/routes");
    for (const file of sourceFiles(routesRoot)) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/cnode-|surface-|brand-(?:ink|on)|shadow-(?:card|floating|brand)|space-[xy]-/);
      expect(source, file).not.toMatch(/(?:bg|text|border|ring)-(?:red|blue|green|emerald|amber|orange|yellow|purple|pink|gray|slate|zinc|neutral)-\d/);
      expect(source, file).not.toMatch(/rounded-(?:2xl|3xl|\[[^\]]+\])/);
    }
  });

  it("does not visually restyle core primitives from routes", () => {
    const primitive = /<(?:Button|Input|Textarea|SelectTrigger|NativeSelect|Card|CardHeader|CardContent|Badge|TabsList|TableRow)\b[\s\S]*?>/g;
    const visual = /className=(?:"[^"]*(?:\bbg-|\bborder-(?!collapse)|\bshadow-|\bring-|\brounded-|\bp[trblxy]?-)"|\{[^}]*(?:\bbg-|\bborder-|\bshadow-|\bring-|\brounded-|\bp[trblxy]?-)\})/;
    for (const file of sourceFiles(resolve(webRoot, "app/routes"))) {
      const source = readFileSync(file, "utf8");
      for (const tag of source.match(primitive) ?? []) {
        expect(tag, `${file}: ${tag}`).not.toMatch(visual);
      }
    }
  });
});
