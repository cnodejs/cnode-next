import {
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNav,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";

interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  basePath: string;
  searchParams?: Record<string, string>;
  variant?: "numbered" | "simple";
}

export function Pagination({
  page,
  total,
  limit,
  basePath,
  searchParams = {},
  variant = "numbered",
}: PaginationProps) {
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

  if (variant === "simple") {
    return (
      <PaginationNav className="mt-4 justify-between">
        <PaginationList className="w-full justify-between">
          <PaginationItem>
            {page > 1 ? <PaginationPrevious to={buildUrl(page - 1)} /> : <span />}
          </PaginationItem>
          <PaginationItem>
            {page < totalPages ? <PaginationNext to={buildUrl(page + 1)} /> : null}
          </PaginationItem>
        </PaginationList>
      </PaginationNav>
    );
  }

  return (
    <PaginationNav className="mt-4">
      <PaginationList>
      {page > 1 && (
        <PaginationItem>
          <PaginationPrevious to={buildUrl(page - 1)} />
        </PaginationItem>
      )}
      {start > 1 && (
        <PaginationItem>
          <PaginationLink to={buildUrl(1)}>1</PaginationLink>
        </PaginationItem>
      )}
      {start > 2 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
      {pages.map((p) => (
        <PaginationItem key={p}>
          <PaginationLink to={buildUrl(p)} isActive={p === page}>{p}</PaginationLink>
        </PaginationItem>
      ))}
      {end < totalPages - 1 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
      {end < totalPages && (
        <PaginationItem>
          <PaginationLink to={buildUrl(totalPages)}>{totalPages}</PaginationLink>
        </PaginationItem>
      )}
      {page < totalPages && (
        <PaginationItem>
          <PaginationNext to={buildUrl(page + 1)} />
        </PaginationItem>
      )}
      </PaginationList>
    </PaginationNav>
  );
}
