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
        // Primary – Electric Teal with glow (Bullish action button)
        default: "bg-[#00F0FF] text-black font-semibold shadow-[0_4px_20px_rgba(0,240,255,0.3)] hover:shadow-[0_6px_30px_rgba(0,240,255,0.4)] hover:bg-[#00D4E0] active:scale-[0.98]",
        
        // Destructive/Bearish – Sharp Orange with glow
        destructive: "bg-[#FF4D00] text-black font-semibold shadow-[0_4px_20px_rgba(255,77,0,0.3)] hover:shadow-[0_6px_30px_rgba(255,77,0,0.4)] hover:bg-[#E04500] active:scale-[0.98]",
        
        // Outline – Transparent with white border, hover glow
        outline: "border border-white/20 bg-transparent text-white hover:border-[#00F0FF]/50 hover:shadow-[0_0_0_1px_rgba(0,240,255,0.3)] active:scale-[0.98]",
        
        // Secondary – Sharp Orange (Bearish)
        secondary: "bg-[#FF4D00] text-black font-semibold shadow-[0_4px_20px_rgba(255,77,0,0.3)] hover:shadow-[0_6px_30px_rgba(255,77,0,0.4)] hover:bg-[#E04500] active:scale-[0.98]",
        
        // Ghost – Minimal, transparent
        ghost: "bg-transparent text-white/80 hover:bg-white/5 hover:text-white active:scale-[0.98]",
        
        // Link
        link: "text-[#00F0FF] underline-offset-4 hover:underline",
        
        // AI/Purple accent
        ai: "bg-[#BB86FC] text-black font-semibold shadow-[0_4px_20px_rgba(187,134,252,0.3)] hover:shadow-[0_6px_30px_rgba(187,134,252,0.4)] hover:bg-[#A66DE8] active:scale-[0.98]",
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
