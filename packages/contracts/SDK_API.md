# @velto/contracts SDK API Reference

TypeScript SDK for Velto perpetual contracts. Provides ABIs, deployment addresses, types, and transaction utilities.

## Installation

```bash
npm install ../sdk  # Local development
# or
npm install @velto/contracts  # Published
```

## Exports

### Contract ABIs & Types (Generated)

```typescript
// ABIs (from wagmi codegen)
export const perpEngineAbi: Abi
export const perpMarketAbi: Abi
export const perpFactoryAbi: Abi
export const positionManagerAbi: Abi
export const fundingManagerAbi: Abi
export const liquidationEngineAbi: Abi
export const mockUsdcAbi: Abi
```

### Deployments

```typescript
// Get deployment for chain
function getDeployment(chainId: number): DeploymentConfig | null

// Get all deployments
function getDeployments(): Record<string, DeploymentConfig>

// Check if chain supported
function isChainSupported(chainId: number): boolean

// Supported chain IDs array
const SUPPORTED_CHAINS: number[]

// Types
interface CoreDeployment {
  factory: Address
  liquidationEngine: Address
  fundingManager: Address
  deployer: Address
  timestamp: number
}

interface DeploymentConfig extends CoreDeployment {
  perpMarketImpl?: Address
  positionManagerImpl?: Address
  perpEngineImpl?: Address
  deploymentBlock?: number
  usdc?: Address
}
```

### Common Types

```typescript
interface ContractError {
  message: string
  code?: string
  rawError?: any
}

interface Position {
  id: bigint
  user: Address
  isLong: boolean
  baseSize: bigint
  entryPrice: bigint
  entryNotional: bigint
  margin: bigint
  carrySnapshot: bigint
  openBlock: bigint
  status: number
  realizedPnl: bigint
}

interface MarketData {
  marketAddress: Address
  baseReserve: bigint
  quoteReserve: bigint
  markPrice: bigint
  longOI: bigint
  shortOI: bigint
  netOI: bigint
  carryIndex: bigint
  currentBlock: bigint
  lastFundingBlock: bigint
  tradeFund: bigint
  insuranceFund: bigint
  protocolFees: bigint
  timestamp: number
}

interface LiquidationInfo {
  isLiquidatable: boolean
  currentLoss: bigint
  allowedLoss: bigint
  equity: bigint
  leverage: bigint
}

interface PositionEquity {
  closeNotional: bigint
  avgClosePrice: bigint
  pnlTrade: bigint
  carryPnl: bigint
  totalPnl: bigint
  equityIfClosed: bigint
}
```

### Transaction Utilities

```typescript
// Execute contract transaction (simulate -> write -> wait)
async function executeTransaction(params: ExecuteTransactionParams): Promise<TransactionResult>

interface ExecuteTransactionParams {
  publicClient: PublicClient
  walletClient: WalletClient
  address: Address
  abi: Abi
  functionName: string
  args?: readonly unknown[]
  account?: Address
}

interface TransactionResult {
  hash: Hash
  receipt: TransactionReceipt
}

// Decode contract errors
function decodeContractError(error: any, abi: Abi): ContractError
```

### Format Utilities

```typescript
// USDC (6 decimals)
function formatUsdc(amount: bigint, decimals?: number): string
function parseUsdc(amount: string): bigint

// Price (18 decimals)
function formatPrice(price: bigint, decimals?: number): string

// Calculations
function calculateLeverage(margin: bigint, notional: bigint): number
function calculatePnlPercentage(pnl: bigint, margin: bigint): number
```

## Usage Examples

### Basic Contract Interaction

```typescript
import { perpEngineAbi, getDeployment } from '@velto/contracts'

const deployment = getDeployment(31337)
const balance = await publicClient.readContract({
  address: deployment.factory,
  abi: perpEngineAbi,
  functionName: 'getWalletBalance',
  args: [userAddress]
})
```

### Transaction Execution

```typescript
import { executeTransaction, perpEngineAbi, decodeContractError } from '@velto/contracts'

try {
  const { hash, receipt } = await executeTransaction({
    publicClient,
    walletClient,
    address: engineAddress,
    abi: perpEngineAbi,
    functionName: 'deposit',
    args: [amount]
  })

  console.log('Deposited:', hash)
} catch (error) {
  const decoded = decodeContractError(error, perpEngineAbi)
  console.error(decoded.message)
}
```

### Format & Display

```typescript
import { formatUsdc, formatPrice, calculateLeverage } from '@velto/contracts'

const balance = 10_000_000n  // 10 USDC (6 decimals)
console.log(formatUsdc(balance))  // "10.00"

const price = 2500_000000000000000000n  // 2500 USD (18 decimals)
console.log(formatPrice(price))  // "2500.0000"

const leverage = calculateLeverage(1000n, 10000n)
console.log(leverage)  // 10.0
```

### Type Safety

```typescript
import type { Position, MarketData, DeploymentConfig } from '@velto/contracts'

function displayPosition(pos: Position) {
  console.log(`Position ${pos.id}: ${pos.isLong ? 'LONG' : 'SHORT'}`)
  console.log(`Entry: ${formatPrice(pos.entryPrice)}`)
  console.log(`Size: ${pos.baseSize}`)
}

function getMarketInfo(chainId: number): MarketData {
  const deployment = getDeployment(chainId)
  if (!deployment) throw new Error(`Chain ${chainId} not supported`)

  // Use deployment addresses...
}
```

## File Structure

```
sdk/
├── src/
│   ├── generated.ts      # wagmi codegen (ABIs + types)
│   ├── deployments.ts    # Contract addresses per chain
│   ├── types.ts          # Common contract types
│   ├── utils.ts          # Transaction & format utilities
│   └── index.ts          # Main exports
├── dist/                 # Built output
├── package.json
├── tsconfig.json
└── wagmi.config.ts       # Codegen config
```

## Development Workflow

```bash
# Build contracts
forge build

# Generate types & build SDK
cd sdk && npm run build

# Use in frontend
cd ../web && npm install ../sdk
```

## Contract Coverage

- **PerpEngine** - Deposits, withdrawals, positions, liquidations
- **PerpMarket** - vAMM trading, reserves, pricing
- **PerpFactory** - Market deployment
- **PositionManager** - Position tracking, equity calculations
- **FundingManager** - Funding rate calculations
- **LiquidationEngine** - Liquidation checks
- **MockUSDC** - Test collateral token (faucet, mint)
