import { Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteLoaderData } from "react-router";
import { Toaster } from "~/components/ui/sonner";
import { useAuthStore } from "~/lib/stores/auth-store";
import { getCurrentUser } from "~/lib/api-client";
import { useEffect } from "react";
import "~/styles/global.css";

export async function loader({ request }: { request: Request }) {
  const user = await getCurrentUser(request);
  return {
    user,
    publicConfig: {
      apiBaseUrl: process.env.APP_API_BASE_URL || "https://api.cnodejs.org",
    },
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData("root") as { publicConfig?: { apiBaseUrl?: string } } | undefined;
  const publicConfig = data?.publicConfig || { apiBaseUrl: "https://api.cnodejs.org" };

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var raw=localStorage.getItem('theme');var t='system';if(raw){try{var parsed=JSON.parse(raw);t=parsed&&parsed.state&&parsed.state.theme||raw}catch(e){t=raw}}var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`,
          }}
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
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
