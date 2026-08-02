import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-cnode-ink text-brand-on shadow-brand hover:bg-cnode-ink/90 hover:text-brand-on active:translate-y-px dark:bg-cnode-green dark:hover:bg-cnode-green-hover",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:translate-y-px",
        outline:
          "border border-cnode-green/40 bg-card shadow-sm hover:border-cnode-green/70 hover:bg-cnode-soft hover:text-foreground active:translate-y-px",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-cnode-soft hover:text-foreground active:translate-y-px",
        inverse: "bg-white text-brand-ink shadow-sm hover:bg-white/90 hover:text-brand-ink active:translate-y-px",
        ghost: "hover:bg-cnode-soft hover:text-foreground active:bg-cnode-soft/80",
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
  extends Omit<ButtonPrimitive.Props, "className">,
    VariantProps<typeof buttonVariants> {
  className?: string;
}

const Button = React.forwardRef<HTMLElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <ButtonPrimitive
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
