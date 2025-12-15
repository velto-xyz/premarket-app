/**
 * Contract API
 *
 * Type-safe contract interactions using @velto/contracts SDK
 *
 * Services:
 * - TradeService: Deposits, withdrawals, open/close positions
 * - PositionsService: Query user positions via events
 * - MarketDataService: Real-time market data
 */

export { TradeService } from './TradeService'
export { PositionsService } from './PositionsService'
export { MarketDataService } from './MarketDataService'
export { signPermit, getPermitNonce, getPermitDeadline, type PermitSignature } from './permit'

// Re-export SDK types and utilities
export {
  // ABIs
  perpEngineAbi,
  perpMarketAbi,
  perpFactoryAbi,
  positionManagerAbi,
  fundingManagerAbi,
  liquidationEngineAbi,
  mockUsdcAbi,

  // Deployments
  getDeployment,
  getDeployments,
  isChainSupported,
  SUPPORTED_CHAINS,

  // Types
  type Position,
  type MarketData,
  type LiquidationInfo,
  type PositionEquity,
  type DeploymentConfig,
  type ContractError,

  // Utilities
  executeTransaction,
  decodeContractError,
  formatUsdc,
  formatPrice,
  parseUsdc,
  calculateLeverage,
  calculatePnlPercentage
} from '@velto/contracts'
