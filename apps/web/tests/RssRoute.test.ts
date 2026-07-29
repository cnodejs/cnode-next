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
          description: '<p><a href="/topic/1">Hello & welcome</a><img src="/avatar.png" /></p>',
          author: "foo",
          pubDate: "Wed, 29 Jul 2026 17:00:00 GMT",
        },
      ],
    });

    expect(xml).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
    expect(xml).toContain('xmlns:dc="http://purl.org/dc/elements/1.1/"');
    expect(xml).toContain('<atom:link href="https://cnodejs.org/rss" rel="self" type="application/rss+xml" />');
    expect(xml).toContain("<item>");
    expect(xml).toContain("A &lt;B&gt; &amp; C");
    expect(xml).toContain('&lt;a href=&quot;https://cnodejs.org/topic/1&quot;&gt;Hello &amp; welcome&lt;/a&gt;');
    expect(xml).toContain('src=&quot;https://cnodejs.org/avatar.png&quot;');
    expect(xml).toContain("<dc:creator>foo</dc:creator>");
    expect(xml).not.toContain("<author>foo</author>");
  });
});
