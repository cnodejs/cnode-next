import type * as React from "react";
import { cn } from "~/lib/utils";
import { PageHeader } from "./PageShell";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Link } from "react-router";

export function AdminPage({ children, className, archetype = "data-list" }: { children: React.ReactNode; className?: string; archetype?: "dashboard" | "data-list" | "workflow" }) {
  return <div data-page-archetype={archetype} className={cn("flex flex-col gap-4", className)}>{children}</div>;
}

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <PageHeader
      breadcrumbs={title === "管理概览" ? [{ label: "管理后台" }] : [{ label: "管理后台", to: "/admin" }, { label: title }]}
      title={title}
      description={description}
      action={action}
    />
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
    <Card size="sm" className={cn("min-w-0", className)}>
      {(title || description || action) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
      )}
      <CardContent className={cn(flush && "overflow-x-auto", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

export function AdminToolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", className)}>
      {children}
    </div>
  );
}

export function AdminMetricCard({ label, value, href }: { label: string; value: React.ReactNode; href?: string }) {
  const card = (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
  return href ? <Link to={href}>{card}</Link> : card;
}
