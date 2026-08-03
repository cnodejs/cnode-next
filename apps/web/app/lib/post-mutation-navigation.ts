export function previousPageAfterRemoval({
  pathname,
  search,
  page,
  currentItemCount,
  removedCount,
}: {
  pathname: string;
  search: string;
  page: number;
  currentItemCount: number;
  removedCount: number;
}) {
  if (page <= 1 || currentItemCount - removedCount > 0) return null;
  const params = new URLSearchParams(search);
  params.set("page", String(page - 1));
  return `${pathname}?${params.toString()}`;
}
