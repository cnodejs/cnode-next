import { useEffect, useRef, useState } from "react";
import {
  type DownloadsResponse,
  type RegistryFilesResponse,
  type RegistryManifest,
  type RegistryStats,
  type SearchResponse,
} from "./types";

export const REGISTRY = "https://registry.npmmirror.com";

export class RegistryError extends Error {
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "RegistryError";
    this.status = status;
  }
}

async function registryJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${REGISTRY}${path}`, init);
  if (res.status === 404) {
    throw new RegistryError(`Not Found: ${path}`, 404);
  }
  if (!res.ok) {
    throw new RegistryError(`HTTP ${res.status}`, res.status);
  }
  return (await res.json()) as T;
}

function pkgPath(pkg: string) {
  return encodeURIComponent(pkg);
}

function ensureLeadingSlash(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function encodeFilePath(path: string) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function getManifest(pkg: string) {
  return registryJson<RegistryManifest>(`/${pkgPath(pkg)}`);
}

export function searchPackages(text: string, from = 0, size = 20) {
  const params = new URLSearchParams({ text, from: String(from), size: String(size) });
  return registryJson<SearchResponse>(`/-/v1/search?${params.toString()}`);
}

export function getRegistryStats() {
  return registryJson<RegistryStats>("/");
}

export function getDownloads(pkg: string, range = 7) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (Math.max(1, range) - 1));
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  return registryJson<DownloadsResponse>(
    `/downloads/range/${fmt(start)}:${fmt(end)}/${pkgPath(pkg)}`,
  );
}

export function getDir(pkg: string, spec: string, path: string) {
  const dirPath =
    path && path !== "/" ? `${encodeFilePath(ensureLeadingSlash(path))}/` : "/";
  return registryJson<RegistryFilesResponse>(
    `/${pkgPath(pkg)}/${encodeURIComponent(spec)}/files${dirPath}?meta`,
  );
}

export async function getFileContent(pkg: string, spec: string, path: string) {
  const res = await fetch(
    `${REGISTRY}/${pkgPath(pkg)}/${encodeURIComponent(spec)}/files${encodeFilePath(ensureLeadingSlash(path))}`,
  );
  if (res.status === 404) {
    throw new RegistryError(`Not Found: ${path}`, 404);
  }
  if (!res.ok) {
    throw new RegistryError(`HTTP ${res.status}`, res.status);
  }
  return res.text();
}

export function useRegistryQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  enabled = true,
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<RegistryError | null>(null);
  const [loading, setLoading] = useState(!enabled ? false : true);
  const [attempt, setAttempt] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    fetcherRef
      .current()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof RegistryError
              ? err
              : new RegistryError(err instanceof Error ? err.message : "加载失败"),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt, enabled]);

  return { data, error, loading, retry: () => setAttempt((value) => value + 1) };
}
