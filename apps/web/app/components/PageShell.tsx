import { cn } from "~/lib/utils";
import { Link } from "react-router";

type PageBreadcrumb = {
  label: string;
  to?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  breadcrumbs,
  variant = "default",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: PageBreadcrumb[];
  variant?: "default" | "marketing";
}) {
  return (
    <header
      data-slot="page-header"
      data-variant={variant}
      className={cn(
        "flex flex-col gap-3",
        variant === "marketing" && "rounded-xl bg-brand p-6 text-brand-foreground sm:p-8",
      )}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="面包屑">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {breadcrumbs.map((item, index) => (
                <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                  {index > 0 && <span aria-hidden="true">/</span>}
                  {item.to ? (
                    <Link to={item.to} className="hover:text-foreground">{item.label}</Link>
                  ) : (
                    <span aria-current="page">{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
      )}
      <div className={cn(
        "flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        variant === "default" && "rounded-xl bg-brand p-5 text-brand-foreground sm:p-6",
      )}>
        <div className="flex min-w-0 flex-col gap-1.5">
        {!breadcrumbs?.length && eyebrow && (
          <p className={cn("text-xs font-medium uppercase tracking-widest text-muted-foreground", variant === "marketing" && "text-brand-accent")}>
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">{title}</h1>
        {description && (
          <p className="max-w-2xl text-sm text-brand-foreground/70">
            {description}
          </p>
        )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}

function ArchetypePage({
  archetype,
  children,
  className,
}: {
  archetype: "feed" | "reading" | "compose" | "account" | "directory";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-page-archetype={archetype} className={cn("flex min-w-0 flex-col gap-6", className)}>
      {children}
    </div>
  );
}

export function FeedPage(props: Omit<React.ComponentProps<typeof ArchetypePage>, "archetype">) {
  return <ArchetypePage archetype="feed" {...props} />;
}

export function ReadingPage(props: Omit<React.ComponentProps<typeof ArchetypePage>, "archetype">) {
  return <ArchetypePage archetype="reading" {...props} />;
}

export function ComposePage({ className, ...props }: Omit<React.ComponentProps<typeof ArchetypePage>, "archetype">) {
  return <ArchetypePage archetype="compose" className={cn("mx-auto w-full max-w-5xl", className)} {...props} />;
}

export function AccountPage({ className, ...props }: Omit<React.ComponentProps<typeof ArchetypePage>, "archetype">) {
  return <ArchetypePage archetype="account" className={cn("mx-auto w-full max-w-md", className)} {...props} />;
}

export function DirectoryPage(props: Omit<React.ComponentProps<typeof ArchetypePage>, "archetype">) {
  return <ArchetypePage archetype="directory" {...props} />;
}

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
  children,
  aside,
  afterAside,
  className,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
  afterAside?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]",
        className,
      )}
    >
      <div className="min-w-0 xl:col-start-1">{children}</div>
      {aside && (
        <aside className="min-w-0 xl:col-start-2 xl:row-span-2 xl:row-start-1">
          {aside}
        </aside>
      )}
      {afterAside && <div className="min-w-0 xl:col-start-1">{afterAside}</div>}
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
