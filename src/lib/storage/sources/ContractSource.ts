import type {
  MarketState,
  Position as AppPosition,
  OpenPositionParams,
  ClosePositionParams,
  TransactionResult
} from '@/types/models'
import { createPublicViemClient, getChainId } from '@/lib/viem-client'
import type { Address, WalletClient, PublicClient } from 'viem'
import {
  TradeService,
  PositionsService,
  MarketDataService,
  getDeployment,
  formatPrice,
  type Position as ContractPosition
} from '@/integrations/contract-api'

/**
 * Contract Source
 * Handles reading/writing contract data using @velto/contracts SDK
 */
export class ContractSource {
  private publicClient: PublicClient
  private walletClient?: WalletClient
  private tradeService?: TradeService
  private positionsService: PositionsService
  private marketDataService: MarketDataService

  constructor(walletClient?: WalletClient) {
    this.publicClient = createPublicViemClient()
    this.walletClient = walletClient
    this.positionsService = new PositionsService(this.publicClient)
    this.marketDataService = new MarketDataService(this.publicClient)

    // Initialize trade service if wallet connected
    if (walletClient) {
      const chainId = getChainId()
      const deployment = getDeployment(chainId)
      if (deployment) {
        this.tradeService = new TradeService(
          this.publicClient,
          walletClient,
          deployment
        )
      }
    }
  }

  isWalletConnected(): boolean {
    return !!this.walletClient
  }

  /**
   * Get current market state from PerpMarket contract
   * Makes 5 parallel contract calls (price + 2 reserves + 2 OI)
   */
  async getMarketState(perpMarketAddress: string): Promise<MarketState> {
    const marketAddr = perpMarketAddress as Address

    // 3 grouped calls (each may contain multiple internal calls)
    const [markPrice, reserves, openInterest] = await Promise.all([
      this.marketDataService.getMarkPrice(marketAddr),
      this.marketDataService.getReserves(marketAddr),        // 2 calls internally
      this.marketDataService.getOpenInterest(marketAddr)     // 2 calls internally
    ])

    return {
      currentPrice: Number(markPrice) / 1e18,
      baseReserve: Number(reserves.baseReserve) / 1e18,
      quoteReserve: Number(reserves.quoteReserve) / 1e18,
      openInterestLong: Number(openInterest.longOI) / 1e18,
      openInterestShort: Number(openInterest.shortOI) / 1e18
    }
  }

  /**
   * Get user's open positions for a market
   */
  async getUserOpenPositions(
    userAddress: string,
    perpEngineAddress: string,
    positionManagerAddress: string,
    deploymentBlock: number,
    marketId: string,
    marketSlug: string
  ): Promise<AppPosition[]> {
    console.log('[ContractSource] getUserOpenPositions:', {
      userAddress,
      perpEngineAddress,
      positionManagerAddress,
      deploymentBlock,
      marketId,
      marketSlug
    })

    const positions = await this.positionsService.getUserOpenPositions(
      perpEngineAddress as Address,
      positionManagerAddress as Address,
      userAddress as Address,
      BigInt(deploymentBlock)
    )

    console.log('[ContractSource] Mapping', positions.length, 'positions')

    return positions.map(pos =>
      this.mapContractPositionToAppPosition(pos, marketId, marketSlug)
    )
  }

  /**
   * Get all open positions for a market
   */
  async getMarketOpenPositions(
    perpEngineAddress: string,
    positionManagerAddress: string,
    deploymentBlock: number,
    marketId: string,
    marketSlug: string
  ): Promise<AppPosition[]> {
    const positions = await this.positionsService.getMarketOpenPositions(
      perpEngineAddress as Address,
      positionManagerAddress as Address,
      BigInt(deploymentBlock)
    )

    return positions.map(pos =>
      this.mapContractPositionToAppPosition(pos, marketId, marketSlug)
    )
  }

  /**
   * Get single position by ID
   */
  async getPosition(
    positionManagerAddress: string,
    positionId: string,
    marketId: string,
    marketSlug: string
  ): Promise<AppPosition | null> {
    try {
      const pos = await this.positionsService.getPosition(
        positionManagerAddress as Address,
        BigInt(positionId)
      )

      return this.mapContractPositionToAppPosition(pos, marketId, marketSlug)
    } catch (error) {
      console.error('Error getting position:', error)
      return null
    }
  }

