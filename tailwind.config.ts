import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1600px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        // Primary – Electric Teal (Bullish/Long)
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        
        // Secondary – Sharp Orange (Bearish/Short)
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        
        // Destructive – Same as Bearish
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        
        // Success – Bright Green (Bullish/Uptrend)
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        
        // Accent – Electric Purple (AI/Neutral)
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
        },

        // Terminal-specific semantic colors
        bullish: "#22C55E",
        bearish: "#FF4D00",
        "ai-purple": "#BB86FC",
        "void-black": "#050505",
        "surface-dark": "#0A0A0A",
      },
      
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        heading: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'monospace'],
      },
      
      // Terminal-style sharp corners
      borderRadius: {
        lg: "6px",
        md: "4px",
        sm: "2px",
      },
      
      // Box shadows with glow effects
      boxShadow: {
        'glow-teal': '0 4px 20px rgba(0, 240, 255, 0.3)',
        'glow-orange': '0 4px 20px rgba(255, 77, 0, 0.3)',
        'glow-purple': '0 4px 20px rgba(187, 134, 252, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'glow-teal-lg': '0 8px 40px rgba(0, 240, 255, 0.4)',
        'glow-orange-lg': '0 8px 40px rgba(255, 77, 0, 0.4)',
      },
      
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 240, 255, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 240, 255, 0.5)" },
        },
        "data-tick": {
          "0%": { opacity: "1" },
          "50%": { opacity: "0.6" },
          "100%": { opacity: "1" },
        },
      },
      
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "data-tick": "data-tick 1s ease-in-out infinite",
      },
      
      // Dense spacing for cockpit feel
      spacing: {
        '0.5': '2px',
        '1.5': '6px',
        '2.5': '10px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
