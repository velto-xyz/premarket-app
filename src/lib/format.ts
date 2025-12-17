/**
 * Format a number with proper thousands separators and decimals
 */
export function formatNumber(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num) || !isFinite(num)) return '0.00';

  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  });
}

/**
 * Format a BigInt value with decimals
 * Handles precision loss for very large numbers by using string arithmetic
 */
export function formatBigInt(
  value: bigint,
  decimals: number = 18,
  displayDecimals: number = 2
): string {
  const isNegative = value < 0n;
  const absValue = isNegative ? -value : value;

  // Convert to string and pad with zeros
  const valueStr = absValue.toString().padStart(decimals + 1, '0');

  // Split into integer and fractional parts
  const integerPart = valueStr.slice(0, -decimals) || '0';
  const fractionalPart = valueStr.slice(-decimals);

  // Build the number with desired decimals
  const num = parseFloat(`${integerPart}.${fractionalPart}`);

  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: displayDecimals,
    maximumFractionDigits: displayDecimals,
    useGrouping: true,
  });

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Format BigInt as USD
 */
export function formatBigIntUSD(value: bigint, decimals: number = 18): string {
  return `$${formatBigInt(value, decimals, 2)}`;
}

/**
 * Format USD value
 */
export function formatUSD(value: number | string, decimals: number = 2): string {
  return `$${formatNumber(value, decimals)}`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${formatNumber(value, decimals)}%`;
}

/**
 * Compact number format (1.2K, 3.5M, etc)
 */
export function formatCompact(value: number): string {
  if (!isFinite(value)) return '0';

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1e9) {
    return `${sign}${formatNumber(absValue / 1e9, 2)}B`;
  }
  if (absValue >= 1e6) {
    return `${sign}${formatNumber(absValue / 1e6, 2)}M`;
  }
  if (absValue >= 1e3) {
    return `${sign}${formatNumber(absValue / 1e3, 2)}K`;
  }
  return formatNumber(value, 2);
}

/**
 * Compact USD format ($1.2K, $3.5M, etc)
 */
export function formatCompactUSD(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `$${formatCompact(num)}`;
}

/**
 * Format USD as whole number (no decimals)
 */
export function formatUSDWhole(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || !isFinite(num)) return '$0';
  return `$${Math.round(num).toLocaleString()}`;
}

/**
 * Format address (0x1234...5678)
 */
export function formatAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/**
 * Format time ago (e.g., "5s ago", "2m ago")
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
