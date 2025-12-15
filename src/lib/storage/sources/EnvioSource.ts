import type {
  Position,
  Trade,
  UserStats,
  DailyStats,
  MonthlyPnL,
  LeaderboardEntry,
  PricePoint,
  CandlestickData,
  VolumeByDay,
  MarketHistoricalData
} from '@/types/models'

/**
 * Envio Source (STUB)
 *
 * Handles fetching historical data from Envio indexer via GraphQL
 * TODO: Integrate actual Envio GraphQL client
 */
export class EnvioSource {
  private isIndexerReady = false

  /**
   * Check if indexer is ready
   */
  isReady(): boolean {
    return this.isIndexerReady
  }

  /**
   * Get market historical data (24h price change, total volume)
   * TODO: GraphQL query to Envio
   */
  async getMarketHistoricalData(marketSlug: string): Promise<MarketHistoricalData | null> {
    console.warn('EnvioSource.getMarketHistoricalData - using mock data')

    return null
  }

  /**
   * Get user's complete position history (open + closed)
   * TODO: GraphQL query to Envio
   */
  async getUserPositions(userAddress: string): Promise<Position[]> {
    console.warn('EnvioSource.getUserPositions - using mock data')

    return []
  }

  /**
   * Get user's trade history
   * TODO: GraphQL query to Envio
   */
  async getUserTrades(userAddress: string, limit = 100): Promise<Trade[]> {
    console.warn('EnvioSource.getUserTrades - using mock data')

    return []
  }

  /**
   * Get aggregated user statistics
   * TODO: GraphQL query to Envio User entity
   */
  async getUserStats(userAddress: string): Promise<UserStats> {
    console.warn('EnvioSource.getUserStats - using mock data')

    return {
      userId: userAddress,
      totalTrades: 0,
      totalVolume: 0,
      totalPnl: 0,
      winRate: 0,
      openPositions: 0,
      closedPositions: 0,
      liquidatedPositions: 0,
      averageHoldTime: 0,
      bestTrade: 0,
      worstTrade: 0
    }
  }

  /**
   * Get user's PnL aggregated by month
   * TODO: GraphQL query with aggregation
   */
  async getMonthlyPnL(userAddress: string, months: number): Promise<MonthlyPnL[]> {
    console.warn('EnvioSource.getMonthlyPnL - using mock data')

    return []
  }

  /**
   * Get daily statistics for a market
   * TODO: GraphQL query to Envio DailyStats entity
   */
  async getMarketDailyStats(marketSlug: string, days: number): Promise<DailyStats[]> {
    console.warn('EnvioSource.getMarketDailyStats - using mock data')

    return []
  }

  /**
   * Get price history for charts
   * TODO: GraphQL query to position events, aggregate prices
   */
  async getPriceHistory(
    marketSlug: string,
    range: '1h' | '24h' | '7d' | '30d'
  ): Promise<PricePoint[]> {
    console.warn('EnvioSource.getPriceHistory - using mock data')

    return []
  }

  /**
   * Get candlestick data for advanced charts
   * TODO: GraphQL query with time-based aggregation
   */
  async getCandlesticks(
    marketSlug: string,
    interval: '1m' | '5m' | '1h' | '1d',
    limit: number
  ): Promise<CandlestickData[]> {
    console.warn('EnvioSource.getCandlesticks - using mock data')

    return []
  }

  /**
   * Get volume aggregated by day
   * TODO: GraphQL query to DailyStats entity
   */
  async getVolumeByDay(marketSlug: string, days: number): Promise<VolumeByDay[]> {
    console.warn('EnvioSource.getVolumeByDay - using mock data')

    return []
  }

  /**
   * Get top traders by PnL
   * TODO: GraphQL query to User entities ordered by totalPnl
   */
  async getLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
    console.warn('EnvioSource.getLeaderboard - using mock data')

    return []
  }

  /**
   * Get single position by ID
   * TODO: GraphQL query by position ID
   */
  async getPosition(positionId: string): Promise<Position | null> {
    console.warn('EnvioSource.getPosition - using mock data')

    return null
  }
}
