import { Link } from "react-router";

interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  basePath: string;
  searchParams?: Record<string, string>;
}

export function Pagination({ page, total, limit, basePath, searchParams = {} }: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const buildUrl = (p: number) => {
    const params = new URLSearchParams({ ...searchParams, page: String(p) });
    const separator = basePath.includes("?") ? "&" : "?";
    return `${basePath}${separator}${params.toString()}`;
  };

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  const linkClass =
    "px-3 py-1 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm";
  const activeClass =
    "border-cnode-ink bg-cnode-ink text-white hover:bg-cnode-ink/90 hover:text-white";

  return (
    <div className="flex items-center gap-2 mt-4">
      {page > 1 && (
        <Link to={buildUrl(page - 1)} className={linkClass}>
          ← 上一页
        </Link>
      )}
      {start > 1 && (
        <Link to={buildUrl(1)} className={linkClass}>
          1
        </Link>
      )}
      {start > 2 && <span className="px-2 text-muted-foreground">...</span>}
      {pages.map((p) => (
        <Link key={p} to={buildUrl(p)} className={`${linkClass} ${p === page ? activeClass : ""}`}>
          {p}
        </Link>
      ))}
      {end < totalPages - 1 && <span className="px-2 text-muted-foreground">...</span>}
      {end < totalPages && (
        <Link to={buildUrl(totalPages)} className={linkClass}>
          {totalPages}
        </Link>
      )}
      {page < totalPages && (
        <Link to={buildUrl(page + 1)} className={linkClass}>
          下一页 →
        </Link>
      )}
    </div>
  );
}
