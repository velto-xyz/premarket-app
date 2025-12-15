import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Terminal style – squared corners, sharp edges, precision feel
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary – Professional Teal with theme-aware glow (Bullish action button)
        default: "bg-primary text-primary-foreground font-semibold shadow-primary hover:shadow-elevation-lg hover:bg-primary/90 active:scale-[0.98]",

        // Destructive/Bearish – Warm Orange with theme-aware glow
        destructive: "bg-destructive text-destructive-foreground font-semibold shadow-secondary hover:shadow-elevation-lg hover:bg-destructive/90 active:scale-[0.98]",

        // Outline – Transparent with border, hover glow
        outline: "border border-border bg-transparent text-foreground hover:border-primary/50 hover:shadow-primary active:scale-[0.98]",

        // Secondary – Warm Orange (Bearish)
        secondary: "bg-secondary text-secondary-foreground font-semibold shadow-secondary hover:shadow-elevation-lg hover:bg-secondary/90 active:scale-[0.98]",

        // Ghost – Minimal, transparent
        ghost: "bg-transparent text-foreground/80 hover:bg-muted/50 hover:text-foreground active:scale-[0.98]",

        // Link
        link: "text-primary underline-offset-4 hover:underline",

        // AI/Purple accent
        ai: "bg-accent text-accent-foreground font-semibold shadow-accent hover:shadow-elevation-lg hover:bg-accent/90 active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-base",
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
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
