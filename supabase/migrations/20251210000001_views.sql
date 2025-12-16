-- ============================================================================
-- Velto Views & Materialized Views
-- ============================================================================

-- ============================================================================
-- MATERIALIZED VIEWS (pre-computed stats)
-- ============================================================================

-- 5-minute OHLCV for detailed charts
CREATE MATERIALIZED VIEW public.ohlcv_5min AS
WITH ranked AS (
  SELECT
    engine,
    date_trunc('hour', timestamp) +
      INTERVAL '5 min' * FLOOR(EXTRACT(MINUTE FROM timestamp) / 5) AS bucket,
    price,
    notional,
    ROW_NUMBER() OVER (
      PARTITION BY engine,
        date_trunc('hour', timestamp) + INTERVAL '5 min' * FLOOR(EXTRACT(MINUTE FROM timestamp) / 5)
      ORDER BY timestamp ASC
    ) AS rn_first,
    ROW_NUMBER() OVER (
      PARTITION BY engine,
        date_trunc('hour', timestamp) + INTERVAL '5 min' * FLOOR(EXTRACT(MINUTE FROM timestamp) / 5)
      ORDER BY timestamp DESC
    ) AS rn_last
  FROM public.trades
  WHERE event_type IN ('open', 'close')
)
SELECT
  engine,
  bucket,
  MAX(CASE WHEN rn_first = 1 THEN price END) AS open,
  MAX(price) AS high,
  MIN(price) AS low,
  MAX(CASE WHEN rn_last = 1 THEN price END) AS close,
  SUM(notional) AS volume,
  COUNT(*) AS trade_count
FROM ranked
GROUP BY engine, bucket;

CREATE UNIQUE INDEX idx_ohlcv_5min ON public.ohlcv_5min(engine, bucket);

-- Hourly OHLCV for charts
CREATE MATERIALIZED VIEW public.hourly_ohlcv AS
WITH ranked AS (
  SELECT
    engine,
    date_trunc('hour', timestamp) AS bucket,
    price,
    notional,
    ROW_NUMBER() OVER (PARTITION BY engine, date_trunc('hour', timestamp) ORDER BY timestamp ASC) AS rn_first,
    ROW_NUMBER() OVER (PARTITION BY engine, date_trunc('hour', timestamp) ORDER BY timestamp DESC) AS rn_last
  FROM public.trades
  WHERE event_type IN ('open', 'close')
)
SELECT
  engine,
  bucket,
  MAX(CASE WHEN rn_first = 1 THEN price END) AS open,
  MAX(price) AS high,
  MIN(price) AS low,
  MAX(CASE WHEN rn_last = 1 THEN price END) AS close,
  SUM(notional) AS volume,
  COUNT(*) AS trade_count
FROM ranked
GROUP BY engine, bucket;

CREATE UNIQUE INDEX idx_hourly_ohlcv ON public.hourly_ohlcv(engine, bucket);

-- Daily stats for trends/rankings
CREATE MATERIALIZED VIEW public.daily_stats AS
WITH ranked AS (
  SELECT
    engine,
    date_trunc('day', timestamp) AS bucket,
    price,
    notional,
    pnl,
    ROW_NUMBER() OVER (PARTITION BY engine, date_trunc('day', timestamp) ORDER BY timestamp ASC) AS rn_first,
    ROW_NUMBER() OVER (PARTITION BY engine, date_trunc('day', timestamp) ORDER BY timestamp DESC) AS rn_last
  FROM public.trades
)
SELECT
  engine,
  bucket,
  MAX(CASE WHEN rn_first = 1 THEN price END) AS open,
  MAX(CASE WHEN rn_last = 1 THEN price END) AS close,
  MAX(price) AS high,
  MIN(price) AS low,
  SUM(notional) AS volume,
  SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END) AS realized_profit,
  SUM(CASE WHEN pnl < 0 THEN pnl ELSE 0 END) AS realized_loss
FROM ranked
GROUP BY engine, bucket;

CREATE UNIQUE INDEX idx_daily_stats ON public.daily_stats(engine, bucket);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Markets with contracts view
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

