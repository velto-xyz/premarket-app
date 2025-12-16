import rawDeployments from '../../deployments.json'
import type { Address } from 'viem'

export interface CoreDeployment {
  factory: Address
  liquidationEngine: Address
  fundingManager: Address
  deployer: Address
  timestamp: number
}

export interface ExtendedDeployment extends CoreDeployment {
  perpMarketImpl?: Address
  positionManagerImpl?: Address
  perpEngineImpl?: Address
  deploymentBlock?: number
  usdc?: Address
}

export type DeploymentConfig = ExtendedDeployment

const deployments = rawDeployments as Record<string, DeploymentConfig>

export function getDeployment(chainId: number): DeploymentConfig | null {
  return deployments[chainId.toString()] || null
}

export function getDeployments(): Record<string, DeploymentConfig> {
  return deployments
}

export const SUPPORTED_CHAINS = Object.keys(deployments).map(Number)

export function isChainSupported(chainId: number): boolean {
  return chainId.toString() in deployments
}
