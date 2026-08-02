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
          "peer w-full appearance-none rounded-md border border-input bg-transparent pr-9 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-100 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20",
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
