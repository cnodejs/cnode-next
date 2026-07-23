export async function loader() {
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://cnodejs.org</loc></url></urlset>';
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
