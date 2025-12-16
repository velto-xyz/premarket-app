import type { PublicClient, WalletClient, Address, Abi, Hash, TransactionReceipt } from 'viem';
import type { ContractError } from './types';
/**
 * Transaction execution utilities
 */
export interface ExecuteTransactionParams {
    publicClient: PublicClient;
    walletClient: WalletClient;
    address: Address;
    abi: Abi;
    functionName: string;
    args?: readonly unknown[];
    account?: Address;
}
export interface TransactionResult {
    hash: Hash;
    receipt: TransactionReceipt;
}
/**
 * Execute a contract transaction with simulate -> write -> wait pattern
 * Provides consistent error handling across all transactions
 */
export declare function executeTransaction(params: ExecuteTransactionParams): Promise<TransactionResult>;
/**
 * Error handling utilities
 */
/**
 * Decode contract revert with ABI-aware error resolution
 * Converts contract errors to user-friendly messages
 */
export declare function decodeContractError(error: any, abi: Abi): ContractError;
/**
 * Format utilities
 */
/**
 * Format USDC amount (6 decimals) to human-readable string
 */
export declare function formatUsdc(amount: bigint, decimals?: number): string;
/**
 * Parse USDC amount from string to bigint (6 decimals)
 */
export declare function parseUsdc(amount: string): bigint;
/**
 * Format price with 18 decimals precision
 */
export declare function formatPrice(price: bigint, decimals?: number): string;
/**
 * Calculate leverage from margin and notional
 */
export declare function calculateLeverage(margin: bigint, notional: bigint): number;
/**
 * Calculate PnL percentage
 */
export declare function calculatePnlPercentage(pnl: bigint, margin: bigint): number;
//# sourceMappingURL=utils.d.ts.map