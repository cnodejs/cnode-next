import { describe, expect, it } from "vite-plus/test";
import { getAvatarUrl } from "~/lib/brand";
import {
  DEFAULT_OG_IMAGE,
  discussionForumPostingJsonLd,
  firstMarkdownImage,
  markdownExcerpt,
  seoMeta,
} from "~/lib/seo";

describe("SEO metadata", () => {
  it("builds canonical Open Graph and Twitter metadata", () => {
    const meta = seoMeta({
      title: "测试 · CNode",
      description: "测试描述",
      path: "/topic/1",
      type: "article",
    });
    expect(meta).toContainEqual({
      tagName: "link",
      rel: "canonical",
      href: "https://cnodejs.org/topic/1",
    });
    expect(meta).toContainEqual({ property: "og:image", content: DEFAULT_OG_IMAGE });
    expect(meta).toContainEqual({ name: "twitter:card", content: "summary_large_image" });
  });

  it("cleans Markdown and extracts only secure images", () => {
    expect(markdownExcerpt("# 标题\n\n[链接](https://example.com) **正文**")).toBe(
      "标题 链接 正文",
    );
    expect(firstMarkdownImage("![图](https://static.example.com/a.png)")).toBe(
      "https://static.example.com/a.png",
    );
    expect(firstMarkdownImage("![图](http://static.example.com/a.png)")).toBeNull();
  });

  it("builds DiscussionForumPosting JSON-LD", () => {
    const value = discussionForumPostingJsonLd({
      id: "1",
      title: "测试话题",
      content: "正文",
      author: { loginname: "tester" },
      create_at: "2026-08-04T00:00:00.000Z",
      reply_count: 3,
    });
    expect(value).toMatchObject({
      "@type": "DiscussionForumPosting",
      headline: "测试话题",
      author: { name: "tester" },
      interactionStatistic: { userInteractionCount: 3 },
    });
  });
});

describe("avatar metadata safety", () => {
  it("upgrades legacy Gravatar URLs without rewriting unrelated hosts", () => {
    expect(getAvatarUrl("http://www.gravatar.com/avatar/hash?size=48")).toBe(
      "https://www.gravatar.com/avatar/hash?size=48",
    );
    expect(getAvatarUrl("http://images.example.com/avatar.png")).toBe(
      "http://images.example.com/avatar.png",
    );
  });
});
