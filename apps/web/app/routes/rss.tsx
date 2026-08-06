import { apiFetch } from "~/lib/api-client";

type RssItem = {
  title: string;
  link: string;
  guid: string;
  description: string;
  author: string;
  pubDate: string;
};

type RssSource = {
  title: string;
  link: string;
  language: string;
  description: string;
  items: RssItem[];
};

const fallbackSource: RssSource = {
  title: "CNode：Node.js专业中文社区",
  link: "https://cnodejs.org",
  language: "zh-cn",
  description: "CNode：Node.js专业中文社区",
  items: [],
};

export function cleanXml(value: string) {
  let result = "";
  for (const char of value) {
    const codePoint = char.codePointAt(0) || 0;
    if (
      codePoint === 0x09 ||
      codePoint === 0x0a ||
      codePoint === 0x0d ||
      (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
      (codePoint >= 0xe000 && codePoint <= 0xfffd)
    ) {
      result += char;
    }
  }
  return result;
}

export function escapeXml(value: string | number | null | undefined) {
  return cleanXml(String(value ?? ""))
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absoluteHtmlUrls(html: string, baseUrl: string) {
  return html.replace(/\s(href|src)=(['"])(\/[^/'"][^'"]*)\2/gi, (_match, attr, quote, path) => {
    return ` ${attr}=${quote}${baseUrl.replace(/\/+$/g, "")}${path}${quote}`;
  });
}

export function buildRssXml(source: RssSource) {
  const baseUrl = source.link.replace(/\/+$/g, "");
  const selfUrl = `${baseUrl}/rss`;
  const items = source.items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid>${escapeXml(item.guid)}</guid>
      <description>${escapeXml(absoluteHtmlUrls(item.description, baseUrl))}</description>
      <dc:creator>${escapeXml(item.author)}</dc:creator>
      <pubDate>${escapeXml(item.pubDate)}</pubDate>
    </item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(source.title)}</title>
    <link>${escapeXml(source.link)}</link>
    <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />
    <language>${escapeXml(source.language)}</language>
    <description>${escapeXml(source.description)}</description>
${items ? `${items}\n` : ""}  </channel>
</rss>`;
}

export async function loader() {
  const res = await apiFetch<{ success: boolean; data?: RssSource }>("/api/v1/rss-source").catch(
    () => null,
  );
  const source = res?.success && res.data ? res.data : fallbackSource;
  return new Response(buildRssXml(source), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