  /**
   * Map contract Position to app Position type
   */
  private mapContractPositionToAppPosition(
    contractPosition: ContractPosition,
    marketId: string,
    marketSlug: string
  ): AppPosition {
    const entryPrice = Number(contractPosition.entryPrice) / 1e18
    const margin = Number(contractPosition.margin) / 1e18
    const entryNotional = Number(contractPosition.entryNotional) / 1e18
    const leverage = entryNotional / margin

    // Calculate liquidation price (approximation)
    const liquidationPrice = contractPosition.isLong
      ? entryPrice * (1 - 1 / leverage)
      : entryPrice * (1 + 1 / leverage)

    return {
      id: contractPosition.id.toString(),
      userId: contractPosition.user,
      marketId,
      marketSlug,
      positionType: contractPosition.isLong ? 'long' : 'short',
      entryPrice,
      baseSize: Number(contractPosition.baseSize) / 1e18,
      margin,
      leverage,
      entryNotional,
      realizedPnl: Number(contractPosition.realizedPnl) / 1e18,
      liquidationPrice,
      status: contractPosition.status === 1 ? 'open' : contractPosition.status === 2 ? 'closed' : 'liquidated',
      openedAt: new Date(),
      openedBlock: Number(contractPosition.openBlock),
      txHash: ''
    }
  }

  /**
   * Open a new position using trade service
   */
  async openPosition(
    userAddress: string,
    perpEngineAddress: string,
    params: OpenPositionParams
  ): Promise<TransactionResult> {
    if (!this.tradeService) {
      throw new Error('Wallet not connected')
    }

    const isLong = params.side === 'long'
    const totalToUse = BigInt(Math.floor(params.totalAmount * 1e18))
    const leverage = BigInt(Math.floor(params.leverage * 1e18))

    const { hash, positionId } = await this.tradeService.openPosition(
      perpEngineAddress as Address,
      isLong,
      totalToUse,
      leverage
    )

    return {
      txHash: hash,
      status: 'confirmed',
      positionId: positionId?.toString()
    }
  }

  /**
   * Deposit and open position with permit (1 transaction)
   * Uses EIP-2612 gasless approval
   */
  async depositAndOpenPositionWithPermit(
    userAddress: string,
    perpEngineAddress: string,
    params: OpenPositionParams,
    depositAmount: number
  ): Promise<TransactionResult> {
    if (!this.tradeService) {
      throw new Error('Wallet not connected')
    }

    const isLong = params.side === 'long'
    const totalToUse = BigInt(Math.floor(params.totalAmount * 1e18))
    const leverage = BigInt(Math.floor(params.leverage * 1e18))

    const { hash, positionId } = await this.tradeService.depositAndOpenPositionWithPermit(
      perpEngineAddress as Address,
      depositAmount,
      isLong,
      totalToUse,
      leverage,
      userAddress as Address
    )

    return {
      txHash: hash,
      status: 'confirmed',
      positionId: positionId?.toString()
    }
  }

  /**
   * Deposit and open position (legacy)
   * @deprecated Use depositAndOpenPositionWithPermit for better UX
   */
  async depositAndOpenPosition(
    userAddress: string,
    perpEngineAddress: string,
    usdcAddress: string,
    params: OpenPositionParams,
    depositAmount: number
  ): Promise<TransactionResult> {
    if (!this.tradeService) {
      throw new Error('Wallet not connected')
    }

    const isLong = params.side === 'long'
    const totalToUse = BigInt(Math.floor(params.totalAmount * 1e18))
    const leverage = BigInt(Math.floor(params.leverage * 1e18))

    const { hash, positionId } = await this.tradeService.depositAndOpenPosition(
      perpEngineAddress as Address,
      depositAmount,
      isLong,
      totalToUse,
      leverage
    )

    return {
      txHash: hash,
      status: 'confirmed',
      positionId: positionId?.toString()
    }
  }

  /**
   * Close a position
   */
  async closePosition(
    userAddress: string,
    perpEngineAddress: string,
    params: ClosePositionParams
  ): Promise<TransactionResult> {
    if (!this.tradeService) {
      throw new Error('Wallet not connected')
    }

    const { hash, totalPnl } = await this.tradeService.closePosition(
      perpEngineAddress as Address,
      BigInt(params.positionId)
    )

    return {
      txHash: hash,
      status: 'confirmed',
      totalPnl: totalPnl ? Number(totalPnl) / 1e18 : undefined
    }
  }


  /**
   * Get user's wallet balance
   */
  async getUserBalance(
    userAddress: string,
    perpEngineAddress: string
  ): Promise<number> {
    const balance = await this.positionsService.getWalletBalance(
      perpEngineAddress as Address,
      userAddress as Address
    )

    return Number(balance) / 1e18
  }

  /**
   * Get user allowance (not needed with SDK, keeping for compatibility)
   */
  async getUserAllowance(
    userAddress: string,
    usdcAddress: string,
    perpEngineAddress: string
  ): Promise<number> {
    return 0 // Not implemented, handled by TradeService
  }

  /**
   * Approve USDC (handled by TradeService)
   */
  async approveUSDC(
    userAddress: string,
    usdcAddress: string,
    perpEngineAddress: string,
    amount: number
  ): Promise<TransactionResult> {
    if (!this.tradeService) {
      throw new Error('Wallet not connected')
    }

    const hash = await this.tradeService.approveUsdc(
      perpEngineAddress as Address,
      BigInt(Math.floor(amount * 1e6))
    )

    return {
      txHash: hash,
      status: 'confirmed'
    }
  }
}
