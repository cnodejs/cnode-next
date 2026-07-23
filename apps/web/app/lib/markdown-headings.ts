export type MarkdownHeading = {
  id: string;
  depth: 2 | 3;
  text: string;
};

export function slugifyHeading(text: string) {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[`*_~[\]()]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\p{Letter}\p{Number}\-_]+/gu, "")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
}

export function extractMarkdownHeadings(markdown: string): MarkdownHeading[] {
  const seen = new Map<string, number>();
  return markdown
    .split("\n")
    .map((line) => line.match(/^(##|###)\s+(.+)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => {
      const text = match[2].replace(/#+$/, "").trim();
      const base = slugifyHeading(text);
      const count = seen.get(base) || 0;
      seen.set(base, count + 1);
      return {
        id: count ? `${base}-${count + 1}` : base,
        depth: match[1].length as 2 | 3,
        text,
      };
    });
}
