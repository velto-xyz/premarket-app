import { createPublicClient, http, defineChain } from 'viem'
import { baseSepolia, anvil } from 'viem/chains'

/**
 * Get viem chain config based on chain ID
 */
function getChain(chainId: number) {
  if (chainId === 31337) return anvil
  if (chainId === 84532) return baseSepolia
  throw new Error(`Unsupported chain ID: ${chainId}`)
}

/**
 * Create public client for reading contract data
 */
export function createPublicViemClient() {
  const rpcUrl = import.meta.env.VITE_RPC_URL
  const chainId = parseInt(import.meta.env.VITE_CHAIN_ID)

  if (!rpcUrl || !chainId) {
    throw new Error('Missing RPC configuration (VITE_RPC_URL, VITE_CHAIN_ID)')
  }

  return createPublicClient({
    chain: getChain(chainId),
    transport: http(rpcUrl)
  })
}

/**
 * Get chain ID from environment
 */
export function getChainId(): number {
  const chainId = parseInt(import.meta.env.VITE_CHAIN_ID)
  if (!chainId) {
    throw new Error('Missing VITE_CHAIN_ID')
  }
  return chainId
}
