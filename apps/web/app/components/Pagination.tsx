import {
  Pagination as PaginationNav,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";
import { Link } from "react-router";

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
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  if (variant === "simple") {
    return (
      <PaginationNav className="mt-4 justify-between">
        <PaginationContent className="w-full justify-between">
          <PaginationItem>
            {page > 1 ? <PaginationPrevious render={<Link to={buildUrl(page - 1)} />} /> : <span />}
          </PaginationItem>
          <PaginationItem>
            {page < totalPages ? (
              <PaginationNext render={<Link to={buildUrl(page + 1)} />} />
            ) : null}
          </PaginationItem>
        </PaginationContent>
      </PaginationNav>
    );
  }

  return (
    <PaginationNav className="mt-4">
      <PaginationContent className="max-w-full flex-wrap">
        {page > 1 && (
          <PaginationItem>
            <PaginationPrevious render={<Link to={buildUrl(page - 1)} />} />
          </PaginationItem>
        )}
        {start > 1 && (
          <PaginationItem>
            <PaginationLink render={<Link to={buildUrl(1)} />}>1</PaginationLink>
          </PaginationItem>
        )}
        {start > 2 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        {pages.map((p) => (
          <PaginationItem key={p}>
            <PaginationLink render={<Link to={buildUrl(p)} />} isActive={p === page}>
              {p}
            </PaginationLink>
          </PaginationItem>
        ))}
        {end < totalPages - 1 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        {end < totalPages && (
          <PaginationItem>
            <PaginationLink render={<Link to={buildUrl(totalPages)} />}>
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        )}
        {page < totalPages && (
          <PaginationItem>
            <PaginationNext render={<Link to={buildUrl(page + 1)} />} />
          </PaginationItem>
        )}
      </PaginationContent>
    </PaginationNav>
  );
}
