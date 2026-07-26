export async function loader() {
  const body = `# See http://www.robotstxt.org/robotstxt.html for documentation on how to use the robots.txt file
#
# To ban all spiders from the entire site uncomment the next two lines:
# User-Agent: *
# Disallow: /
`;

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
