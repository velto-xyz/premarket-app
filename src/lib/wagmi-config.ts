import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'
import { anvil, baseSepolia } from 'wagmi/chains'

// Get chain based on environment
const chains = [anvil, baseSepolia] as const

// WalletConnect Project ID - Get one at https://cloud.walletconnect.com
// For local development, you can leave this empty and use injected wallets (MetaMask, etc)
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

// If no project ID is set, we'll still get some console warnings from WalletConnect
// but the app will work fine with injected wallets (MetaMask, Coinbase Wallet, etc)
// To remove the warnings, get a free project ID at https://cloud.walletconnect.com
export const wagmiConfig = getDefaultConfig({
  appName: 'Velto',
  projectId: projectId || '0000000000000000000000000000000000000000',
  chains,
  transports: {
    [anvil.id]: http(import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
  ssr: false, // Disable SSR to reduce unnecessary API calls
})
