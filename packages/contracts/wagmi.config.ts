import { defineConfig } from '@wagmi/cli'
import { foundry } from '@wagmi/cli/plugins'

export default defineConfig({
  out: 'src/generated.ts',
  plugins: [
    foundry({
      project: '..',
      include: [
        'MockUSDC.sol/**',
        'FundingManager.sol/**',
        'LiquidationEngine.sol/**',
        'PerpMarket.sol/**',
        'PositionManager.sol/**',
        'PerpEngine.sol/**',
        'PerpFactory.sol/**',
      ],
    }),
  ],
})
