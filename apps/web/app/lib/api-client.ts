export function getApiBaseUrl(): string {
  if (typeof process !== "undefined" && process.env?.APP_API_BASE_URL) {
    return process.env.APP_API_BASE_URL;
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

  // Forward cookie from SSR request
  if (opts.headers && (opts.headers as any).cookie) {
    headers["cookie"] = (opts.headers as any).cookie;
  }

  const res = await fetch(url, {
    ...opts,
    headers,
    credentials: "include",
  });

  const data = await res.json().catch(() => null);
  return data as T;
}

export async function getCurrentUser(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const res = await apiFetch<{ success: boolean; data: any }>("/api/v1/auth/me", {
    headers: { cookie },
  });
  return res.success ? res.data : null;
}
