import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // Terminal badge – squared, dense, monospace feel
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-mono font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Default – Electric Teal (Primary/Brand)
        default: "border-transparent bg-[#00F0FF]/15 text-[#00F0FF]",
        
        // Secondary – Sharp Orange (Bearish)
        secondary: "border-transparent bg-[#FF4D00]/15 text-[#FF4D00]",
        
        // Destructive – Same as Bearish
        destructive: "border-transparent bg-[#FF4D00]/15 text-[#FF4D00]",
        
        // Success – Bright Green (Bullish/Uptrend)
        success: "border-transparent bg-[#22C55E]/15 text-[#22C55E]",
        
        // AI/Neutral – Electric Purple
        ai: "border-transparent bg-[#BB86FC]/15 text-[#BB86FC]",
        
        // Outline
        outline: "border-white/20 text-white/80",
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
