import type * as React from "react";
import { cn } from "~/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function AdminPage({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-4", className)}>{children}</div>;
}

export function AdminPageHeader({
  eyebrow = "CNode Admin",
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl bg-cnode-ink text-white shadow-card">
      <div className="relative p-5 sm:p-6">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-cnode-green/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cnode-green/90">
              {eyebrow}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
              {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">{description}</p>}
            </div>
          </div>
          {action && <div className="relative shrink-0">{action}</div>}
        </div>
      </div>
    </section>
  );
}

export function AdminPanel({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  flush = false,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  flush?: boolean;
}) {
  return (
    <Card className={cn("overflow-hidden shadow-card", className)}>
      {(title || description || action) && (
        <CardHeader className="flex-row items-start justify-between gap-4 p-4 pb-3">
          <div className="flex flex-col gap-1.5">
            {title && <CardTitle className="text-base">{title}</CardTitle>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </CardHeader>
      )}
      <CardContent className={cn(flush ? "p-0" : title || description || action ? "px-4 pb-4 pt-0" : "p-4", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

export function AdminToolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2 bg-surface-subtle/60 p-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      {children}
    </div>
  );
}

export function AdminMetricCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="overflow-hidden bg-card">
      <CardContent className="p-4">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}
