// Generated types and ABIs from wagmi
export * from './generated'

// Deployment addresses and helpers
export {
  getDeployment,
  getDeployments,
  isChainSupported,
  SUPPORTED_CHAINS,
  type DeploymentConfig,
  type CoreDeployment,
  type ExtendedDeployment,
} from './deployments'

// Common contract types
export type {
  ContractError,
  Position,
  MarketData,
  LiquidationInfo,
  PositionEquity,
} from './types'

// Transaction and error handling utilities
export {
  executeTransaction,
  decodeContractError,
  formatUsdc,
  parseUsdc,
  formatPrice,
  calculateLeverage,
  calculatePnlPercentage,
  type ExecuteTransactionParams,
  type TransactionResult,
} from './utils'

// Re-export viem types
export type { Address, Hex, Hash, PublicClient, WalletClient, Abi } from 'viem'
