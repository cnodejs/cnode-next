import { cn } from "~/lib/utils";

export function PageContainer({
  children,
  className,
  size = "default",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "reading" | "narrow";
}) {
  return (
    <div
      className={cn(
        size === "reading"
          ? "mx-auto max-w-7xl px-4"
          : size === "narrow"
            ? "mx-auto max-w-5xl px-4"
            : "mx-auto max-w-6xl px-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FeedGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]", className)}>{children}</div>
  );
}

export function ReadingGrid({
  toc,
  children,
  aside,
  className,
}: {
  toc?: React.ReactNode;
  children: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-6 xl:grid-cols-[12rem_minmax(0,1fr)_18rem]",
        !toc && "xl:grid-cols-[minmax(0,1fr)_18rem]",
        className,
      )}
    >
      {toc && <aside className="hidden xl:block">{toc}</aside>}
      <main className="min-w-0">{children}</main>
      {aside && <aside className="min-w-0">{aside}</aside>}
    </div>
  );
}

export function FormPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mx-auto w-full max-w-md", className)}>{children}</div>;
}

export function ContentPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("w-full", className)}>{children}</div>;
}
