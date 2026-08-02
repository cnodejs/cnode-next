import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";
import { buttonVariants } from "./button";

const PaginationNav = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav aria-label="分页导航" className={cn("mx-auto flex w-full justify-center", className)} {...props} />
);
PaginationNav.displayName = "PaginationNav";

const PaginationList = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("flex flex-wrap items-center justify-center gap-2", className)} {...props} />
  ),
);
PaginationList.displayName = "PaginationList";

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ className, ...props }, ref) => <li ref={ref} className={cn("list-none", className)} {...props} />,
);
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = React.ComponentProps<typeof Link> & {
  isActive?: boolean;
  disabled?: boolean;
};

const PaginationLink = ({ className, isActive, disabled, ...props }: PaginationLinkProps) => (
  <Link
    aria-current={isActive ? "page" : undefined}
    aria-disabled={disabled || undefined}
    tabIndex={disabled ? -1 : props.tabIndex}
    className={cn(
      buttonVariants({ variant: isActive ? "default" : "outline", size: "sm" }),
      "min-w-9 px-3",
      disabled && "pointer-events-none opacity-50",
      className,
    )}
    {...props}
  />
);
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({ children = "上一页", ...props }: PaginationLinkProps) => (
  <PaginationLink aria-label="← 上一页" {...props}>
    <ChevronLeft className="size-4" />
    <span>{children}</span>
  </PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({ children = "下一页", ...props }: PaginationLinkProps) => (
  <PaginationLink aria-label="下一页 →" {...props}>
    <span>{children}</span>
    <ChevronRight className="size-4" />
  </PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span aria-hidden className={cn("flex h-9 w-9 items-center justify-center text-muted-foreground", className)} {...props}>
    <MoreHorizontal className="size-4" />
    <span className="sr-only">更多页</span>
  </span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNav,
  PaginationNext,
  PaginationPrevious,
};
