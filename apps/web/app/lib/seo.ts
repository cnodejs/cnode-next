export const SITE_URL = "https://cnodejs.org";
export const SITE_NAME = "CNode";
export const SITE_DESCRIPTION = "Node.js 专业中文社区，技术问答、经验分享、招聘与生态讨论";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/cnode/og.png`;

type SeoOptions = {
  title: string;
  description?: string | null;
  path: string;
  type?: "website" | "article" | "profile";
  image?: string | null;
  ogTitle?: string;
};

export function absoluteUrl(value: string) {
  if (value.startsWith("/")) return `${SITE_URL}${value}`;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : DEFAULT_OG_IMAGE;
  } catch {
    return DEFAULT_OG_IMAGE;
  }
}

export function markdownExcerpt(value?: string | null, length = 140) {
  const plain = (value || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > length ? `${plain.slice(0, length).trimEnd()}...` : plain;
}

export function firstMarkdownImage(value?: string | null) {
  if (!value) return null;
  const markdown = value.match(
    /!\[[^\]]*\]\(\s*<?(https:\/\/[^\s)>]+|\/[^\s)>]+)>?(?:\s+["'][^"']*["'])?\s*\)/i,
  )?.[1];
  if (markdown) return absoluteUrl(markdown);
  const html = value.match(/<img\b[^>]*\bsrc=["'](https:\/\/[^"']+|\/[^"']+)["'][^>]*>/i)?.[1];
  return html ? absoluteUrl(html) : null;
}

export function seoMeta({
  title,
  description = SITE_DESCRIPTION,
  path,
  type = "website",
  image,
  ogTitle = title,
}: SeoOptions) {
  const canonical = absoluteUrl(path);
  const imageUrl = image ? absoluteUrl(image) : DEFAULT_OG_IMAGE;
  const summary = description || SITE_DESCRIPTION;

  return [
    { title },
    { name: "description", content: summary },
    { tagName: "link" as const, rel: "canonical", href: canonical },
    { property: "og:type", content: type },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: ogTitle },
    { property: "og:description", content: summary },
    { property: "og:url", content: canonical },
    { property: "og:image", content: imageUrl },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: ogTitle },
    { name: "twitter:description", content: summary },
    { name: "twitter:image", content: imageUrl },
  ];
}

export function discussionForumPostingJsonLd(topic: {
  id: string;
  title: string;
  content?: string | null;
  author?: { loginname?: string | null } | null;
  create_at?: string | null;
  last_reply_at?: string | null;
  reply_count?: number | null;
  image?: string | null;
}) {
  const url = `${SITE_URL}/topic/${encodeURIComponent(topic.id)}`;
  return {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: topic.title,
    articleBody: markdownExcerpt(topic.content, 500),
    url,
    mainEntityOfPage: url,
    image: topic.image
      ? absoluteUrl(topic.image)
      : firstMarkdownImage(topic.content) || DEFAULT_OG_IMAGE,
    author: {
      "@type": "Person",
      name: topic.author?.loginname || "CNode 用户",
    },
    ...(topic.create_at ? { datePublished: topic.create_at } : {}),
    ...(topic.last_reply_at ? { dateModified: topic.last_reply_at } : {}),
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/CommentAction",
      userInteractionCount: topic.reply_count || 0,
    },
  };
}
