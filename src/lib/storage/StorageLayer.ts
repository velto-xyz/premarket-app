import { IStorageLayer } from './IStorageLayer'
import { SupabaseSource } from './sources/SupabaseSource'
import { ContractSource } from './sources/ContractSource'
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
 * - Supabase: Market metadata, historical data, analytics (from indexer)
 * - Contracts: Current prices, open positions, trading
 */
export class StorageLayer implements IStorageLayer {
  private supabase: SupabaseSource
  public contracts: ContractSource

  constructor(walletClient?: WalletClient) {
    this.supabase = new SupabaseSource()
    this.contracts = new ContractSource(walletClient)
  }

  // ============================================================================
  // MARKETS
  // ============================================================================

  async getAllMarkets(): Promise<Market[]> {
    const metadataList = await this.supabase.getAllMarketsMetadata()

    const markets = await Promise.all(
      metadataList.map(async (metadata) => {
        const contractInfo = await this.supabase.getMarketContractInfo(metadata.id)

        // Fetch 24h stats if we have an engine address
        let stats24h = null
        if (contractInfo?.perpEngineAddress) {
          stats24h = await this.supabase.getMarketStats24h(contractInfo.perpEngineAddress)
        }

        return {
          ...metadata,
          ...(contractInfo || {}),
          currentPrice: 0,
          openInterestLong: 0,
          openInterestShort: 0,
          baseReserve: 0,
          quoteReserve: 0,
          priceChange24h: stats24h?.change24h || 0,
          totalVolume: stats24h?.volume24h || 0
        }
      })
    )

    return markets
  }

  async getMarketContractData(marketSlug: string): Promise<Partial<Market>> {
    const metadata = await this.supabase.getMarketMetadata(marketSlug)
    if (!metadata) return {}

    const contractInfo = await this.supabase.getMarketContractInfo(metadata.id)
    if (!contractInfo?.perpMarketAddress) return {}

    try {
      const contractState = await this.contracts.getMarketState(contractInfo.perpMarketAddress)
      return contractState
    } catch (error) {
      console.error(`Failed to get market data for ${marketSlug}:`, error)
      return {}
    }
  }

  async getMarket(slug: string): Promise<Market | null> {
    const metadata = await this.supabase.getMarketMetadata(slug)
    if (!metadata) return null

    const contractInfo = await this.supabase.getMarketContractInfo(metadata.id)

    let contractState = null
    if (contractInfo?.perpMarketAddress) {
      contractState = await this.contracts.getMarketState(contractInfo.perpMarketAddress)
    }

    // Fetch 24h stats if we have an engine address
    let stats24h = null
    if (contractInfo?.perpEngineAddress) {
      stats24h = await this.supabase.getMarketStats24h(contractInfo.perpEngineAddress)
    }

    return {
      ...metadata,
      ...(contractInfo || {}),
      ...(contractState || {
        currentPrice: 0,
        openInterestLong: 0,
        openInterestShort: 0,
        baseReserve: 0,
        quoteReserve: 0
      }),
      priceChange24h: stats24h?.change24h || 0,
      totalVolume: stats24h?.volume24h || 0
    }
  }

  async getMarketsByIndustry(industrySlug: string): Promise<Market[]> {
    const metadataList = await this.supabase.getMarketsByIndustry(industrySlug)

    const markets = await Promise.all(
      metadataList.map(async (metadata) => {
        const contractInfo = await this.supabase.getMarketContractInfo(metadata.id)

        // Fetch 24h stats if we have an engine address
        let stats24h = null
        if (contractInfo?.perpEngineAddress) {
          stats24h = await this.supabase.getMarketStats24h(contractInfo.perpEngineAddress)
        }

        return {
          ...metadata,
          ...(contractInfo || {}),
          currentPrice: 0,
          openInterestLong: 0,
          openInterestShort: 0,
          baseReserve: 0,
          quoteReserve: 0,
          priceChange24h: stats24h?.change24h || 0,
          marketCap: 0,
          totalVolume: stats24h?.volume24h || 0
        }
      })
    )

    return markets
  }

  // ============================================================================
  // CURRENT POSITIONS
  // ============================================================================

  async getUserOpenPositions(userAddress: string): Promise<Position[]> {
    const markets = await this.getAllMarkets()

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

    return positionArrays.flat()
  }

