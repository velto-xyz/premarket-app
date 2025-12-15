import { IStorageLayer } from './IStorageLayer'
import { SupabaseSource } from './sources/SupabaseSource'
import { ContractSource } from './sources/ContractSource'
import { EnvioSource } from './sources/EnvioSource'
import type { WalletClient } from 'viem'

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
 * Storage Layer Implementation
 *
 * Orchestrates data access from multiple sources:
 * - Supabase: Market metadata, company info
 * - Contracts: Current prices, open positions, trading
 * - Envio: Historical data, analytics, charts
 */
export class StorageLayer implements IStorageLayer {
  private supabase: SupabaseSource
  public contracts: ContractSource
  private indexer: EnvioSource

  constructor(walletClient?: WalletClient) {
    this.supabase = new SupabaseSource()
    this.contracts = new ContractSource(walletClient)
    this.indexer = new EnvioSource()
  }

  // ============================================================================
  // MARKETS
  // ============================================================================

  async getAllMarkets(): Promise<Market[]> {
    // Get metadata from Supabase (fast)
    const metadataList = await this.supabase.getAllMarketsMetadata()

    // Return immediately with placeholders - contract data fetched separately
    const markets = await Promise.all(
      metadataList.map(async (metadata) => {
        const contractInfo = await this.supabase.getMarketContractInfo(metadata.id)

        return {
          ...metadata,
          ...(contractInfo || {}),
          // Placeholders - will be updated by polling
          currentPrice: 0,
          openInterestLong: 0,
          openInterestShort: 0,
          baseReserve: 0,
          quoteReserve: 0,
          priceChange24h: 0,
          totalVolume: 0
        }
      })
    )

    return markets
  }

  /**
   * Get market data from contracts (for polling/streaming)
   */
  async getMarketContractData(marketSlug: string): Promise<Partial<Market>> {
    const metadata = await this.supabase.getMarketMetadata(marketSlug)
    if (!metadata) {
      return {}
    }

    const contractInfo = await this.supabase.getMarketContractInfo(metadata.id)
    if (!contractInfo?.perpMarketAddress) {
      return {}
    }

    try {
      const contractState = await this.contracts.getMarketState(contractInfo.perpMarketAddress)
      return contractState
    } catch (error) {
      console.error(`Failed to get market data for ${marketSlug}:`, error)
      return {}
    }
  }

  async getMarket(slug: string): Promise<Market | null> {
    // 1. Get metadata from Supabase
    const metadata = await this.supabase.getMarketMetadata(slug)
    if (!metadata) {
      return null
    }

    // 2. Get contract info
    const contractInfo = await this.supabase.getMarketContractInfo(metadata.id)

    // 3. Get current state from contracts (if deployed)
    let contractState = null
    if (contractInfo?.perpMarketAddress) {
      contractState = await this.contracts.getMarketState(contractInfo.perpMarketAddress)
    }

    // 4. Get historical data from indexer (if available)
    let historicalData = null
    if (contractInfo?.perpEngineAddress) {
      historicalData = await this.indexer.getMarketHistoricalData(slug)
    }

    // 5. Merge all data
    return {
      ...metadata,
      ...(contractInfo || {}),
      // Contract state with defaults
      ...(contractState || {
        currentPrice: 0,
        openInterestLong: 0,
        openInterestShort: 0,
        baseReserve: 0,
        quoteReserve: 0
      }),
      // Historical data with defaults
      ...(historicalData || {
        priceChange24h: 0,
        totalVolume: 0
      })
    }
  }

  async getMarketsByIndustry(industrySlug: string): Promise<Market[]> {
    const metadataList = await this.supabase.getMarketsByIndustry(industrySlug)

    // Return immediately with placeholders - contract data fetched separately
    const markets = await Promise.all(
      metadataList.map(async (metadata) => {
        const contractInfo = await this.supabase.getMarketContractInfo(metadata.id)

        return {
          ...metadata,
          ...(contractInfo || {}),
          // Placeholders - will be updated by polling
          currentPrice: 0,
          openInterestLong: 0,
          openInterestShort: 0,
          baseReserve: 0,
          quoteReserve: 0,
          priceChange24h: 0,
          marketCap: 0,
          totalVolume: 0
        }
      })
    )

    return markets
  }

