import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "~/lib/utils";

export function ScrollTopButton({ className }: { className?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 480);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  if (!visible) return null;

  return (
    <Button
      type="button"
      variant="default"
      size="lg"
      className={cn(
        "fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-50 sm:right-6 sm:bottom-6",
        className,
      )}
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        })
      }
      aria-label="回到顶部"
      title="回到顶部"
    >
      <ArrowUp data-icon="inline-start" />
      <span className="hidden sm:inline">顶部</span>
    </Button>
  );
}
