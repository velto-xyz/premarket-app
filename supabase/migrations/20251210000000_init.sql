-- ============================================================================
-- Velto Initial Schema - Core Tables
-- ============================================================================

-- ============================================================================
-- TABLES
-- ============================================================================

-- Industries table
CREATE TABLE public.industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Startups table (market metadata)
CREATE TABLE public.startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  industry_id UUID NOT NULL REFERENCES public.industries(id) ON DELETE CASCADE,
  description TEXT,
  logo_url TEXT,
  hq_location TEXT NOT NULL,
  hq_latitude DECIMAL(9,6),
  hq_longitude DECIMAL(9,6),
  unicorn_color TEXT DEFAULT '#8B5CF6',
  year_founded INTEGER,
  founders TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User profiles table (created on login via auth trigger)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wallets table (can exist without user, linked on login)
CREATE TABLE public.wallets (
  address TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Market contracts table (links startups to deployed smart contracts)
CREATE TABLE public.market_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE UNIQUE,
  perp_engine_address TEXT NOT NULL,
  perp_market_address TEXT NOT NULL,
  position_manager_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL DEFAULT 84532,
  deployment_block BIGINT,
  deployed_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trades table (indexed from chain events)
CREATE TABLE public.trades (
  id TEXT PRIMARY KEY,
  engine TEXT NOT NULL,
  user_address TEXT NOT NULL,
  position_id BIGINT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('open', 'close', 'liquidate')),
  is_long BOOLEAN NOT NULL,
  price DECIMAL(36,18) NOT NULL,
  base_size DECIMAL(36,18) NOT NULL,
  margin DECIMAL(36,18) NOT NULL,
  notional DECIMAL(36,18) NOT NULL,
  pnl DECIMAL(36,18),
  timestamp TIMESTAMPTZ NOT NULL
);

-- Positions table (current state, synced from open/close events)
CREATE TABLE public.positions (
  id BIGINT PRIMARY KEY,
  engine TEXT NOT NULL,
  user_address TEXT NOT NULL,
  is_long BOOLEAN NOT NULL,
  entry_price DECIMAL(36,18) NOT NULL,
  base_size DECIMAL(36,18) NOT NULL,
  margin DECIMAL(36,18) NOT NULL,
  leverage DECIMAL(36,18) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'liquidated')),
  opened_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ
);

-- User holdings table (pre-computed stats per user per market)
CREATE TABLE public.user_holdings (
  id TEXT PRIMARY KEY,  -- user_address-engine (e.g. "0xabc...-0xdef...")
  user_address TEXT NOT NULL,
  engine TEXT NOT NULL,
  open_position_count INTEGER NOT NULL DEFAULT 0,
  open_margin DECIMAL(36,18) NOT NULL DEFAULT 0,  -- Total margin in open positions
  total_trades INTEGER NOT NULL DEFAULT 0,
  total_volume DECIMAL(36,18) NOT NULL DEFAULT 0,
  realized_pnl DECIMAL(36,18) NOT NULL DEFAULT 0,
  last_trade_at TIMESTAMPTZ NOT NULL,
  UNIQUE(user_address, engine)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_startups_industry ON public.startups(industry_id);
CREATE INDEX idx_startups_slug ON public.startups(slug);

CREATE INDEX idx_wallets_user ON public.wallets(user_id);

CREATE INDEX idx_market_contracts_startup ON public.market_contracts(startup_id);
CREATE INDEX idx_market_contracts_engine ON public.market_contracts(perp_engine_address);
CREATE INDEX idx_market_contracts_active ON public.market_contracts(is_active) WHERE is_active = true;

CREATE INDEX idx_trades_engine_time ON public.trades(engine, timestamp DESC);
CREATE INDEX idx_trades_user_time ON public.trades(user_address, timestamp DESC);
CREATE INDEX idx_trades_position ON public.trades(position_id);

CREATE INDEX idx_positions_user_status ON public.positions(user_address, status);
CREATE INDEX idx_positions_engine_status ON public.positions(engine, status);

CREATE INDEX idx_user_holdings_user ON public.user_holdings(user_address);
CREATE INDEX idx_user_holdings_engine ON public.user_holdings(engine);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$;

-- Function to update user holdings atomically
CREATE OR REPLACE FUNCTION public.upsert_user_holding(
  p_user_address TEXT,
  p_engine TEXT,
  p_event_type TEXT,
  p_margin DECIMAL(36,18),
  p_volume DECIMAL(36,18),
  p_pnl DECIMAL(36,18),
  p_timestamp TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id TEXT;
  v_open_delta INTEGER;
  v_margin_delta DECIMAL(36,18);
  v_pnl_delta DECIMAL(36,18);
BEGIN
  v_id := p_user_address || '-' || p_engine;

  -- Determine deltas based on event type
  IF p_event_type = 'open' THEN
    v_open_delta := 1;
    v_margin_delta := p_margin;  -- Add margin when opening
    v_pnl_delta := 0;
  ELSE
    -- close or liquidate
    v_open_delta := -1;
    v_margin_delta := -p_margin;  -- Remove margin when closing
    v_pnl_delta := COALESCE(p_pnl, 0);
  END IF;

  INSERT INTO public.user_holdings (
    id, user_address, engine, open_position_count, open_margin, total_trades, total_volume, realized_pnl, last_trade_at
  ) VALUES (
    v_id, p_user_address, p_engine, GREATEST(v_open_delta, 0), GREATEST(v_margin_delta, 0), 1, p_volume, v_pnl_delta, p_timestamp
  )
  ON CONFLICT (id) DO UPDATE SET
    open_position_count = GREATEST(user_holdings.open_position_count + v_open_delta, 0),
    open_margin = GREATEST(user_holdings.open_margin + v_margin_delta, 0),
    total_trades = user_holdings.total_trades + 1,
    total_volume = user_holdings.total_volume + p_volume,
    realized_pnl = user_holdings.realized_pnl + v_pnl_delta,
    last_trade_at = p_timestamp;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_startups_updated_at
  BEFORE UPDATE ON public.startups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_market_contracts_updated_at
  BEFORE UPDATE ON public.market_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_holdings ENABLE ROW LEVEL SECURITY;

-- Industries (public read)
CREATE POLICY "Industries are viewable by everyone"
  ON public.industries FOR SELECT
  USING (true);

-- Startups (public read)
CREATE POLICY "Startups are viewable by everyone"
  ON public.startups FOR SELECT
  USING (true);

-- Market contracts (public read)
CREATE POLICY "Market contracts are viewable by everyone"
  ON public.market_contracts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert market contracts"
  ON public.market_contracts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update market contracts"
  ON public.market_contracts FOR UPDATE
  TO authenticated
  USING (true);

-- Profiles (user owns their data)
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Wallets (public read, service role write for indexer)
CREATE POLICY "Anyone can read wallets"
  ON public.wallets FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage wallets"
  ON public.wallets FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trades (public read, service role write for indexer)
CREATE POLICY "Anyone can read trades"
  ON public.trades FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage trades"
  ON public.trades FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Positions (public read, service role write for indexer)
CREATE POLICY "Anyone can read positions"
  ON public.positions FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage positions"
  ON public.positions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User holdings (public read, service role write for sync)
CREATE POLICY "Anyone can read user_holdings"
  ON public.user_holdings FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage user_holdings"
  ON public.user_holdings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
