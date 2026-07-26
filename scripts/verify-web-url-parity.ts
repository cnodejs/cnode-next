const webBase = process.env.APP_WEB_BASE_URL || "http://localhost:5173";

type Check = {
  path: string;
  kind: "page" | "redirect" | "text" | "xml";
};

const checks: Check[] = [
  { path: "/", kind: "page" },
  { path: "/about", kind: "page" },
  { path: "/faq", kind: "page" },
  { path: "/getstart", kind: "page" },
  { path: "/api", kind: "page" },
  { path: "/search", kind: "page" },
  { path: "/signin", kind: "page" },
  { path: "/signup", kind: "page" },
  { path: "/stars", kind: "page" },
  { path: "/users/top100", kind: "page" },
  { path: "/robots.txt", kind: "text" },
  { path: "/rss", kind: "xml" },
  { path: "/sitemap.xml", kind: "xml" },
  { path: "/app/download", kind: "redirect" },
  { path: "/cnodejs", kind: "redirect" },
];

async function checkUrl(check: Check) {
  const response = await fetch(`${webBase}${check.path}`, { redirect: "manual" });
  if (check.kind === "redirect") {
    if (response.status < 300 || response.status >= 400) {
      throw new Error(`${check.path} expected redirect, got ${response.status}`);
    }
    return;
  }

  if (!response.ok) throw new Error(`${check.path} returned ${response.status}`);
  const contentType = response.headers.get("content-type") || "";
  if (check.kind === "text" && !contentType.includes("text/plain")) {
    throw new Error(`${check.path} expected text/plain, got ${contentType}`);
  }
  if (check.kind === "xml" && !contentType.includes("xml")) {
    throw new Error(`${check.path} expected XML, got ${contentType}`);
  }
}

async function main() {
  for (const check of checks) {
    await checkUrl(check);
  }
  console.log("web URL parity smoke passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
