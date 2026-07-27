import { useRouteLoaderData } from "react-router";
import { useEffect, useRef } from "react";

type RootData = {
  publicConfig?: {
    turnstileSiteKey?: string;
  };
};

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

let turnstileScriptPromise: Promise<void> | null = null;
let currentToken = "";

function loadTurnstileScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile-api="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Turnstile script failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.turnstileApi = "true";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Turnstile script failed to load")), { once: true });
    document.head.appendChild(script);
  });
  return turnstileScriptPromise;
}

export function TurnstileWidget() {
  const data = useRouteLoaderData("root") as RootData | undefined;
  const siteKey = data?.publicConfig?.turnstileSiteKey;
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;
    let widgetId: string | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile || !containerRef.current) return;
        currentToken = "";
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action: "turnstile-spin-v2",
          callback: (token: string) => {
            currentToken = token;
          },
          "expired-callback": () => {
            currentToken = "";
          },
          "error-callback": (code: string) => {
            currentToken = "";
            if (retryTimer) clearTimeout(retryTimer);
            if (code.startsWith("600") || code.startsWith("300") || code === "200500") {
              retryTimer = setTimeout(() => {
                if (!cancelled && widgetId && window.turnstile) window.turnstile.reset(widgetId);
              }, 3000);
            }
          },
        });
      })
      .catch(() => {
        currentToken = "";
      });

    return () => {
      cancelled = true;
      currentToken = "";
      if (retryTimer) clearTimeout(retryTimer);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey]);

  if (!siteKey) return null;
  return <div ref={containerRef} />;
}

export function getTurnstileToken() {
  if (typeof document === "undefined") return "";
  return currentToken || (document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement | null)?.value || "";
}
