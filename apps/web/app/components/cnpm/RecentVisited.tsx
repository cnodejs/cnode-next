import { Link } from "react-router";
import { X } from "lucide-react";
import { useRecentVisited } from "~/lib/registry/use-recent";
import { Button } from "~/components/ui/button";

export function RecentVisited() {
  const { recent, removeRecent } = useRecentVisited();
  if (recent.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="text-sm text-muted-foreground">最近访问</span>
      {recent.map((name) => (
        <span
          key={name}
          className="group inline-flex items-center gap-1 rounded-full bg-muted pl-1 pr-1 text-xs text-foreground"
        >
          <Link
            to={`/cnpm/pkg/${name}`}
            className="inline-flex min-w-0 max-w-56 items-center truncate rounded-full px-2 py-1 hover:text-primary"
          >
            <span className="truncate">{name}</span>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-4 rounded-full p-0"
            aria-label={`移除 ${name}`}
            onClick={() => removeRecent(name)}
          >
            <X className="size-3" />
          </Button>
        </span>
      ))}
    </div>
  );
}
