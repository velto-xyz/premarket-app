/**
 * Storage Layer
 *
 * Unified data access layer that abstracts UI from data sources
 *
 * Data Sources:
 * - Supabase: Market metadata, company information, logos
 * - Smart Contracts: Current prices, open positions, trading transactions
 * - Envio Indexer: Historical positions, analytics, charts
 *
 * Usage:
 * ```ts
 * import { storage } from '@/lib/storage'
 *
 * // Get market with current price from contracts
 * const market = await storage.getMarket('spacex-perp')
 *
 * // Get user's open positions from blockchain
 * const positions = await storage.getUserOpenPositions('0x123...')
 *
 * // Get historical analytics from indexer
 * const monthlyPnL = await storage.getUserMonthlyPnL('0x123...', 6)
 * ```
 */

export type { IStorageLayer } from './IStorageLayer'
export { StorageLayer } from './StorageLayer'

// Export singleton instance
import { StorageLayer } from './StorageLayer'
export const storage = new StorageLayer()

// Re-export model types for convenience
export type {
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
