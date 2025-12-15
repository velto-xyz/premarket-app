import type {
  Market,
  Position,
  Trade,
  UserStats,
  DailyStats,
  MonthlyPnL,
  LeaderboardEntry,
  PricePoint,
  CandlestickData,
  VolumeByDay,
  OpenPositionParams,
  ClosePositionParams,
  TransactionResult
} from '@/types/models'

/**
 * Storage Layer Interface
 *
 * Abstracts data access from multiple sources:
 * - Supabase: Market metadata, company info
 * - Contract API: Current prices, open positions, trading
 * - Envio Indexer: Historical data, analytics, charts
 */
export interface IStorageLayer {
  // -------------------------
  // MARKETS
  // -------------------------

  /**
   * Get all available markets
   */
  getAllMarkets(): Promise<Market[]>

  /**
   * Get single market by slug
   */
  getMarket(slug: string): Promise<Market | null>

  /**
   * Get markets filtered by industry
   */
  getMarketsByIndustry(industrySlug: string): Promise<Market[]>

  // -------------------------
  // CURRENT POSITIONS
  // -------------------------

  /**
   * Get user's currently open positions
   * Source: Contract API (real-time)
   */
  getUserOpenPositions(userAddress: string): Promise<Position[]>

  /**
   * Get all open positions for a specific market
   * Source: Contract API (real-time)
   */
  getMarketOpenPositions(marketSlug: string): Promise<Position[]>

  /**
   * Get user's open positions for a specific market
   * Source: Contract API (real-time)
   */
  getUserMarketPositions(userAddress: string, marketSlug: string): Promise<Position[]>

  /**
   * Get single position by ID
   * Source: Contract API for open positions, Indexer for closed
   */
  getPosition(positionId: string): Promise<Position | null>

  // -------------------------
  // HISTORICAL DATA
  // -------------------------

  /**
   * Get user's complete position history (open + closed)
   * Source: Envio Indexer
   */
  getUserPositionHistory(userAddress: string): Promise<Position[]>

  /**
   * Get user's trade history
   * Source: Envio Indexer
   */
  getUserTrades(userAddress: string, limit?: number): Promise<Trade[]>

  /**
   * Get aggregated user statistics
   * Source: Envio Indexer
   */
  getUserStats(userAddress: string): Promise<UserStats>

  /**
   * Get user's PnL aggregated by month
   * Source: Envio Indexer
   */
  getUserMonthlyPnL(userAddress: string, months: number): Promise<MonthlyPnL[]>

  // -------------------------
  // MARKET ANALYTICS
  // -------------------------

  /**
   * Get daily statistics for a market
   * Source: Envio Indexer
   */
  getMarketDailyStats(marketSlug: string, days: number): Promise<DailyStats[]>

  /**
   * Get price history for charts
   * Source: Envio Indexer
   */
  getMarketPriceHistory(
    marketSlug: string,
    range: '1h' | '24h' | '7d' | '30d'
  ): Promise<PricePoint[]>

  /**
   * Get candlestick data for advanced charts
   * Source: Envio Indexer
   */
  getMarketCandlesticks(
    marketSlug: string,
    interval: '1m' | '5m' | '1h' | '1d',
    limit: number
  ): Promise<CandlestickData[]>

  /**
   * Get volume aggregated by day
   * Source: Envio Indexer
   */
  getMarketVolumeByDay(marketSlug: string, days: number): Promise<VolumeByDay[]>

  // -------------------------
  // LEADERBOARD
  // -------------------------

  /**
   * Get top traders by PnL
   * Source: Envio Indexer
   */
  getLeaderboard(limit: number): Promise<LeaderboardEntry[]>

  // -------------------------
  // TRADING (Transactions)
  // -------------------------

  /**
   * Open a new leveraged position
   * Source: Contract API (writes to blockchain)
   */
  openPosition(
    userAddress: string,
    params: OpenPositionParams
  ): Promise<TransactionResult>

  /**
   * Deposit and open position with permit signature (1 transaction)
   * Uses EIP-2612 gasless approval
   * Source: Contract API (writes to blockchain)
   */
  depositAndOpenPositionWithPermit(
    userAddress: string,
    params: OpenPositionParams,
    depositAmount: number
  ): Promise<TransactionResult>

  /**
   * Close an existing position
   * Source: Contract API (writes to blockchain)
   */
  closePosition(
    userAddress: string,
    params: ClosePositionParams
  ): Promise<TransactionResult>

  // -------------------------
  // WALLET / ACCOUNT
  // -------------------------

  /**
   * Get user's USDC balance in PerpEngine
   * Source: Contract API
   */
  getUserBalance(userAddress: string): Promise<number>

  /**
   * Get USDC allowance for PerpEngine
   * Source: Contract API
   */
  getUserAllowance(userAddress: string): Promise<number>

  /**
   * Approve USDC spending for PerpEngine
   * Source: Contract API
   */
  approveUSDC(userAddress: string, amount: number): Promise<TransactionResult>
}
