import type { Address } from 'viem'

/**
 * Common contract types
 * Shared across all contract interactions
 */

export interface ContractError {
  message: string
  code?: string
  rawError?: any
}

export interface Position {
  id: bigint
  user: Address
  isLong: boolean
  baseSize: bigint
  entryPrice: bigint
  entryNotional: bigint
  margin: bigint
  carrySnapshot: bigint
  openBlock: bigint
  status: number
  realizedPnl: bigint
}

export interface MarketData {
  marketAddress: Address
  baseReserve: bigint
  quoteReserve: bigint
  markPrice: bigint
  longOI: bigint
  shortOI: bigint
  netOI: bigint
  carryIndex: bigint
  currentBlock: bigint
  lastFundingBlock: bigint
  tradeFund: bigint
  insuranceFund: bigint
  protocolFees: bigint
  timestamp: number
}

export interface LiquidationInfo {
  isLiquidatable: boolean
  currentLoss: bigint
  allowedLoss: bigint
  equity: bigint
  leverage: bigint
}

export interface PositionEquity {
  closeNotional: bigint
  avgClosePrice: bigint
  pnlTrade: bigint
  carryPnl: bigint
  totalPnl: bigint
  equityIfClosed: bigint
}
