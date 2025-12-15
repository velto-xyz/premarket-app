// ============================================================================
// CORE MODELS
// ============================================================================

export interface Market {
  // Metadata (from Supabase startups table)
  id: string
  name: string
  slug: string
  description: string
  logoUrl: string
  industryId: string

  // Contract data (from Supabase market_contracts table)
  contractAddress?: string
  perpEngineAddress?: string
  perpMarketAddress?: string
  positionManagerAddress?: string
  chainId?: number
  deploymentBlock?: number

  // Current state (from Contract API)
  currentPrice: number
  openInterestLong: number
  openInterestShort: number
  baseReserve: number
  quoteReserve: number  // This is the market cap in the vAMM model

  // Historical data (from Indexer)
  priceChange24h: number
  totalVolume: number

  // Optional metadata
  hqLocation?: string
  hqLatitude?: number
  hqLongitude?: number
  unicornColor?: string
  yearFounded?: number
  founders?: string
}

export interface Position {
  // Core position data
  id: string
  userId: string // wallet address
  marketId: string
  marketSlug: string

  // Position details
  positionType: 'long' | 'short'
  entryPrice: number
  currentPrice?: number
  closePrice?: number

  // Quantities
  baseSize: number
  margin: number
  leverage: number

  // Financials
  entryNotional: number
  currentNotional?: number
  unrealizedPnl?: number
  realizedPnl?: number
  liquidationPrice: number

  // Status
  status: 'open' | 'closed' | 'liquidated'

  // Timestamps
  openedAt: Date
  openedBlock: number
  closedAt?: Date
  closedBlock?: number

  // Metadata
  txHash: string
}

export interface Trade {
  id: string
  positionId: string
  userId: string
  marketSlug: string
  type: 'open' | 'close' | 'liquidation'
  side: 'long' | 'short'
  price: number
  size: number
  notional: number
  fee: number
  pnl?: number
  timestamp: Date
  blockNumber: number
  txHash: string
}

// ============================================================================
// HISTORICAL / ANALYTICS MODELS
// ============================================================================

export interface PricePoint {
  timestamp: Date
  price: number
  volume?: number
}

export interface HistoricalPosition extends Position {
  // Additional fields for closed positions
  holdingPeriod: number // seconds
  roi: number // percentage
  carryPaid: number
}

export interface UserStats {
  userId: string
  totalTrades: number
  totalVolume: number
  totalPnl: number
  winRate: number
  openPositions: number
  closedPositions: number
  liquidatedPositions: number
  averageHoldTime: number
  bestTrade: number
  worstTrade: number
}

export interface DailyStats {
  date: string // YYYY-MM-DD
  marketSlug: string
  volume: number
  trades: number
  uniqueTraders: number
  pnlTotal: number
  liquidations: number
  avgPrice: number
  highPrice: number
  lowPrice: number
}

export interface MonthlyPnL {
  month: string // YYYY-MM
  pnl: number
  trades: number
  volume: number
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  userName?: string
  avatarUrl?: string
  totalPnl: number
  totalTrades: number
  winRate: number
}

// ============================================================================
// CHART DATA MODELS
// ============================================================================

export interface CandlestickData {
  timestamp: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface VolumeByDay {
  date: string
  volume: number
  trades: number
}

export interface OISnapshot {
  timestamp: Date
  longOI: number
  shortOI: number
  imbalance: number
}

// ============================================================================
// TRANSACTION MODELS
// ============================================================================

export interface OpenPositionParams {
  marketSlug: string
  side: 'long' | 'short'
  totalAmount: number // USDC amount
  leverage: number
}

export interface ClosePositionParams {
  positionId: string
}

export interface TransactionResult {
  txHash: string
  status: 'pending' | 'confirmed' | 'failed'
  blockNumber?: number
  gasUsed?: number
  error?: string
}

// ============================================================================
// INTERNAL DATA TRANSFER OBJECTS
// ============================================================================

export interface MarketMetadata {
  id: string
  name: string
  slug: string
  description: string
  logoUrl: string
  industryId: string
  hqLocation?: string
  hqLatitude?: number
  hqLongitude?: number
  unicornColor?: string
  yearFounded?: number
  founders?: string
}

export interface MarketContractInfo {
  marketId: string
  contractAddress: string
  perpEngineAddress: string
  perpMarketAddress: string
  positionManagerAddress: string
  chainId: number
  deploymentBlock: number
}

// Contract state - real-time on-chain data only
export interface MarketState {
  currentPrice: number
  openInterestLong: number
  openInterestShort: number
  baseReserve: number
  quoteReserve: number
}

// Indexer historical data
export interface MarketHistoricalData {
  priceChange24h: number
  totalVolume: number
}
