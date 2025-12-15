import type { WalletClient, Address, PublicClient } from 'viem'

export interface PermitSignature {
  v: number
  r: `0x${string}`
  s: `0x${string}`
  deadline: bigint
}

/**
 * Sign EIP-2612 permit for USDC
 * Allows gasless approval - user signs off-chain, contract verifies signature
 */
export async function signPermit(
  publicClient: PublicClient,
  walletClient: WalletClient,
  usdcAddress: Address,
  owner: Address,
  spender: Address,
  value: bigint,
  deadline: bigint,
  nonce: bigint,
  chainId: number,
  usdcAbi: any
): Promise<PermitSignature> {
  // Read token name from contract (works for Mock USDC, real USDC, any ERC20Permit)
  const tokenName = await publicClient.readContract({
    address: usdcAddress,
    abi: usdcAbi,
    functionName: 'name'
  }) as string

  const domain = {
    name: tokenName,
    version: '1',
    chainId,
    verifyingContract: usdcAddress
  }

  const types = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
  }

  const message = {
    owner,
    spender,
    value,
    nonce,
    deadline
  }

  // Sign with EIP-712
  const signature = await walletClient.signTypedData({
    account: owner,
    domain,
    types,
    primaryType: 'Permit',
    message
  })

  // Split signature into v, r, s
  const r = `0x${signature.slice(2, 66)}` as `0x${string}`
  const s = `0x${signature.slice(66, 130)}` as `0x${string}`
  const v = parseInt(signature.slice(130, 132), 16)

  return { v, r, s, deadline }
}

/**
 * Get current permit nonce for user
 */
export async function getPermitNonce(
  publicClient: any,
  usdcAddress: Address,
  owner: Address,
  usdcAbi: any
): Promise<bigint> {
  return publicClient.readContract({
    address: usdcAddress,
    abi: usdcAbi,
    functionName: 'nonces',
    args: [owner]
  }) as Promise<bigint>
}

/**
 * Get deadline for permit (current time + buffer)
 * @param bufferSeconds Time until permit expires (default: 30 days for testnet)
 * Production: 3600 (1 hour)
 * Testnet: 2592000 (30 days)
 */
export function getPermitDeadline(bufferSeconds: number = 2592000): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + bufferSeconds)
}
