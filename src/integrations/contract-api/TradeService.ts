import type { PublicClient, WalletClient, Address } from 'viem'
import {
  perpEngineAbi,
  mockUsdcAbi,
  executeTransaction,
  decodeContractError,
  parseUsdc,
  type DeploymentConfig
} from '@velto/contracts'
import { signPermit, getPermitNonce, getPermitDeadline } from './permit'

/**
 * Trade Service
 * Handles all trading transactions: deposits, withdrawals, open/close positions
 */
export class TradeService {
  constructor(
    private publicClient: PublicClient,
    private walletClient: WalletClient,
    private deployment: DeploymentConfig
  ) {}

  /**
   * Deposit USDC to PerpEngine
   */
  async deposit(engineAddress: Address, amount: number): Promise<string> {
    const amountUsdc = parseUsdc(amount.toString())

    const { hash } = await executeTransaction({
      publicClient: this.publicClient,
      walletClient: this.walletClient,
      address: engineAddress,
      abi: perpEngineAbi,
      functionName: 'deposit',
      args: [amountUsdc]
    })

    return hash
  }

  /**
   * Withdraw USDC from PerpEngine
   */
  async withdraw(engineAddress: Address, amount: bigint): Promise<string> {
    const { hash } = await executeTransaction({
      publicClient: this.publicClient,
      walletClient: this.walletClient,
      address: engineAddress,
      abi: perpEngineAbi,
      functionName: 'withdraw',
      args: [amount]
    })

    return hash
  }

  /**
   * Open a leveraged position
   */
  async openPosition(
    engineAddress: Address,
    isLong: boolean,
    totalToUse: bigint,
    leverage: bigint
  ): Promise<{ hash: string; positionId?: bigint }> {
    try {
      const { hash, receipt } = await executeTransaction({
        publicClient: this.publicClient,
        walletClient: this.walletClient,
        address: engineAddress,
        abi: perpEngineAbi,
        functionName: 'openPosition',
        args: [isLong, totalToUse, leverage]
      })

      // Parse PositionOpened event from receipt
      const positionOpenedLog = receipt.logs.find(
        log => log.address.toLowerCase() === engineAddress.toLowerCase()
      )

      // Extract position ID from event (first topic after event signature)
      const positionId = positionOpenedLog?.topics[1]
        ? BigInt(positionOpenedLog.topics[1])
        : undefined

      return { hash, positionId }
    } catch (error: any) {
      const decoded = decodeContractError(error, perpEngineAbi)
      throw new Error(decoded.message)
    }
  }

  /**
   * Close a position
   */
  async closePosition(
    engineAddress: Address,
    positionId: bigint
  ): Promise<{ hash: string; totalPnl?: bigint }> {
    try {
      const { hash, receipt } = await executeTransaction({
        publicClient: this.publicClient,
        walletClient: this.walletClient,
        address: engineAddress,
        abi: perpEngineAbi,
        functionName: 'closePosition',
        args: [positionId]
      })

      // Parse PositionClosed event for PnL
      const positionClosedLog = receipt.logs.find(
        log => log.address.toLowerCase() === engineAddress.toLowerCase()
      )

      // Extract total PnL from event data if available
      const totalPnl = positionClosedLog?.data
        ? BigInt(positionClosedLog.data)
        : undefined

      return { hash, totalPnl }
    } catch (error: any) {
      const decoded = decodeContractError(error, perpEngineAbi)
      throw new Error(decoded.message)
    }
  }


  /**
   * Approve USDC for PerpEngine
   */
  async approveUsdc(engineAddress: Address, amount: bigint): Promise<string> {
    if (!this.deployment.usdc) {
      throw new Error('USDC address not found in deployment')
    }

    const { hash } = await executeTransaction({
      publicClient: this.publicClient,
      walletClient: this.walletClient,
      address: this.deployment.usdc,
      abi: mockUsdcAbi,
      functionName: 'approve',
      args: [engineAddress, amount]
    })

    return hash
  }

  /**
   * Deposit USDC and open position in one flow
   * Handles: approve -> deposit -> openPosition
   * @deprecated Use depositAndOpenPositionWithPermit for better UX
   */
  async depositAndOpenPosition(
    engineAddress: Address,
    depositAmount: number,
    isLong: boolean,
    totalToUse: bigint,
    leverage: bigint
  ): Promise<{ hash: string; positionId?: bigint }> {
    const amountUsdc = parseUsdc(depositAmount.toString())

    // Step 1: Approve USDC
    await this.approveUsdc(engineAddress, amountUsdc)

    // Step 2: Deposit USDC
    await this.deposit(engineAddress, depositAmount)

    // Step 3: Open position
    return this.openPosition(engineAddress, isLong, totalToUse, leverage)
  }

  /**
   * Deposit USDC and open position with permit signature (1 transaction)
   * Uses EIP-2612 gasless approval - user signs permit, contract verifies
   *
   * TESTNET MODE: Uses unlimited allowance (max uint256) valid for 30 days
   * Production mode should use exact amount with 1 hour expiry
   */
  async depositAndOpenPositionWithPermit(
    engineAddress: Address,
    depositAmount: number,
    isLong: boolean,
    totalToUse: bigint,
    leverage: bigint,
    userAddress: Address
  ): Promise<{ hash: string; positionId?: bigint }> {
    if (!this.deployment.usdc) {
      throw new Error('USDC address not found in deployment')
    }

    const amountUsdc = parseUsdc(depositAmount.toString())

    // Check existing allowance
    const currentAllowance = await this.publicClient.readContract({
      address: this.deployment.usdc,
      abi: mockUsdcAbi,
      functionName: 'allowance',
      args: [userAddress, engineAddress]
    }) as bigint

    let hash: string
    let receipt: any

    if (currentAllowance >= amountUsdc) {
      // Case 2: Has allowance - use depositAndOpenPosition (no permit needed)
      const result = await executeTransaction({
        publicClient: this.publicClient,
        walletClient: this.walletClient,
        address: engineAddress,
        abi: perpEngineAbi,
        functionName: 'depositAndOpenPosition',
        args: [amountUsdc, isLong, totalToUse, leverage]
      })
      hash = result.hash
      receipt = result.receipt
    } else {
      // Case 1: No allowance - sign permit for unlimited amount
      const permitAmount = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
      const deadline = getPermitDeadline()

      const nonce = await getPermitNonce(
        this.publicClient,
        this.deployment.usdc,
        userAddress,
        mockUsdcAbi
      )

      const chainId = await this.walletClient.getChainId()
      const sig = await signPermit(
        this.publicClient,
        this.walletClient,
        this.deployment.usdc,
        userAddress,
        engineAddress,
        permitAmount,
        deadline,
        nonce,
        chainId,
        mockUsdcAbi
      )

      const result = await executeTransaction({
        publicClient: this.publicClient,
        walletClient: this.walletClient,
        address: engineAddress,
        abi: perpEngineAbi,
        functionName: 'depositAndOpenPositionWithPermit',
        args: [amountUsdc, permitAmount, isLong, totalToUse, leverage, deadline, sig.v, sig.r, sig.s]
      })
      hash = result.hash
      receipt = result.receipt
    }

    // Parse PositionOpened event from receipt
    const positionOpenedLog = receipt.logs.find(
      (log: any) => log.address.toLowerCase() === engineAddress.toLowerCase()
    )

    const positionId = positionOpenedLog?.topics[1]
      ? BigInt(positionOpenedLog.topics[1])
      : undefined

    return { hash, positionId }
  }
}
