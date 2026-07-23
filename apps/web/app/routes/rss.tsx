export async function loader() {
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>CNode</title><link>https://cnodejs.org</link><description>Node.js 专业中文社区</description></channel></rss>';
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
