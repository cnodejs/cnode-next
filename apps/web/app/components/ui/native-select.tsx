import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "~/lib/utils";

type NativeSelectProps = React.ComponentProps<"select"> & {
  selectSize?: "default" | "sm";
};

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, children, selectSize = "default", ...props }, ref) => (
    <div className={cn("relative inline-flex w-full min-w-0", props.disabled && "opacity-60")}>
      <select
        ref={ref}
        className={cn(
          "peer w-full appearance-none rounded-xl border border-input bg-card pr-9 text-sm shadow-sm transition-[color,background-color,border-color,box-shadow] hover:border-cnode-green/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-100 aria-invalid:border-destructive aria-invalid:ring-destructive/30",
          selectSize === "sm" ? "h-8 px-2.5" : "h-9 px-3",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground peer-disabled:opacity-50" />
    </div>
  ),
);
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
