declare global {
  interface Window {
    __CNODE_CONFIG__?: {
      apiBaseUrl?: string;
      turnstileSiteKey?: string;
      build?: {
        service: string;
        version: string;
        commit: string;
        buildTime: string;
      };
    };
  }
}

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.__CNODE_CONFIG__?.apiBaseUrl || "https://api.cnodejs.org";
  }
  if (typeof process !== "undefined" && process.env?.CNODE_API_INTERNAL_BASE_URL) {
    return process.env.CNODE_API_INTERNAL_BASE_URL;
  }
  if (typeof process !== "undefined" && process.env?.CNODE_API_BASE_URL) {
    return process.env.CNODE_API_BASE_URL;
  }
  return "http://localhost:3001";
}

interface FetchOptions extends RequestInit {
  apiToken?: string;
}

export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const baseURL = getApiBaseUrl();
  const url = `${baseURL}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((opts.headers as Record<string, string>) || {}),
  };

  if (opts.headers && (opts.headers as any).cookie) {
    headers["cookie"] = (opts.headers as any).cookie;
  }

  const res = await fetch(url, {
    ...opts,
    headers,
    credentials: "include",
  });

  const data = await res.json().catch(() => null);

  if (data === null) {
    return { success: false, error_msg: res.ok ? "响应解析失败" : `请求失败 (HTTP ${res.status})` } as T;
  }

  return data as T;
}

export async function getCurrentUser(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const res = await apiFetch<{ success: boolean; data: any }>("/api/v1/auth/me", {
    headers: { cookie },
  });
  return res.success ? res.data : null;
}
