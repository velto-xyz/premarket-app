# Design System Reference

## Stack
- **CSS**: Tailwind CSS 3.4.17 + tailwindcss-animate
- **Components**: shadcn/ui (Radix primitives)
- **Variants**: class-variance-authority (CVA)
- **Utils**: clsx + tailwind-merge (`cn()` helper)

## Theme
**Mode**: Dark-only (forced)
**Color Format**: HSL via CSS custom properties

### Semantic Colors
```
Primary (Bullish):   #00F0FF  hsl(186 100% 50%)  Electric Teal
Secondary (Bearish): #FF4D00  hsl(18 100% 50%)   Sharp Orange
Accent (AI):         #BB86FC  hsl(265 100% 76%)  Electric Purple
Success:             #22C55E  hsl(142 76% 45%)   Bright Green
Background:          #050505  hsl(0 0% 2%)       Void Black
Card/Surface:        #0A0A0A  hsl(0 0% 4%)
```

### CSS Variables (`/src/index.css`)
```
--primary, --primary-foreground
--secondary, --secondary-foreground
--background, --foreground
--card, --card-foreground
--accent, --accent-foreground
--success, --success-foreground
--muted, --muted-foreground
--border, --input, --ring
--sidebar-* (background, foreground, primary, accent, border, ring)
--chart-1 to --chart-4 (recharts)
--gradient-*, --shadow-* (glow effects)
```

## Typography
**Fonts**:
- Sans: Inter, -apple-system, BlinkMacSystemFont, sans-serif
- Mono: JetBrains Mono, IBM Plex Mono, Fira Code, monospace

**Properties**:
- Letter-spacing: -0.01em (body), -0.02em (headings)
- Headings: font-weight 600, same family as body

## Design Tokens

### Border Radius (sharp terminal style)
- lg: 6px, md: 4px, sm: 2px

### Shadows (neon glows)
```css
glow-teal:   0 4px 20px rgba(0, 240, 255, 0.3)
glow-orange: 0 4px 20px rgba(255, 77, 0, 0.3)
glow-purple: 0 4px 20px rgba(187, 134, 252, 0.3)
card:        0 4px 24px rgba(0, 0, 0, 0.4)
```

### Animations
- `accordion-down/up`: 0.2s ease-out
- `pulse-glow`: 2s infinite (teal breathing)
- `data-tick`: 1s infinite opacity pulse

## Component Patterns

### Button (`/src/components/ui/button.tsx`)
CVA variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `ai`
- Uses arbitrary values: `bg-[#00F0FF]`, `shadow-[0_4px_20px_rgba(...)]`
- Active feedback: `active:scale-[0.98]`

### Card (`/src/components/ui/card.tsx`)
```tsx
bg-[#0A0A0A] border border-white/[0.08] rounded-md
```
Subcomponents: CardHeader, CardTitle, CardDescription, CardContent, CardFooter

### Badge (`/src/components/ui/badge.tsx`)
CVA variants with 15% opacity backgrounds:
```tsx
bg-[#00F0FF]/15 text-[#00F0FF] font-mono rounded-sm
```

## Global Utilities (`/src/index.css`)

### Text
- `.text-gradient`: Teal gradient (background-clip)
- `.text-gradient-bearish`: Orange gradient
- `.text-gradient-ai`: Purple gradient
- `.text-bullish`, `.text-bearish`, `.text-neutral-ai`

### Backgrounds
- `.bg-bullish`, `.bg-bearish`, `.bg-neutral-ai`
- `.glass`: blur + dark overlay (glassmorphism)

### Effects
- `.glow-teal/orange/purple`: Shadow utilities
- `.hover-glow-*`: Border glow on hover

### Layout
- `.bento-grid`: auto-fit grid
- `.cockpit`: Dense spacing (p-3 gap-2)
- `.data-dense`: Tight typography (text-sm leading-tight)
- `.chart-sharp`: SVG recharts styling

## Architecture Notes
1. Tailwind colors reference CSS custom properties (runtime theme switching capable)
2. Components use arbitrary values for exact colors/shadows (bypassing Tailwind theme)
3. CVA for interactive components, composition pattern for containers
4. Terminal aesthetic: sharp borders, neon glows, dense spacing, monospace accents
5. No light mode implementation despite next-themes in package.json
