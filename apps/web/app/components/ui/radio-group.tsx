import * as React from "react";
import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { Circle } from "lucide-react";
import { cn } from "~/lib/utils";

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupPrimitive.Props>(
  ({ className, ...props }, ref) => (
    <RadioGroupPrimitive
      ref={ref}
      className={cn("grid gap-2 data-[disabled]:opacity-60", className)}
      {...props}
    />
  ),
);
RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioPrimitive.Root
    ref={ref}
    className={cn(
      "aspect-square size-4 rounded-full border border-input bg-background text-primary outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[checked]:border-primary data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[invalid]:border-destructive data-[invalid]:ring-[3px] data-[invalid]:ring-destructive/20",
      className,
    )}
    {...props}
  >
    <RadioPrimitive.Indicator className="flex size-full items-center justify-center">
      <Circle className="size-2 fill-current text-current" />
    </RadioPrimitive.Indicator>
  </RadioPrimitive.Root>
));
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
