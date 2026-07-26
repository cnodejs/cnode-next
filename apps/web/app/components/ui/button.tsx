import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-cnode-ink text-white shadow-brand hover:bg-cnode-ink/90 hover:text-white active:translate-y-px dark:bg-cnode-green dark:text-cnode-ink dark:hover:bg-cnode-green-hover",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:translate-y-px",
        outline:
          "border border-cnode-green/25 bg-card shadow-sm hover:border-cnode-green/45 hover:bg-cnode-soft hover:text-cnode-ink active:translate-y-px",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-cnode-soft hover:text-cnode-ink active:translate-y-px",
        inverse: "bg-white text-cnode-ink shadow-sm hover:bg-white/90 hover:text-cnode-ink active:translate-y-px",
        ghost: "hover:bg-cnode-soft hover:text-cnode-ink active:bg-cnode-soft/80",
        link: "text-primary underline-offset-4 hover:text-cnode-green-hover hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-xl px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
