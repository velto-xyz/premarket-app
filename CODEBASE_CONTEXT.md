# Velto - Private AI Startup Trading Platform

**Stack:** React 18 + TypeScript + Vite + Supabase + Tailwind
**Design:** Dark terminal UI (Bloomberg-style), electric teal/orange theme

## Architecture

```
Entry: main.tsx → App.tsx (React Query + Router)
Auth: Supabase JWT, localStorage persistence
Routes: Protected by ProtectedRoute guard
State: TanStack Query (server) + useState (UI)
```

## Database (Supabase PostgreSQL + RLS)

```sql
industries(id, name, slug, description, icon_name)
startups(id, name, slug, industry_id, current_price, market_cap, price_change_24h, hq_location, hq_lat/lng, unicorn_color, logo_url)
profiles(id→auth.users, email, full_name, avatar_url)
user_positions(id, user_id, startup_id, position_type[long/short], entry_price, quantity, leverage, liquidation_price, status[open/closed/liquidated])
```

RLS: Public read (industries/startups), user-scoped CRUD (profiles/positions)

## Routes

| Path | Component | Purpose |
|------|-----------|---------|
| /auth | Auth | Login/signup (email+password) |
| / | Industries | Dashboard, industry cards, volume chart |
| /markets | Markets | All startups, filter by industry/region |
| /startup/:slug | StartupDetail | Trading view, price chart, positions |
| /map | WorldMap | Mapbox geographic visualization |
| /portfolio | Portfolio | Holdings, P&L, activity log |
| /ai-watcher | AIWatcher | AI news sentiment analysis |
| /alpha-league | AlphaLeague | Leaderboard rankings |

## Key Components

**Layout:**
- AppLayout: Main wrapper with sidebar
- AppSidebar: Navigation menu

**Trading:**
- TradingPanel: Create long/short positions (quantity, leverage input)
- PositionsPanel: Display active positions with P&L
- LiquidationMonitor: Risk tracking

**Visualization:**
- PriceChart: Recharts line charts
- Map: Mapbox GL integration
- Unicorn3D: Three.js 3D animations
- NewsTicker/PortfolioNewsTicker: Bloomberg-style news

**UI Library:** shadcn/ui (50+ components in /components/ui/)

## Data Layer

**Client:** `/src/integrations/supabase/client.ts`
**Types:** Auto-generated TypeScript in `/src/integrations/supabase/types.ts`
**Hooks:**
- `usePositions`: Position CRUD, calculatePnL(), checkLiquidationRisk()

**Position Formulas:**
- Liquidation (long): `entry_price × (1 - 1/leverage)`
- Liquidation (short): `entry_price × (1 + 1/leverage)`
- P&L: `(current - entry) × quantity × leverage` (inverted for shorts)

**Edge Functions:**
- liquidation-engine: Liquidation calculations
- price-simulator: Mock price generation

## Utils

**Tickers** (`/src/lib/tickers.ts`): Slug → ticker symbol mapping (NBDS, QMLP, etc.)
**Utils** (`/src/lib/utils.ts`): className merging, date formatting

## Auth Flow

1. `/auth` → Supabase email/password
2. JWT in localStorage
3. `onAuthStateChange` → redirect to `/`
4. ProtectedRoute guards all routes except /auth

## Environment

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

## Development

```bash
npm run dev        # Vite dev server :8080
npm run build      # Production build
npm run lint       # ESLint
```

## File Organization

```
src/
  pages/          # 10 route components
  components/
    layout/       # AppLayout, AppSidebar
    trading/      # TradingPanel, PositionsPanel, LiquidationMonitor
    ui/           # shadcn/ui library (50+ files)
  hooks/          # usePositions, use-toast, use-mobile
  lib/            # tickers, utils
  integrations/supabase/  # client, types
  assets/         # logos, videos

supabase/
  migrations/     # 4 SQL migration files
  functions/      # Edge functions (liquidation, price-sim)
```

## Key Dependencies

React Router 6.30, React Query 5.83, Supabase 2.86, Tailwind 3.4, shadcn/ui, Recharts 2.15, Mapbox GL 3.16, Three.js 0.160, React Hook Form 7.61, Zod 3.25

## Current Status

Untracked files (new project), no commits yet. Core features implemented: auth, industries, markets, trading, portfolio display. Portfolio page uses mock data (not DB-driven yet).
