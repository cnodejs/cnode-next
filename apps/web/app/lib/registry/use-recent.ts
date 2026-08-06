import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cnpm:recent";

export function useRecentVisited() {
  const [recent, setRecent] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setRecent(parsed.filter((item): item is string => typeof item === "string").slice(0, 10));
      }
    } catch {
      setRecent([]);
    }
  }, []);

  const addRecent = useCallback((name: string) => {
    setRecent((prev) => {
      const next = [name, ...prev.filter((item) => item !== name)].slice(0, 10);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota / privacy errors
      }
      return next;
    });
  }, []);

  const removeRecent = useCallback((name: string) => {
    setRecent((prev) => {
      const next = prev.filter((item) => item !== name);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { recent: mounted ? recent : [], addRecent, removeRecent };
}
