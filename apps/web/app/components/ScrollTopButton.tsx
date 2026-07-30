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
      className={cn(
        "fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-50 h-11 rounded-full px-3 shadow-floating sm:bottom-6 sm:right-6 sm:px-4",
        className,
      )}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="回到顶部"
      title="回到顶部"
    >
      <ArrowUp className="h-4 w-4" />
      <span className="hidden sm:inline">顶部</span>
    </Button>
  );
}
