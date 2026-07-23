import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect } from "react";
import { useThemeStore } from "~/lib/stores";
import { Button } from "./ui/button";

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const applyToDocument = useThemeStore((s) => s.applyToDocument);

  useEffect(() => {
    Promise.resolve(useThemeStore.persist.rehydrate()).then(() => {
      useThemeStore.getState().applyToDocument();
    });
  }, [applyToDocument]);

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <Button variant="ghost" size="icon" onClick={toggle} title={theme}>
      <Icon className="h-4 w-4" />
    </Button>
  );
}