  // ============================================================================
  // CURRENT POSITIONS
  // ============================================================================

  /**
   * Get user's open positions across all markets
   * Currently queries each market separately - will be optimized with Envio
   */
  async getUserOpenPositions(userAddress: string): Promise<Position[]> {
    // Get all markets with contract info
    const markets = await this.getAllMarkets()

    // Query positions from each deployed market
    const positionArrays = await Promise.all(
      markets
        .filter(m => m.perpEngineAddress && m.positionManagerAddress && m.deploymentBlock)
        .map(market =>
          this.contracts.getUserOpenPositions(
            userAddress,
            market.perpEngineAddress!,
            market.positionManagerAddress!,
            market.deploymentBlock!,
            market.id,
            market.slug
          )
        )
    )

    // Flatten arrays
    return positionArrays.flat()
  }

  /**
   * Get all open positions for a specific market
   */
  async getMarketOpenPositions(marketSlug: string): Promise<Position[]> {
    // Get market metadata and contract info
    const metadata = await this.supabase.getMarketMetadata(marketSlug)
    if (!metadata) {
      return []
    }

    const contractInfo = await this.supabase.getMarketContractInfo(metadata.id)
    if (!contractInfo?.perpEngineAddress || !contractInfo?.positionManagerAddress) {
      console.warn(`Market ${marketSlug} has no contract deployment`)
      return []
    }

    return this.contracts.getMarketOpenPositions(
      contractInfo.perpEngineAddress,
      contractInfo.positionManagerAddress,
      contractInfo.deploymentBlock || 0,
      metadata.id,
      marketSlug
    )
  }

  /**
   * Get user's open positions for a specific market
   */
  async getUserMarketPositions(userAddress: string, marketSlug: string): Promise<Position[]> {
    console.log('[StorageLayer] getUserMarketPositions:', { userAddress, marketSlug })

    // Get market metadata and contract info
    const metadata = await this.supabase.getMarketMetadata(marketSlug)
    if (!metadata) {
      console.warn('[StorageLayer] No metadata found for', marketSlug)
      return []
    }

    const contractInfo = await this.supabase.getMarketContractInfo(metadata.id)
    if (!contractInfo?.perpEngineAddress || !contractInfo?.positionManagerAddress) {
      console.warn(`[StorageLayer] Market ${marketSlug} has no contract deployment`)
      return []
    }

    console.log('[StorageLayer] Contract info:', contractInfo)

    const positions = await this.contracts.getUserOpenPositions(
      userAddress,
      contractInfo.perpEngineAddress,
      contractInfo.positionManagerAddress,
      contractInfo.deploymentBlock || 0,
      metadata.id,
      marketSlug
    )

    console.log('[StorageLayer] Returned', positions.length, 'positions')
    return positions
  }

  async getPosition(positionId: string): Promise<Position | null> {
    // TODO: Need market context to fetch position
    // For now, return null - will be implemented when needed
    console.warn('StorageLayer.getPosition - not implemented yet, need market context')

    // Fall back to indexer (for closed positions)
    if (this.indexer.isReady()) {
      return this.indexer.getPosition(positionId)
    }

    return null
  }

  // ============================================================================
  // HISTORICAL DATA
  // ============================================================================

  async getUserPositionHistory(userAddress: string): Promise<Position[]> {
    if (this.indexer.isReady()) {
      return this.indexer.getUserPositions(userAddress)
    }

    // Fallback to legacy Supabase data during migration
    console.warn('Indexer not ready, using legacy Supabase positions')
    const legacyData = await this.supabase.getLegacyPositions(userAddress)
    return [] // TODO: Map legacy data to Position[] format if needed
  }

