import type { PublicClient, Address } from 'viem'
import {
  perpMarketAbi,
  perpEngineAbi,
  type MarketData
} from '@velto/contracts'

/**
 * Market Data Service
 * Fetches real-time market data from contracts
 */
export class MarketDataService {
  constructor(private publicClient: PublicClient) {}

  /**
   * Get current mark price
   */
  async getMarkPrice(marketAddress: Address): Promise<bigint> {
    try {
      return await this.publicClient.readContract({
        address: marketAddress,
        abi: perpMarketAbi,
        functionName: 'getMarkPrice',
        args: []
      }) as bigint
    } catch (error) {
      console.error(`[MarketDataService] getMarkPrice failed for ${marketAddress}:`, error)
      throw error
    }
  }

  /**
   * Get market reserves (separate calls)
   */
  async getReserves(marketAddress: Address): Promise<{
    baseReserve: bigint
    quoteReserve: bigint
  }> {
    try {
      const [baseReserve, quoteReserve] = await Promise.all([
        this.publicClient.readContract({
          address: marketAddress,
          abi: perpMarketAbi,
          functionName: 'baseReserve',
          args: []
        }) as Promise<bigint>,
        this.publicClient.readContract({
          address: marketAddress,
          abi: perpMarketAbi,
          functionName: 'quoteReserve',
          args: []
        }) as Promise<bigint>
      ])

      return { baseReserve, quoteReserve }
    } catch (error) {
      console.error(`[MarketDataService] getReserves failed for ${marketAddress}:`, error)
      throw error
    }
  }

  /**
   * Get open interest (long/short) - separate calls
   */
  async getOpenInterest(marketAddress: Address): Promise<{
    longOI: bigint
    shortOI: bigint
    netOI: bigint
  }> {
    try {
      const [longOI, shortOI] = await Promise.all([
        this.publicClient.readContract({
          address: marketAddress,
          abi: perpMarketAbi,
          functionName: 'longOpenInterest',
          args: []
        }) as Promise<bigint>,
        this.publicClient.readContract({
          address: marketAddress,
          abi: perpMarketAbi,
          functionName: 'shortOpenInterest',
          args: []
        }) as Promise<bigint>
      ])

      const netOI = longOI > shortOI ? longOI - shortOI : shortOI - longOI

      return { longOI, shortOI, netOI }
    } catch (error) {
      console.error(`[MarketDataService] getOpenInterest failed for ${marketAddress}:`, error)
      throw error
    }
  }


  /**
   * Get fund balances (trade, insurance, protocol)
   */
  async getFundBalances(engineAddress: Address): Promise<{
    tradeFund: bigint
    insuranceFund: bigint
    protocolFees: bigint
  }> {
    const result = await this.publicClient.readContract({
      address: engineAddress,
      abi: perpEngineAbi,
      functionName: 'getFundBalances',
      args: []
    }) as [bigint, bigint, bigint]

    return {
      tradeFund: result[0],
      insuranceFund: result[1],
      protocolFees: result[2]
    }
  }

  /**
   * Simulate opening a position to get estimated entry price with slippage
   */
  async simulateOpenPosition(
    marketAddress: Address,
    isLong: boolean,
    notional: bigint
  ): Promise<{ baseSize: bigint; avgPrice: bigint }> {
    try {
      if (isLong) {
        // simulateOpenLong(quoteIn) -> (baseOut, avgPrice)
        const result = await this.publicClient.readContract({
          address: marketAddress,
          abi: perpMarketAbi,
          functionName: 'simulateOpenLong',
          args: [notional]
        }) as [bigint, bigint]
        return { baseSize: result[0], avgPrice: result[1] }
      } else {
        // simulateOpenShort(quoteOut) -> (baseIn, avgPrice)
        const result = await this.publicClient.readContract({
          address: marketAddress,
          abi: perpMarketAbi,
          functionName: 'simulateOpenShort',
          args: [notional]
        }) as [bigint, bigint]
        return { baseSize: result[0], avgPrice: result[1] }
      }
    } catch (error) {
      console.error(`[MarketDataService] simulateOpenPosition failed:`, error)
      throw error
    }
  }

  /**
   * Get market deployment info for indexing
   */
  async getMarketInfo(engineAddress: Address): Promise<{
    perpEngine: Address
    perpMarket: Address
    positionMgr: Address
    chainId: bigint
    deployBlock: bigint
  }> {
    const result = await this.publicClient.readContract({
      address: engineAddress,
      abi: perpEngineAbi,
      functionName: 'getMarketInfo',
      args: []
    }) as [Address, Address, Address, bigint, bigint]

    return {
      perpEngine: result[0],
      perpMarket: result[1],
      positionMgr: result[2],
      chainId: result[3],
      deployBlock: result[4]
    }
  }
}
