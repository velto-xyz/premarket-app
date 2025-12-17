-- Sentiment data from external sources (Wikipedia, News, HackerNews, Reddit, etc.)
-- Populated by edge function, consumed by frontend

CREATE TABLE IF NOT EXISTS sentiment_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_slug TEXT NOT NULL,
  startup_name TEXT NOT NULL,
  source TEXT NOT NULL,  -- 'wikipedia', 'google-news', 'hackernews', 'reddit', 'techcrunch'

  -- Normalized score (0-100)
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  trend TEXT NOT NULL CHECK (trend IN ('up', 'down', 'stable')),

  -- Raw data from source (JSON)
  raw_value NUMERIC,
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),

  -- Unique constraint per startup per source
  CONSTRAINT unique_startup_source UNIQUE (startup_slug, source)
);

-- Index for fast lookups
CREATE INDEX idx_sentiment_startup ON sentiment_data(startup_slug);
CREATE INDEX idx_sentiment_source ON sentiment_data(source);
CREATE INDEX idx_sentiment_expires ON sentiment_data(expires_at);

-- Economic indicators (FRED data) - industry/market level
CREATE TABLE IF NOT EXISTS economic_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_code TEXT NOT NULL UNIQUE,  -- e.g., 'DFF', 'CPIAUCSL', 'UNRATE'
  indicator_name TEXT NOT NULL,
  category TEXT NOT NULL,  -- 'interest_rate', 'inflation', 'employment', 'market'

  -- Latest value
  value NUMERIC NOT NULL,
  unit TEXT,  -- 'percent', 'index', 'millions'

  -- Trend
  change_1m NUMERIC,
  change_1y NUMERIC,
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')),

  -- Timestamps
  observation_date DATE NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_economic_category ON economic_indicators(category);

-- Aggregated sentiment view per startup
CREATE OR REPLACE VIEW startup_sentiment AS
SELECT
  startup_slug,
  startup_name,
  COUNT(*) as source_count,
  ROUND(AVG(score)) as avg_score,
  MODE() WITHIN GROUP (ORDER BY trend) as overall_trend,
  MAX(fetched_at) as last_updated,
  JSONB_OBJECT_AGG(source, jsonb_build_object(
    'score', score,
    'trend', trend,
    'raw_value', raw_value,
    'fetched_at', fetched_at
  )) as sources
FROM sentiment_data
WHERE expires_at > NOW()
GROUP BY startup_slug, startup_name;

-- RLS policies
ALTER TABLE sentiment_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_indicators ENABLE ROW LEVEL SECURITY;

-- Everyone can read sentiment data
CREATE POLICY "Public read sentiment_data" ON sentiment_data
  FOR SELECT USING (true);

CREATE POLICY "Public read economic_indicators" ON economic_indicators
  FOR SELECT USING (true);

-- Only service role can write (edge functions)
CREATE POLICY "Service write sentiment_data" ON sentiment_data
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service write economic_indicators" ON economic_indicators
  FOR ALL USING (auth.role() = 'service_role');
