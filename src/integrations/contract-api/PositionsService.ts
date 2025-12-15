import type { PublicClient, Address } from 'viem'
import { getContractEvents } from 'viem/actions'
import {
  perpEngineAbi,
  positionManagerAbi,
  type Position
} from '@velto/contracts'

/**
 * Positions Service
 * Queries position data from contracts via event logs
 */
export class PositionsService {
  constructor(private publicClient: PublicClient) {}

  /**
   * Get user's open positions for a market
   */
  async getUserOpenPositions(
    engineAddress: Address,
    positionManagerAddress: Address,
    userAddress: Address,
    deploymentBlock: bigint
  ): Promise<Position[]> {
    console.log('[PositionsService] Fetching PositionOpened events for user:', userAddress)

    // Get PositionOpened events using viem's getContractEvents with user filter
    const openedEvents = await getContractEvents(this.publicClient, {
      address: engineAddress,
      abi: perpEngineAbi,
      eventName: 'PositionOpened',
      args: {
        user: userAddress
      },
      fromBlock: deploymentBlock,
      toBlock: 'latest'
    })

    console.log('[PositionsService] PositionOpened events for user:', openedEvents.length)
    console.log('[PositionsService] Events:', openedEvents)

    if (openedEvents.length === 0) {
      return []
    }

    // Get PositionClosed events for this user
    const closedEvents = await getContractEvents(this.publicClient, {
      address: engineAddress,
      abi: perpEngineAbi,
      eventName: 'PositionClosed',
      args: {
        user: userAddress
      },
      fromBlock: deploymentBlock,
      toBlock: 'latest'
    })

    // Get PositionLiquidated events for this user
    const liquidatedEvents = await getContractEvents(this.publicClient, {
      address: engineAddress,
      abi: perpEngineAbi,
      eventName: 'PositionLiquidated',
      args: {
        user: userAddress
      },
      fromBlock: deploymentBlock,
      toBlock: 'latest'
    })

    console.log('[PositionsService] Closed/Liquidated:', {
      closed: closedEvents.length,
      liquidated: liquidatedEvents.length
    })

    // Build set of closed position IDs
    const closedIds = new Set<bigint>()
    closedEvents.forEach(e => {
      if (e.args.positionId) closedIds.add(e.args.positionId)
    })
    liquidatedEvents.forEach(e => {
      if (e.args.positionId) closedIds.add(e.args.positionId)
    })

    // Get open position IDs
    const openPositionIds = openedEvents
      .filter(e => e.args.positionId && !closedIds.has(e.args.positionId))
      .map(e => e.args.positionId!)

    console.log('[PositionsService] Open position IDs:', openPositionIds.map(id => id.toString()))

    if (openPositionIds.length === 0) {
      console.log('[PositionsService] No open positions')
      return []
    }

    // Fetch position details from PositionManager
    console.log('[PositionsService] Fetching position details...')
    const positions = await Promise.all(
      openPositionIds.map(id =>
        this.publicClient.readContract({
          address: positionManagerAddress,
          abi: positionManagerAbi,
          functionName: 'getPosition',
          args: [id]
        }) as Promise<Position>
      )
    )

    console.log('[PositionsService] Fetched positions:', positions.length)

    return positions
  }

  /**
   * Get all open positions for a market
   */
  async getMarketOpenPositions(
    engineAddress: Address,
    positionManagerAddress: Address,
    deploymentBlock: bigint
  ): Promise<Position[]> {
    // Get all PositionOpened events
    const openedEvents = await getContractEvents(this.publicClient, {
      address: engineAddress,
      abi: perpEngineAbi,
      eventName: 'PositionOpened',
      fromBlock: deploymentBlock,
      toBlock: 'latest'
    })

    if (openedEvents.length === 0) {
      return []
    }

    // Get all PositionClosed events
    const closedEvents = await getContractEvents(this.publicClient, {
      address: engineAddress,
      abi: perpEngineAbi,
      eventName: 'PositionClosed',
      fromBlock: deploymentBlock,
      toBlock: 'latest'
    })

    // Get all PositionLiquidated events
    const liquidatedEvents = await getContractEvents(this.publicClient, {
      address: engineAddress,
      abi: perpEngineAbi,
      eventName: 'PositionLiquidated',
      fromBlock: deploymentBlock,
      toBlock: 'latest'
    })

    // Build set of closed position IDs
    const closedIds = new Set<bigint>()
    closedEvents.forEach(e => {
      if (e.args.positionId) closedIds.add(e.args.positionId)
    })
    liquidatedEvents.forEach(e => {
      if (e.args.positionId) closedIds.add(e.args.positionId)
    })

    // Get open position IDs
    const openPositionIds = openedEvents
      .filter(e => e.args.positionId && !closedIds.has(e.args.positionId))
      .map(e => e.args.positionId!)

    if (openPositionIds.length === 0) {
      return []
    }

    // Fetch position details from PositionManager
    const positions = await Promise.all(
      openPositionIds.map(id =>
        this.publicClient.readContract({
          address: positionManagerAddress,
          abi: positionManagerAbi,
          functionName: 'getPosition',
          args: [id]
        }) as Promise<Position>
      )
    )

    return positions
  }

  /**
   * Get single position by ID
   */
  async getPosition(
    positionManagerAddress: Address,
    positionId: bigint
  ): Promise<Position> {
    return this.publicClient.readContract({
      address: positionManagerAddress,
      abi: positionManagerAbi,
      functionName: 'getPosition',
      args: [positionId]
    }) as Promise<Position>
  }

  /**
   * Get user's wallet balance in PerpEngine
   */
  async getWalletBalance(
    engineAddress: Address,
    userAddress: Address
  ): Promise<bigint> {
    return this.publicClient.readContract({
      address: engineAddress,
      abi: perpEngineAbi,
      functionName: 'getWalletBalance',
      args: [userAddress]
    }) as Promise<bigint>
  }
}
