import { describe, expect, it } from "vitest";
import { buildRssXml } from "~/routes/rss";

describe("rss route", () => {
  it("builds RSS XML with escaped item fields", () => {
    const xml = buildRssXml({
      title: "CNode：Node.js专业中文社区",
      link: "https://cnodejs.org",
      language: "zh-cn",
      description: "CNode：Node.js专业中文社区",
      items: [
        {
          title: "A <B> & C",
          link: "https://cnodejs.org/topic/1",
          guid: "https://cnodejs.org/topic/1",
          description: "<p>Hello & welcome</p>",
          author: "foo",
          pubDate: "Wed, 29 Jul 2026 17:00:00 GMT",
        },
      ],
    });

    expect(xml).toContain('<rss version="2.0">');
    expect(xml).toContain("<item>");
    expect(xml).toContain("A &lt;B&gt; &amp; C");
    expect(xml).toContain("&lt;p&gt;Hello &amp; welcome&lt;/p&gt;");
  });
});