-- Market 24h stats (for market detail header)
CREATE OR REPLACE VIEW public.market_stats_24h AS
WITH period_data AS (
  SELECT engine, bucket, open, high, low, close, volume
  FROM public.hourly_ohlcv
  WHERE bucket >= NOW() - INTERVAL '24 hours'
),
first_last AS (
  SELECT DISTINCT ON (engine)
    engine,
    FIRST_VALUE(open) OVER w AS first_open,
    LAST_VALUE(close) OVER w AS last_close
  FROM period_data
  WINDOW w AS (PARTITION BY engine ORDER BY bucket ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
)
SELECT
  p.engine,
  MAX(p.high) AS high_24h,
  MIN(p.low) AS low_24h,
  SUM(p.volume) AS volume_24h,
  (fl.last_close - fl.first_open) / NULLIF(fl.first_open, 0) * 100 AS change_24h
FROM period_data p
JOIN first_last fl ON fl.engine = p.engine
GROUP BY p.engine, fl.first_open, fl.last_close;

-- Market rankings (sorted by total positive price change)
CREATE OR REPLACE VIEW public.market_rankings AS
WITH first_last AS (
  SELECT DISTINCT ON (engine)
    engine,
    FIRST_VALUE(open) OVER w AS first_open,
    LAST_VALUE(close) OVER w AS last_close
  FROM public.daily_stats
  WINDOW w AS (PARTITION BY engine ORDER BY bucket ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
)
SELECT
  engine,
  (last_close - first_open) / NULLIF(first_open, 0) * 100 AS total_change
FROM first_last
WHERE last_close > first_open
ORDER BY total_change DESC;

-- Wallet portfolio stats (aggregates from pre-computed user_holdings)
CREATE OR REPLACE VIEW public.wallet_portfolio AS
SELECT
  user_address AS wallet_address,
  SUM(open_position_count) AS open_positions,
  SUM(open_margin) AS total_margin,
  SUM(realized_pnl) AS realized_pnl,
  SUM(total_trades) AS total_trades,
  SUM(total_volume) AS total_volume
FROM public.user_holdings
GROUP BY user_address;

-- User portfolio (aggregates all linked wallets)
CREATE OR REPLACE VIEW public.user_portfolio AS
SELECT
  w.user_id,
  COALESCE(SUM(wp.open_positions), 0) AS open_positions,
  COALESCE(SUM(wp.total_margin), 0) AS total_margin,
  COALESCE(SUM(wp.realized_pnl), 0) AS realized_pnl,
  COALESCE(SUM(wp.total_trades), 0) AS total_trades,
  COALESCE(SUM(wp.total_volume), 0) AS total_volume
FROM public.wallets w
LEFT JOIN public.wallet_portfolio wp ON wp.wallet_address = w.address
WHERE w.user_id IS NOT NULL
GROUP BY w.user_id;

-- Function: Get stats for any time period
CREATE OR REPLACE FUNCTION public.get_period_stats(
  p_engine TEXT,
  p_interval TEXT
)
RETURNS TABLE(high DECIMAL, low DECIMAL, volume DECIMAL, change_pct DECIMAL) AS $$
DECLARE
  since_time TIMESTAMPTZ;
  first_open DECIMAL;
  last_close DECIMAL;
BEGIN
  since_time := CASE p_interval
    WHEN 'D' THEN NOW() - INTERVAL '1 day'
    WHEN 'W' THEN NOW() - INTERVAL '7 days'
    WHEN 'M' THEN NOW() - INTERVAL '1 month'
    WHEN '3M' THEN NOW() - INTERVAL '3 months'
    WHEN 'Y' THEN NOW() - INTERVAL '1 year'
    ELSE '1970-01-01'::TIMESTAMPTZ
  END;

  SELECT h.open INTO first_open
  FROM public.hourly_ohlcv h
  WHERE h.engine = p_engine AND h.bucket >= since_time
  ORDER BY h.bucket ASC LIMIT 1;

  SELECT h.close INTO last_close
  FROM public.hourly_ohlcv h
  WHERE h.engine = p_engine AND h.bucket >= since_time
  ORDER BY h.bucket DESC LIMIT 1;

  RETURN QUERY
  SELECT
    MAX(h.high),
    MIN(h.low),
    SUM(h.volume),
    (last_close - first_open) / NULLIF(first_open, 0) * 100
  FROM public.hourly_ohlcv h
  WHERE h.engine = p_engine AND h.bucket >= since_time;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Views
GRANT SELECT ON public.market_stats_24h TO anon, authenticated;
GRANT SELECT ON public.market_rankings TO anon, authenticated;
GRANT SELECT ON public.markets_with_contracts TO anon, authenticated;
GRANT SELECT ON public.wallet_portfolio TO anon, authenticated;
GRANT SELECT ON public.user_portfolio TO anon, authenticated;

-- Materialized views (for chart data)
GRANT SELECT ON public.ohlcv_5min TO anon, authenticated;
GRANT SELECT ON public.hourly_ohlcv TO anon, authenticated;
GRANT SELECT ON public.daily_stats TO anon, authenticated;
