import { decodeErrorResult } from 'viem';
/**
 * Execute a contract transaction with simulate -> write -> wait pattern
 * Provides consistent error handling across all transactions
 */
export async function executeTransaction(params) {
    const { publicClient, walletClient, address, abi, functionName, args = [], account } = params;
    const accountAddress = account || walletClient.account?.address;
    if (!accountAddress) {
        throw new Error('No account connected');
    }
    const { request } = await publicClient.simulateContract({
        address,
        abi,
        functionName,
        args,
        account: accountAddress,
    });
    const hash = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
}
/**
 * Error handling utilities
 */
/**
 * Decode contract revert with ABI-aware error resolution
 * Converts contract errors to user-friendly messages
 */
export function decodeContractError(error, abi) {
    try {
        // Try to decode custom error
        if (error.data) {
            const decodedError = decodeErrorResult({
                abi,
                data: error.data,
            });
            return {
                message: `Contract Error: ${decodedError.errorName}`,
                code: decodedError.errorName,
                rawError: decodedError.args,
            };
        }
        // Extract revert reason
        if (error.message) {
            const revertMatch = error.message.match(/reverted with reason string ['"](.+)['"]/);
            if (revertMatch) {
                return {
                    message: `Revert: ${revertMatch[1]}`,
                    rawError: error,
                };
            }
            const customErrorMatch = error.message.match(/reverted with custom error ['"](.+)['"]/);
            if (customErrorMatch) {
                return {
                    message: `Error: ${customErrorMatch[1]}`,
                    code: customErrorMatch[1],
                    rawError: error,
                };
            }
            // Handle user rejection
            if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
                return {
                    message: 'Transaction rejected by user',
                    code: 'USER_REJECTED',
                    rawError: error,
                };
            }
            return {
                message: error.message,
                rawError: error,
            };
        }
        return {
            message: 'Unknown contract error',
            rawError: error,
        };
    }
    catch (e) {
        return {
            message: error.message || 'Failed to decode contract error',
            rawError: error,
        };
    }
}
/**
 * Format utilities
 */
/**
 * Format USDC amount (6 decimals) to human-readable string
 */
export function formatUsdc(amount, decimals = 2) {
    const usdcDecimals = 6;
    const divisor = 10n ** BigInt(usdcDecimals);
    const wholePart = amount / divisor;
    const fractionalPart = amount % divisor;
    if (decimals === 0) {
        return wholePart.toString();
    }
    const fractionalStr = fractionalPart.toString().padStart(usdcDecimals, '0');
    const trimmedFractional = fractionalStr.slice(0, decimals);
    return `${wholePart}.${trimmedFractional}`;
}
/**
 * Parse USDC amount from string to bigint (6 decimals)
 */
export function parseUsdc(amount) {
    const usdcDecimals = 6;
    const parts = amount.split('.');
    const wholePart = parts[0] || '0';
    const fractionalPart = (parts[1] || '').padEnd(usdcDecimals, '0').slice(0, usdcDecimals);
    return BigInt(wholePart) * 10n ** BigInt(usdcDecimals) + BigInt(fractionalPart);
}
/**
 * Format price with 18 decimals precision
 */
export function formatPrice(price, decimals = 4) {
    const priceDecimals = 18;
    const divisor = 10n ** BigInt(priceDecimals);
    const wholePart = price / divisor;
    const fractionalPart = price % divisor;
    if (decimals === 0) {
        return wholePart.toString();
    }
    const fractionalStr = fractionalPart.toString().padStart(priceDecimals, '0');
    const trimmedFractional = fractionalStr.slice(0, decimals);
    return `${wholePart}.${trimmedFractional}`;
}
/**
 * Calculate leverage from margin and notional
 */
export function calculateLeverage(margin, notional) {
    if (margin === 0n)
        return 0;
    return Number(notional * 100n / margin) / 100;
}
/**
 * Calculate PnL percentage
 */
export function calculatePnlPercentage(pnl, margin) {
    if (margin === 0n)
        return 0;
    return Number(pnl * 10000n / margin) / 100;
}
