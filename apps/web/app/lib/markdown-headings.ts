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
  return extractHeadingEntries(markdown).map(({ line: _line, ...heading }) => heading);
}

export function markdownHeadingIdsByLine(markdown: string) {
  return new Map(extractHeadingEntries(markdown).map(({ line, id }) => [line, id]));
}

function extractHeadingEntries(markdown: string): Array<MarkdownHeading & { line: number }> {
  const seen = new Map<string, number>();
  return markdown
    .split("\n")
    .map((line, index) => {
      const markdownMatch = line.match(/^(##|###)\s+(.+)\r?$/);
      const htmlMatch = line.match(/^\s*<h([23])(?:\s[^>]*)?>(.*?)<\/h\1>\s*\r?$/i);
      if (!markdownMatch && !htmlMatch) return null;
      return {
        line: index + 1,
        depth: Number(htmlMatch?.[1] ?? markdownMatch![1].length) as 2 | 3,
        text: (htmlMatch?.[2] ?? markdownMatch![2])
          .replace(/<[^>]+>/g, "")
          .replace(/#+$/, "")
          .trim(),
      };
    })
    .filter((heading): heading is { line: number; depth: 2 | 3; text: string } => Boolean(heading))
    .map(({ line, depth, text }) => {
      const base = slugifyHeading(text);
      const count = seen.get(base) || 0;
      seen.set(base, count + 1);
      return {
        line,
        id: count ? `${base}-${count + 1}` : base,
        depth,
        text,
      };
    });
}
