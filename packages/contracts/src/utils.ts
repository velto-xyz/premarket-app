import type { PublicClient, WalletClient, Address, Abi, Hash, TransactionReceipt } from 'viem'
import { decodeErrorResult } from 'viem'
import type { ContractError } from './types'

/**
 * Transaction execution utilities
 */

export interface ExecuteTransactionParams {
  publicClient: PublicClient
  walletClient: WalletClient
  address: Address
  abi: Abi
  functionName: string
  args?: readonly unknown[]
  account?: Address
}

export interface TransactionResult {
  hash: Hash
  receipt: TransactionReceipt
}

/**
 * Execute a contract transaction with simulate -> write -> wait pattern
 * Provides consistent error handling across all transactions
 */
export async function executeTransaction(
  params: ExecuteTransactionParams
): Promise<TransactionResult> {
  const { publicClient, walletClient, address, abi, functionName, args = [], account } = params

  const accountAddress = account || walletClient.account?.address
  if (!accountAddress) {
    throw new Error('No account connected')
  }

  const { request } = await publicClient.simulateContract({
    address,
    abi,
    functionName,
    args,
    account: accountAddress,
  } as any)

  const hash = await walletClient.writeContract(request as any)
  const receipt = await publicClient.waitForTransactionReceipt({ hash })

  return { hash, receipt }
}

/**
 * Error handling utilities
 */

/**
 * Decode contract revert with ABI-aware error resolution
 * Converts contract errors to user-friendly messages
 */
export function decodeContractError(error: any, abi: Abi): ContractError {
  try {
    // Try to decode custom error
    if (error.data) {
      const decodedError = decodeErrorResult({
        abi,
        data: error.data,
      })

      return {
        message: `Contract Error: ${decodedError.errorName}`,
        code: decodedError.errorName,
        rawError: decodedError.args,
      }
    }

    // Extract revert reason
    if (error.message) {
      const revertMatch = error.message.match(/reverted with reason string ['"](.+)['"]/)
      if (revertMatch) {
        return {
          message: `Revert: ${revertMatch[1]}`,
          rawError: error,
        }
      }

      const customErrorMatch = error.message.match(/reverted with custom error ['"](.+)['"]/)
      if (customErrorMatch) {
        return {
          message: `Error: ${customErrorMatch[1]}`,
          code: customErrorMatch[1],
          rawError: error,
        }
      }

      // Handle user rejection
      if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
        return {
          message: 'Transaction rejected by user',
          code: 'USER_REJECTED',
          rawError: error,
        }
      }

      return {
        message: error.message,
        rawError: error,
      }
    }

    return {
      message: 'Unknown contract error',
      rawError: error,
    }
  } catch (e) {
    return {
      message: error.message || 'Failed to decode contract error',
      rawError: error,
    }
  }
}

/**
 * Format utilities
 */

/**
 * Format USDC amount (6 decimals) to human-readable string
 */
export function formatUsdc(amount: bigint, decimals: number = 2): string {
  const usdcDecimals = 6
  const divisor = 10n ** BigInt(usdcDecimals)
  const wholePart = amount / divisor
  const fractionalPart = amount % divisor

  if (decimals === 0) {
    return wholePart.toString()
  }

  const fractionalStr = fractionalPart.toString().padStart(usdcDecimals, '0')
  const trimmedFractional = fractionalStr.slice(0, decimals)

  return `${wholePart}.${trimmedFractional}`
}

/**
 * Parse USDC amount from string to bigint (6 decimals)
 */
export function parseUsdc(amount: string): bigint {
  const usdcDecimals = 6
  const parts = amount.split('.')
  const wholePart = parts[0] || '0'
  const fractionalPart = (parts[1] || '').padEnd(usdcDecimals, '0').slice(0, usdcDecimals)

  return BigInt(wholePart) * 10n ** BigInt(usdcDecimals) + BigInt(fractionalPart)
}

/**
 * Format price with 18 decimals precision
 */
export function formatPrice(price: bigint, decimals: number = 4): string {
  const priceDecimals = 18
  const divisor = 10n ** BigInt(priceDecimals)
  const wholePart = price / divisor
  const fractionalPart = price % divisor

  if (decimals === 0) {
    return wholePart.toString()
  }

  const fractionalStr = fractionalPart.toString().padStart(priceDecimals, '0')
  const trimmedFractional = fractionalStr.slice(0, decimals)

  return `${wholePart}.${trimmedFractional}`
}

/**
 * Calculate leverage from margin and notional
 */
export function calculateLeverage(margin: bigint, notional: bigint): number {
  if (margin === 0n) return 0
  return Number(notional * 100n / margin) / 100
}

/**
 * Calculate PnL percentage
 */
export function calculatePnlPercentage(pnl: bigint, margin: bigint): number {
  if (margin === 0n) return 0
  return Number(pnl * 10000n / margin) / 100
}