  async getMarketOpenPositions(marketSlug: string): Promise<Position[]> {
    const metadata = await this.supabase.getMarketMetadata(marketSlug)
    if (!metadata) return []

    const contractInfo = await this.supabase.getMarketContractInfo(metadata.id)
    if (!contractInfo?.perpEngineAddress || !contractInfo?.positionManagerAddress) return []

    return this.contracts.getMarketOpenPositions(
      contractInfo.perpEngineAddress,
      contractInfo.positionManagerAddress,
      contractInfo.deploymentBlock || 0,
      metadata.id,
      marketSlug
    )
  }

  async getUserMarketPositions(userAddress: string, marketSlug: string): Promise<Position[]> {
    const metadata = await this.supabase.getMarketMetadata(marketSlug)
    if (!metadata) return []

    const contractInfo = await this.supabase.getMarketContractInfo(metadata.id)
    if (!contractInfo?.perpEngineAddress || !contractInfo?.positionManagerAddress) return []

    return this.contracts.getUserOpenPositions(
      userAddress,
      contractInfo.perpEngineAddress,
      contractInfo.positionManagerAddress,
      contractInfo.deploymentBlock || 0,
      metadata.id,
      marketSlug
    )
  }

  async getPosition(positionId: string): Promise<Position | null> {
    // Positions are now stored in Supabase
    return null
  }

  // ============================================================================
  // HISTORICAL DATA (from Supabase)
  // ============================================================================

  async getUserPositionHistory(userAddress: string): Promise<Position[]> {
    // Get position IDs from Supabase, details from contract
    return []
  }

  async getUserTrades(userAddress: string, limit?: number): Promise<Trade[]> {
    return this.supabase.getWalletActivity(userAddress, limit)
  }

  async getUserStats(userAddress: string): Promise<UserStats> {
    const portfolio = await this.supabase.getWalletPortfolio(userAddress)

    return {
      userId: userAddress,
      totalTrades: 0,
      totalVolume: 0,
      totalPnl: portfolio?.realizedPnl || 0,
      winRate: 0,
      openPositions: portfolio?.openPositions || 0,
      closedPositions: 0,
      liquidatedPositions: 0,
      averageHoldTime: 0,
      bestTrade: 0,
      worstTrade: 0
    }
  }

  async getUserMonthlyPnL(userAddress: string, months: number): Promise<MonthlyPnL[]> {
    return []
  }

  // ============================================================================
  // MARKET ANALYTICS (from Supabase)
  // ============================================================================

  async getMarketDailyStats(marketSlug: string, days: number): Promise<DailyStats[]> {
    return []
  }

  async getMarketPriceHistory(
    marketSlug: string,
    range: '1h' | '24h' | '7d' | '30d'
  ): Promise<PricePoint[]> {
    return this.supabase.getPriceHistory(marketSlug)
  }

  async getMarketCandlesticks(
    marketSlug: string,
    interval: '1m' | '5m' | '1h' | '1d',
    limit: number
  ): Promise<CandlestickData[]> {
    const contractInfo = await this.supabase.getMarketContractInfoBySlug(marketSlug)
    if (!contractInfo?.perpEngineAddress) return []

    const ohlcvInterval = interval === '5m' ? '5m' : interval === '1h' ? '1h' : '1d'
    return this.supabase.getOHLCV(contractInfo.perpEngineAddress, ohlcvInterval)
  }

  async getMarketVolumeByDay(marketSlug: string, days: number): Promise<VolumeByDay[]> {
    return []
  }

  // ============================================================================
  // LEADERBOARD
  // ============================================================================

  async getLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
    return []
  }

  // ============================================================================
  // TRADING (Transactions)
  // ============================================================================

  async openPosition(
    userAddress: string,
    params: OpenPositionParams
  ): Promise<TransactionResult> {
    const contractInfo = await this.supabase.getMarketContractInfoBySlug(params.marketSlug)
    if (!contractInfo) {
      throw new Error(`Market ${params.marketSlug} does not have contracts deployed`)
    }

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
    const contractInfo = await this.supabase.getMarketContractInfoBySlug(params.marketSlug)
    if (!contractInfo) {
      throw new Error(`Market ${params.marketSlug} does not have contracts deployed`)
    }

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
    throw new Error('closePosition not fully implemented - need market context')
  }

  // ============================================================================
  // WALLET / ACCOUNT
  // ============================================================================

  async getUserBalance(userAddress: string): Promise<number> {
    return 10000
  }

  async getUserAllowance(userAddress: string): Promise<number> {
    return 0
  }

  async approveUSDC(userAddress: string, amount: number): Promise<TransactionResult> {
    throw new Error('approveUSDC not fully implemented')
  }
}
