import * as React from "react";
import { cn } from "~/lib/utils";

const Empty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl bg-cnode-soft/50 p-8 text-center",
        className,
      )}
      {...props}
    />
  ),
);
Empty.displayName = "Empty";

const EmptyHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col items-center gap-2", className)} {...props} />
);
EmptyHeader.displayName = "EmptyHeader";

const EmptyTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-base font-semibold text-foreground", className)} {...props} />
  ),
);
EmptyTitle.displayName = "EmptyTitle";

const EmptyDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("max-w-md text-sm leading-6 text-muted-foreground", className)} {...props} />
  ),
);
EmptyDescription.displayName = "EmptyDescription";

const EmptyContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-wrap items-center justify-center gap-2", className)} {...props} />
);
EmptyContent.displayName = "EmptyContent";

export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle };
