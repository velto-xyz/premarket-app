-- ============================================================================
-- Velto Initial Schema
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
  current_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  market_cap DECIMAL(20,2),
  price_change_24h DECIMAL(5,2),
  unicorn_color TEXT DEFAULT '#8B5CF6',
  year_founded INTEGER,
  founders TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
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

-- Legacy user positions table (deprecated - will use indexer)
CREATE TABLE public.user_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  position_type TEXT NOT NULL CHECK (position_type IN ('long', 'short')),
  entry_price DECIMAL(12,2) NOT NULL,
  quantity DECIMAL(18,8) NOT NULL,
  leverage DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  liquidation_price DECIMAL(12,2),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'liquidated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_positions IS 'Legacy table - use Envio indexer for position data';

-- Position cache table (synced from blockchain events)
CREATE TABLE public.cached_positions (
  position_id TEXT PRIMARY KEY,
  user_address TEXT NOT NULL,
  market_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  market_slug TEXT NOT NULL,
  position_type TEXT NOT NULL CHECK (position_type IN ('long', 'short')),
  entry_price NUMERIC NOT NULL,
  base_size NUMERIC NOT NULL,
  margin NUMERIC NOT NULL,
  leverage NUMERIC NOT NULL,
  entry_notional NUMERIC NOT NULL,
  realized_pnl NUMERIC NOT NULL DEFAULT 0,
  liquidation_price NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'liquidated')),
  opened_at TIMESTAMPTZ NOT NULL,
  opened_block BIGINT NOT NULL,
  opened_tx_hash TEXT NOT NULL,
  closed_at TIMESTAMPTZ,
  closed_block BIGINT,
  closed_tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cached_positions IS 'Position cache synced from blockchain events';

-- Position sync state table (tracks event processing)
CREATE TABLE public.position_sync_state (
  market_slug TEXT PRIMARY KEY,
  last_processed_block BIGINT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.position_sync_state IS 'Tracks last processed block per market for event scanning';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_startups_industry ON public.startups(industry_id);
CREATE INDEX idx_startups_slug ON public.startups(slug);

CREATE INDEX idx_market_contracts_startup ON public.market_contracts(startup_id);
CREATE INDEX idx_market_contracts_engine ON public.market_contracts(perp_engine_address);
CREATE INDEX idx_market_contracts_active ON public.market_contracts(is_active) WHERE is_active = true;

CREATE INDEX idx_user_positions_user ON public.user_positions(user_id);
CREATE INDEX idx_user_positions_startup ON public.user_positions(startup_id);
CREATE INDEX idx_user_positions_status ON public.user_positions(status);

CREATE INDEX idx_cached_positions_user ON public.cached_positions(user_address);
CREATE INDEX idx_cached_positions_market ON public.cached_positions(market_id);
CREATE INDEX idx_cached_positions_status ON public.cached_positions(status);
CREATE INDEX idx_cached_positions_user_market ON public.cached_positions(user_address, market_id);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Markets with contracts view (for easy querying)
CREATE OR REPLACE VIEW public.markets_with_contracts AS
SELECT
  s.id,
  s.name,
  s.slug,
  s.industry_id,
  s.description,
  s.logo_url,
  s.hq_location,
  s.hq_latitude,
  s.hq_longitude,
  s.current_price,
  s.market_cap,
  s.price_change_24h,
  s.unicorn_color,
  s.year_founded,
  s.founders,
  s.created_at,
  s.updated_at,
  mc.perp_engine_address,
  mc.perp_market_address,
  mc.position_manager_address,
  mc.chain_id,
  mc.deployment_block,
  mc.deployed_at,
  mc.is_active as contract_is_active
FROM public.startups s
LEFT JOIN public.market_contracts mc ON s.id = mc.startup_id;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cached_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.position_sync_state ENABLE ROW LEVEL SECURITY;

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

-- User positions (user owns their positions)
CREATE POLICY "Users can view their own positions"
  ON public.user_positions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own positions"
  ON public.user_positions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own positions"
  ON public.user_positions FOR UPDATE
  USING (auth.uid() = user_id);

-- Cached positions (public read, authenticated write)
CREATE POLICY "Anyone can read cached positions"
  ON public.cached_positions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert/update cached positions"
  ON public.cached_positions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Position sync state (public read, authenticated write)
CREATE POLICY "Anyone can read sync state"
  ON public.position_sync_state FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can update sync state"
  ON public.position_sync_state FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
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

-- Triggers for auto-updating timestamps
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

CREATE TRIGGER update_user_positions_updated_at
  BEFORE UPDATE ON public.user_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cached_positions_updated_at
  BEFORE UPDATE ON public.cached_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_position_sync_state_updated_at
  BEFORE UPDATE ON public.position_sync_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

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

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