  async getUserTrades(userAddress: string, limit?: number): Promise<Trade[]> {
    if (this.indexer.isReady()) {
      return this.indexer.getUserTrades(userAddress, limit)
    }

    return []
  }

  async getUserStats(userAddress: string): Promise<UserStats> {
    if (this.indexer.isReady()) {
      return this.indexer.getUserStats(userAddress)
    }

    // Return empty stats if indexer not ready
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

  async getUserMonthlyPnL(userAddress: string, months: number): Promise<MonthlyPnL[]> {
    if (this.indexer.isReady()) {
      return this.indexer.getMonthlyPnL(userAddress, months)
    }

    return []
  }

  // ============================================================================
  // MARKET ANALYTICS
  // ============================================================================

  async getMarketDailyStats(marketSlug: string, days: number): Promise<DailyStats[]> {
    if (this.indexer.isReady()) {
      return this.indexer.getMarketDailyStats(marketSlug, days)
    }

    return []
  }

  async getMarketPriceHistory(
    marketSlug: string,
    range: '1h' | '24h' | '7d' | '30d'
  ): Promise<PricePoint[]> {
    if (this.indexer.isReady()) {
      return this.indexer.getPriceHistory(marketSlug, range)
    }

    return []
  }

  async getMarketCandlesticks(
    marketSlug: string,
    interval: '1m' | '5m' | '1h' | '1d',
    limit: number
  ): Promise<CandlestickData[]> {
    if (this.indexer.isReady()) {
      return this.indexer.getCandlesticks(marketSlug, interval, limit)
    }

    return []
  }

  async getMarketVolumeByDay(marketSlug: string, days: number): Promise<VolumeByDay[]> {
    if (this.indexer.isReady()) {
      return this.indexer.getVolumeByDay(marketSlug, days)
    }

    return []
  }

  // ============================================================================
  // LEADERBOARD
  // ============================================================================

  async getLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
    if (this.indexer.isReady()) {
      return this.indexer.getLeaderboard(limit)
    }

    return []
  }

  // ============================================================================
  // TRADING (Transactions)
  // ============================================================================

  async openPosition(
    userAddress: string,
    params: OpenPositionParams
  ): Promise<TransactionResult> {
    // 1. Get market contract addresses from Supabase
    const contractInfo = await this.supabase.getMarketContractInfoBySlug(params.marketSlug)
    if (!contractInfo) {
      throw new Error(`Market ${params.marketSlug} does not have contracts deployed`)
    }

    // 2. Execute trade via contracts
    return this.contracts.openPosition(
      userAddress,
      contractInfo.perpEngineAddress,
      params
    )
  }

  async depositAndOpenPositionWithPermit(
    userAddress: string,
    params: OpenPositionParams,
    depositAmount: number
  ): Promise<TransactionResult> {
    // 1. Get market contract addresses from Supabase
    const contractInfo = await this.supabase.getMarketContractInfoBySlug(params.marketSlug)
    if (!contractInfo) {
      throw new Error(`Market ${params.marketSlug} does not have contracts deployed`)
    }

    // 2. Execute deposit + open with permit
    return this.contracts.depositAndOpenPositionWithPermit(
      userAddress,
      contractInfo.perpEngineAddress,
      params,
      depositAmount
    )
  }

  async closePosition(
    userAddress: string,
    params: ClosePositionParams
  ): Promise<TransactionResult> {
    // TODO: Need to know which market the position belongs to
    // For now, this is a stub
    throw new Error('closePosition not fully implemented - need market context')
  }

  // ============================================================================
  // WALLET / ACCOUNT
  // ============================================================================

  async getUserBalance(userAddress: string): Promise<number> {
    // TODO: Need to know which market/engine to query
    // For now, return mock data
    return 10000
  }

  async getUserAllowance(userAddress: string): Promise<number> {
    // TODO: Need USDC address and engine address
    return 0
  }

  async approveUSDC(userAddress: string, amount: number): Promise<TransactionResult> {
    // TODO: Need USDC address and engine address
    throw new Error('approveUSDC not fully implemented')
  }
}
