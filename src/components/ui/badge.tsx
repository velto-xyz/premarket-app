import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // Terminal badge – squared, dense, monospace feel
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-mono font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Default – Professional Teal (Primary/Brand)
        default: "border-transparent bg-primary/15 text-primary",

        // Secondary – Warm Orange (Bearish)
        secondary: "border-transparent bg-secondary/15 text-secondary",

        // Destructive – Same as Bearish
        destructive: "border-transparent bg-destructive/15 text-destructive",

        // Success – Professional Green (Bullish/Uptrend)
        success: "border-transparent bg-success/15 text-success",

        // AI/Neutral – Professional Purple
        ai: "border-transparent bg-accent/15 text-accent",

        // Outline
        outline: "border-border text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
