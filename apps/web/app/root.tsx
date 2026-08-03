import { Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteLoaderData } from "react-router";
import { Toaster } from "~/components/ui/sonner";
import { NavProgress } from "~/components/NavProgress";
import { useAuthStore } from "~/lib/stores/auth-store";
import { getCurrentUser, apiFetch } from "~/lib/api-client";
import { kvGet, kvSet } from "~/lib/kv-cache";
import { useEffect } from "react";
import packageJson from "../package.json";
import "~/styles/global.css";

export async function loader({ request }: { request: Request }) {
  const cookie = request.headers.get("cookie") || "";
  const user = await getCurrentUser(request);

  const kv = (request as any).cf?.env?.KV;
  const zonesCacheKey = "config:zones";
  const tabsCacheKey = "config:tabs";

  let zones: any[] | null = await kvGet(kv, zonesCacheKey);
  if (!zones) {
    const res = await apiFetch<{ success: boolean; data: any[] }>("/api/v1/zones", { headers: { cookie } });
    zones = res.success ? res.data : [];
    await kvSet(kv, zonesCacheKey, zones, 300);
  }

  let tabs: any[] | null = await kvGet(kv, tabsCacheKey);
  if (!tabs) {
    const res = await apiFetch<{ success: boolean; data: any[] }>("/api/v1/tabs", { headers: { cookie } });
    tabs = res.success ? res.data : [];
    await kvSet(kv, tabsCacheKey, tabs, 300);
  }

  return {
    user,
    zones,
    tabs,
    publicConfig: {
      apiBaseUrl: process.env.CNODE_API_BASE_URL || "https://api.cnodejs.org",
      turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || "",
      build: {
        service: "cnode-web",
        version: packageJson.version,
        commit: process.env.CNODE_GIT_SHA || process.env.GIT_SHA || process.env.COMMIT_SHA || "unknown",
        buildTime: process.env.CNODE_BUILD_TIME || process.env.BUILD_TIME || "unknown",
      },
    },
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData("root") as
    | { publicConfig?: { apiBaseUrl?: string; turnstileSiteKey?: string; build?: Record<string, string> } }
    | undefined;
  const publicConfig = data?.publicConfig || { apiBaseUrl: "https://api.cnodejs.org" };

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#fbfdf7" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var raw=localStorage.getItem('theme');var t='system';if(raw){try{var parsed=JSON.parse(raw);t=parsed&&parsed.state&&parsed.state.theme||raw}catch(e){t=raw}}var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';e.dataset.theme=d?'dark':'light';var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',d?'#071207':'#fbfdf7')}catch(e){}})()`,
          }}
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <NavProgress />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__CNODE_CONFIG__=${JSON.stringify(publicConfig).replace(/</g, "\\u003c")};`,
          }}
        />
        <Scripts />
        <Toaster />
      </body>
    </html>
  );
}

export default function App() {
  const { user } = useRouteLoaderData("root") as { user: any };
  const hydrateFromLoader = useAuthStore((s) => s.hydrateFromLoader);

  useEffect(() => {
    hydrateFromLoader(user || null);
  }, [user, hydrateFromLoader]);

  return <Outlet />;
}
