import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
  applyToDocument: () => void;
}

function resolveDark(theme: Theme): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      toggle: () => {
        const order: Theme[] = ["light", "dark", "system"];
        const current = get().theme;
        const next = order[(order.indexOf(current) + 1) % order.length];
        set({ theme: next });
        get().applyToDocument();
      },
      setTheme: (theme) => {
        set({ theme });
        get().applyToDocument();
      },
      applyToDocument: () => {
        if (typeof document === "undefined") return;
        const dark = resolveDark(get().theme);
        document.documentElement.classList.toggle("dark", dark);
      },
    }),
    {
      name: "theme",
      skipHydration: true,
    },
  ),
);

if (typeof window !== "undefined") {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener("change", () => {
    const state = useThemeStore.getState();
    if (state.theme === "system") {
      state.applyToDocument();
    }
  });
}
