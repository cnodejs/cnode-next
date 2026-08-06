import { useRouteLoaderData } from "react-router";
import { useEffect, useRef, useState } from "react";

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
      existing.addEventListener(
        "error",
        () => reject(new Error("Turnstile script failed to load")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.turnstileApi = "true";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Turnstile script failed to load")), {
      once: true,
    });
    document.head.appendChild(script);
  });
  return turnstileScriptPromise;
}

export function TurnstileWidget() {
  const data = useRouteLoaderData("root") as RootData | undefined;
  const siteKey = data?.publicConfig?.turnstileSiteKey;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "verified" | "error">("loading");

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    setStatus("loading");
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
            setStatus("verified");
          },
          "expired-callback": () => {
            currentToken = "";
            setStatus("ready");
          },
          "error-callback": (code: string) => {
            currentToken = "";
            setStatus("error");
            if (retryTimer) clearTimeout(retryTimer);
            if (code.startsWith("600") || code.startsWith("300") || code === "200500") {
              retryTimer = setTimeout(() => {
                if (!cancelled && widgetId && window.turnstile) window.turnstile.reset(widgetId);
              }, 3000);
            }
          },
        });
        setStatus("ready");
      })
      .catch(() => {
        currentToken = "";
        setStatus("error");
      });

    return () => {
      cancelled = true;
      currentToken = "";
      if (retryTimer) clearTimeout(retryTimer);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey]);

  if (!siteKey) return null;
  const message = {
    loading: "人机验证加载中",
    ready: "请完成人机验证",
    verified: "人机验证已完成",
    error: "人机验证加载失败，请刷新后重试",
  }[status];
  return (
    <div className="flex flex-col gap-2" aria-busy={status === "loading"}>
      <div ref={containerRef} />
      <p
        role={status === "error" ? "alert" : "status"}
        className={
          status === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"
        }
      >
        {message}
      </p>
    </div>
  );
}

export function getTurnstileToken() {
  if (typeof document === "undefined") return "";
  return (
    currentToken ||
    (document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement | null)?.value ||
    ""
  );
}
