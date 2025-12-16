-- ============================================================================
-- Materialized View Refresh Infrastructure
-- Debounced refresh via edge function
-- ============================================================================

-- State table for sync/refresh tracking (singleton row)
CREATE TABLE IF NOT EXISTS public.sync_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  dirty BOOLEAN DEFAULT FALSE,
  first_dirty_at TIMESTAMPTZ,
  last_dirty_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ DEFAULT '1970-01-01T00:00:00Z'
);

INSERT INTO public.sync_state (id, dirty, last_synced_at)
VALUES (1, FALSE, '1970-01-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- RPC to get state with row lock (returns empty if locked by another)
CREATE OR REPLACE FUNCTION public.get_sync_state_with_lock()
RETURNS TABLE(id INT, dirty BOOLEAN, first_dirty_at TIMESTAMPTZ, last_dirty_at TIMESTAMPTZ, last_synced_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.dirty, s.first_dirty_at, s.last_dirty_at, s.last_synced_at
  FROM public.sync_state s
  WHERE s.id = 1
  FOR UPDATE SKIP LOCKED;
END;
$$;

-- RPC to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_ohlcv_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.ohlcv_5min;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.hourly_ohlcv;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.daily_stats;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON public.sync_state TO service_role;
GRANT SELECT, UPDATE ON public.sync_state TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_sync_state_with_lock() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_ohlcv_views() TO service_role;
