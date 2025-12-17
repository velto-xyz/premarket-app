import { supabase } from '@/integrations/supabase/client'
import type {
  MarketMetadata,
  MarketContractInfo,
  PricePoint,
  CandlestickData,
  Trade
} from '@/types/models'

export interface WalletPortfolio {
  walletAddress: string
  openPositions: number
  totalMargin: number
  realizedPnl: number
}

export interface MarketStats24h {
  engine: string
  high24h: number
  low24h: number
  volume24h: number
  change24h: number
}

export interface PeriodStats {
  high: number
  low: number
  volume: number
  changePct: number
}

/**
 * Supabase Source
 *
 * Handles all database queries. Primary data source for:
 * - Market metadata
 * - Historical trades/positions (from indexer)
 * - OHLCV data (materialized views)
 * - Portfolio/stats
 */
export class SupabaseSource {
  // ============================================================================
  // MARKET METADATA
  // ============================================================================

  async getMarketMetadata(slug: string): Promise<MarketMetadata | null> {
    const { data, error } = await supabase
      .from('startups')
      .select(`
        id, name, slug, description, logo_url, industry_id,
        hq_location, hq_latitude, hq_longitude, unicorn_color,
        year_founded, founders
      `)
      .eq('slug', slug)
      .single()

    if (error || !data) {
      console.error('Error fetching market metadata:', error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description || '',
      logoUrl: data.logo_url || '',
      industryId: data.industry_id,
      hqLocation: data.hq_location || undefined,
      hqLatitude: data.hq_latitude || undefined,
      hqLongitude: data.hq_longitude || undefined,
      unicornColor: data.unicorn_color || undefined,
      yearFounded: data.year_founded || undefined,
      founders: data.founders || undefined
    }
  }

  async getAllMarketsMetadata(): Promise<MarketMetadata[]> {
    const { data, error } = await supabase
      .from('startups')
      .select(`
        id, name, slug, description, logo_url, industry_id,
        hq_location, hq_latitude, hq_longitude, unicorn_color,
        year_founded, founders
      `)
      .order('name')

    if (error || !data) {
      console.error('Error fetching all markets:', error)
      return []
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description || '',
      logoUrl: item.logo_url || '',
      industryId: item.industry_id,
      hqLocation: item.hq_location || undefined,
      hqLatitude: item.hq_latitude || undefined,
      hqLongitude: item.hq_longitude || undefined,
      unicornColor: item.unicorn_color || undefined,
      yearFounded: item.year_founded || undefined,
      founders: item.founders || undefined
    }))
  }

  async getMarketsByIndustry(industrySlug: string): Promise<MarketMetadata[]> {
    const { data: industry } = await supabase
      .from('industries')
      .select('id')
      .eq('slug', industrySlug)
      .single()

    if (!industry) return []

    const { data, error } = await supabase
      .from('startups')
      .select(`
        id, name, slug, description, logo_url, industry_id,
        hq_location, hq_latitude, hq_longitude, unicorn_color
      `)
      .eq('industry_id', industry.id)
      .order('name')

    if (error || !data) {
      console.error('Error fetching markets by industry:', error)
      return []
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description || '',
      logoUrl: item.logo_url || '',
      industryId: item.industry_id,
      hqLocation: item.hq_location || undefined,
      hqLatitude: item.hq_latitude || undefined,
      hqLongitude: item.hq_longitude || undefined,
      unicornColor: item.unicorn_color || undefined
    }))
  }

  // ============================================================================
  // CONTRACT INFO
  // ============================================================================

  async getMarketContractInfo(marketId: string): Promise<MarketContractInfo | null> {
    const { data, error } = await supabase
      .from('market_contracts')
      .select(`
        startup_id, perp_engine_address, perp_market_address,
        position_manager_address, chain_id, deployment_block
      `)
      .eq('startup_id', marketId)
      .eq('is_active', true)
      .single()

    if (error || !data) return null

    return {
      marketId: data.startup_id,
      contractAddress: data.perp_engine_address,
      perpEngineAddress: data.perp_engine_address,
      perpMarketAddress: data.perp_market_address,
      positionManagerAddress: data.position_manager_address,
      chainId: data.chain_id,
      deploymentBlock: data.deployment_block
    }
  }

  async getMarketContractInfoBySlug(slug: string): Promise<MarketContractInfo | null> {
    const metadata = await this.getMarketMetadata(slug)
    if (!metadata) return null
    return this.getMarketContractInfo(metadata.id)
  }

  async getAllMarketsWithContracts() {
    const { data, error } = await supabase
      .from('markets_with_contracts')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching markets with contracts:', error)
      return []
    }

    return data || []
  }

  // ============================================================================
  // WALLET/USER MANAGEMENT
  // ============================================================================

  async linkWalletToUser(walletAddress: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('wallets')
      .upsert({
        address: walletAddress,
        user_id: userId
      })

    if (error) {
      console.error('Error linking wallet to user:', error)
      return false
    }
    return true
  }

  async getWalletsByUser(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('wallets')
      .select('address')
      .eq('user_id', userId)

    if (error || !data) return []
    return data.map(w => w.address)
  }

  // ============================================================================
  // PORTFOLIO QUERIES
  // ============================================================================

  async getWalletPortfolio(walletAddress: string): Promise<WalletPortfolio | null> {
    const { data, error } = await supabase
      .from('wallet_portfolio')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single()

    if (error || !data) return null

    return {
      walletAddress: data.wallet_address,
      openPositions: data.open_positions || 0,
      totalMargin: Number(data.total_margin) || 0,
      realizedPnl: Number(data.realized_pnl) || 0
    }
  }

  async getWalletActivity(walletAddress: string, limit = 50): Promise<Trade[]> {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_address', walletAddress.toLowerCase())
      .order('timestamp', { ascending: false })
      .limit(limit)

    console.log("[SupabaseSource] trades query result:", { data, error });
    if (error || !data) return []

    return data.map(t => ({
      id: t.id,
      positionId: t.position_id,
      userId: t.user_address,
      marketSlug: '', // Would need to resolve from engine
      type: t.event_type as 'open' | 'close' | 'liquidation',
      side: t.is_long ? 'long' : 'short',
      price: Number(t.price),
      size: Number(t.base_size),
      notional: Number(t.notional),
      fee: 0,
      pnl: t.pnl ? Number(t.pnl) : undefined,
      timestamp: new Date(t.timestamp),
      blockNumber: Number(t.block_number),
      txHash: t.tx_hash
    }))
  }

  // ============================================================================
  // MARKET RANKINGS
  // ============================================================================

  async getMarketRankings(): Promise<Array<{ engine: string; totalChange: number }>> {
    const { data, error } = await supabase
      .from('market_rankings')
      .select('engine, total_change')

    if (error || !data) return []

    return data.map(r => ({
      engine: r.engine,
      totalChange: Number(r.total_change)
    }))
  }

  // ============================================================================
  // MARKET STATS
  // ============================================================================

  async getMarketStats24h(engine: string): Promise<MarketStats24h | null> {
    const { data, error } = await supabase
      .from('market_stats_24h')
      .select('*')
      .eq('engine', engine)
      .single()

    if (error || !data) return null

    return {
      engine: data.engine,
      high24h: Number(data.high_24h) || 0,
      low24h: Number(data.low_24h) || 0,
      volume24h: Number(data.volume_24h) || 0,
      change24h: Number(data.change_24h) || 0
    }
  }

  async getPeriodStats(engine: string, interval: 'D' | 'W' | 'M' | '3M' | 'Y' | 'ALL'): Promise<PeriodStats | null> {
    const { data, error } = await supabase
      .rpc('get_period_stats', {
        p_engine: engine,
        p_interval: interval
      })

    if (error || !data || data.length === 0) return null

    const row = data[0]
    return {
      high: Number(row.high) || 0,
      low: Number(row.low) || 0,
      volume: Number(row.volume) || 0,
      changePct: Number(row.change_pct) || 0
    }
  }

  // ============================================================================
  // OHLCV / CHART DATA
  // ============================================================================

  async getOHLCV(
    engine: string,
    interval: '5m' | '1h' | '1d',
    since?: Date
  ): Promise<CandlestickData[]> {
    const table = interval === '5m' ? 'ohlcv_5min' : interval === '1h' ? 'hourly_ohlcv' : 'daily_stats'
    const sinceTime = since || new Date(0)

    const { data, error } = await supabase
      .from(table)
      .select('bucket, open, high, low, close, volume')
      .eq('engine', engine)
      .gte('bucket', sinceTime.toISOString())
      .order('bucket', { ascending: true })

    if (error || !data) return []

    return data.map(row => ({
      timestamp: new Date(row.bucket),
      open: Number(row.open) || 0,
      high: Number(row.high) || 0,
      low: Number(row.low) || 0,
      close: Number(row.close) || 0,
      volume: Number(row.volume) || 0
    }))
  }

  async get7dTrend(engine: string): Promise<PricePoint[]> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('hourly_ohlcv')
      .select('bucket, close')
      .eq('engine', engine)
      .gte('bucket', since.toISOString())
      .order('bucket', { ascending: true })

    if (error || !data || data.length === 0) return []

    const points: PricePoint[] = data.map(row => ({
      timestamp: new Date(row.bucket),
      price: Number(row.close) || 0
    }))

    // Backfill initial price at 7d start if first point is after that
    if (points.length > 0 && points[0].timestamp > since) {
      points.unshift({
        timestamp: since,
        price: points[0].price
      })
    }

    return points
  }

  // ============================================================================
  // POSITION QUERIES
  // ============================================================================

  async getOpenPositionIds(walletAddress: string, engine?: string): Promise<string[]> {
    let query = supabase
      .from('positions')
      .select('id')
      .eq('user_address', walletAddress.toLowerCase())
      .eq('status', 'open')

    if (engine) {
      query = query.eq('engine', engine)
    }

    const { data, error } = await query

    if (error || !data) return []
    return data.map(p => p.id.toString())
  }

  // ============================================================================
  // PRICE HISTORY (for charts)
  // ============================================================================

  async getPriceHistory(marketSlug: string, since?: Date): Promise<PricePoint[]> {
    // Get engine address from market slug
    const contractInfo = await this.getMarketContractInfoBySlug(marketSlug)
    if (!contractInfo) return []

    return this.getPriceHistoryByEngine(contractInfo.perpEngineAddress, since)
  }

  async getPriceHistoryByEngine(engine: string, since?: Date): Promise<PricePoint[]> {
    const sinceTime = since || new Date(Date.now() - 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('hourly_ohlcv')
      .select('bucket, close')
      .eq('engine', engine)
      .gte('bucket', sinceTime.toISOString())
      .order('bucket', { ascending: true })

    if (error || !data) return []

    return data.map(row => ({
      timestamp: new Date(row.bucket),
      price: Number(row.close) || 0
    }))
  }

  // ============================================================================
  // 24H STATS (convenience method using view)
  // ============================================================================

  async get24hStats(marketSlug: string): Promise<{ high: number; low: number; volume: number }> {
    const contractInfo = await this.getMarketContractInfoBySlug(marketSlug)
    if (!contractInfo) return { high: 0, low: 0, volume: 0 }

    const stats = await this.getMarketStats24h(contractInfo.perpEngineAddress)
    if (!stats) return { high: 0, low: 0, volume: 0 }

    return {
      high: stats.high24h,
      low: stats.low24h,
      volume: stats.volume24h
    }
  }

  // ============================================================================
  // PLATFORM STATS
  // ============================================================================

  async getPlatformVolumeByDay(days: number = 30): Promise<{ day: string; volume: number }[]> {
    const { data, error } = await supabase
      .from('hourly_ohlcv')
      .select('bucket, volume')
      .gte('bucket', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('bucket', { ascending: true })

    if (error || !data) return []

    // Aggregate by day
    const volumeByDay: Record<string, number> = {}
    for (const row of data) {
      const day = new Date(row.bucket).toISOString().split('T')[0]
      volumeByDay[day] = (volumeByDay[day] || 0) + Number(row.volume)
    }

    return Object.entries(volumeByDay).map(([day, volume]) => ({ day, volume }))
  }
}
