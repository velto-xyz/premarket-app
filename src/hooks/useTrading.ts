import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, useWalletClient } from "wagmi";
import { toast } from "sonner";
import { StorageLayer } from "@/lib/storage/StorageLayer";
import { getDeployment } from "@/integrations/contract-api";
import { getChainId } from "@/lib/viem-client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function triggerSync() {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/sync-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('[useTrading] Sync error:', err);
  }
}

export interface OpenPositionParams {
  marketSlug: string;
  positionType: "long" | "short";
  amount: number; // USDC amount to use
  leverage: number;
}

export const useTrading = (marketSlug: string) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();
  const chainId = getChainId();

  // Get internal balance (deposited in protocol)
  const { data: internalBalance = 0 } = useQuery({
    queryKey: ["internalBalance", address, marketSlug],
    queryFn: async () => {
      if (!address || !walletClient) return 0;

      const storage = new StorageLayer(walletClient);
      const contractInfo = await storage['supabase'].getMarketContractInfoBySlug(marketSlug);

      if (!contractInfo) return 0;

      return storage.contracts.getUserBalance(
        address,
        contractInfo.perpEngineAddress
      );
    },
    enabled: !!address && !!walletClient,
    refetchInterval: 10000,
  });

  // Get available balance (USDC in wallet)
  const { data: availableBalance = 0 } = useQuery({
    queryKey: ["availableBalance", address, chainId],
    queryFn: async () => {
      if (!address || !walletClient) return 0;

      const deployment = getDeployment(chainId);
      if (!deployment?.usdc) return 0;

      const storage = new StorageLayer(walletClient);
      return storage.contracts.getAvailableBalance(address, deployment.usdc);
    },
    enabled: !!address && !!walletClient,
    refetchInterval: 10000,
  });

  // Open position mutation
  const openPosition = useMutation({
    mutationFn: async (params: OpenPositionParams) => {
      if (!address || !walletClient) {
        throw new Error("Please connect your wallet");
      }

      const storage = new StorageLayer(walletClient);
      const contractInfo = await storage['supabase'].getMarketContractInfoBySlug(params.marketSlug);

      if (!contractInfo) {
        throw new Error(`Market ${params.marketSlug} does not have contracts deployed`);
      }

      // Get USDC address from deployment
      const deployment = getDeployment(chainId);
      if (!deployment?.usdc) {
        throw new Error(`USDC address not found for chain ${chainId}`);
      }

      // Get fresh raw balance (bigint) to avoid precision loss
      const internalBalanceRaw = await storage.contracts.getUserBalanceRaw(
        address,
        contractInfo.perpEngineAddress
      );

      // Convert user input to bigint (18 decimals for internal balance)
      const amountRaw = BigInt(Math.floor(params.amount * 1e18));

      // Check if user has enough internal balance
      const hasEnoughBalance = internalBalanceRaw >= amountRaw;

      if (hasEnoughBalance) {
        // Use internal balance - faster, no approvals needed
        toast.info("Opening position using internal balance...");

        return storage.contracts.openPosition(
          address,
          contractInfo.perpEngineAddress,
          {
            marketSlug: params.marketSlug,
            side: params.positionType,
            totalAmount: params.amount,
            leverage: params.leverage,
          }
        );
      } else {
        // Need to deposit - use permit flow (1 transaction)
        toast.info("Please sign permit and confirm transaction...");

        // Calculate deposit needed in raw bigint, then convert to USDC decimals (6)
        const depositNeededRaw = amountRaw - internalBalanceRaw;
        // Convert from 18 decimals to number for USDC (will be converted to 6 decimals in TradeService)
        const depositAmount = Number(depositNeededRaw) / 1e18;

        return storage.depositAndOpenPositionWithPermit(
          address,
          {
            marketSlug: params.marketSlug,
            side: params.positionType,
            totalAmount: params.amount,
            leverage: params.leverage,
          },
          depositAmount
        );
      }
    },
    onSuccess: async (result) => {
      if (result.status === "confirmed") {
        toast.success("Position opened successfully!", {
          description: `Position ID: ${result.positionId}`,
        });

        // Wait for event indexing (local node needs time to index events)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Trigger sync to pull latest data from indexer
        await triggerSync();

        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["positions"] });
        queryClient.invalidateQueries({ queryKey: ["internalBalance"] });
        queryClient.invalidateQueries({ queryKey: ["market", marketSlug] });
        queryClient.invalidateQueries({ queryKey: ["price-history", marketSlug] });
      } else {
        toast.error("Transaction failed", {
          description: result.error || "Unknown error",
        });
      }
    },
    onError: (error: Error) => {
      toast.error("Failed to open position", {
        description: error.message,
      });
    },
  });

  // Close position mutation
  const closePosition = useMutation({
    mutationFn: async ({ positionId }: { positionId: string }) => {
      if (!address || !walletClient) {
        throw new Error("Please connect your wallet");
      }

      const storage = new StorageLayer(walletClient);
      const contractInfo = await storage['supabase'].getMarketContractInfoBySlug(marketSlug);

      if (!contractInfo) {
        throw new Error(`Market ${marketSlug} does not have contracts deployed`);
      }

      toast.info("Closing position...");
      return storage.contracts.closePosition(
        address,
        contractInfo.perpEngineAddress,
        { positionId }
      );
    },
    onSuccess: async (result) => {
      if (result.status === "confirmed") {
        const pnlText = result.totalPnl
          ? ` PnL: ${result.totalPnl >= 0 ? '+' : ''}$${result.totalPnl.toFixed(2)}`
          : '';

        toast.success("Position closed successfully!" + pnlText, {
          description: `Transaction: ${result.txHash?.slice(0, 10)}...`,
        });

        // Trigger sync to pull latest data from indexer
        await triggerSync();

        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["positions"] });
        queryClient.invalidateQueries({ queryKey: ["internalBalance"] });
        queryClient.invalidateQueries({ queryKey: ["market", marketSlug] });
        queryClient.invalidateQueries({ queryKey: ["price-history", marketSlug] });
      } else {
        toast.error("Transaction failed", {
          description: result.error || "Unknown error",
        });
      }
    },
    onError: (error: Error) => {
      toast.error("Failed to close position", {
        description: error.message,
      });
    },
  });

  return {
    internalBalance,
    availableBalance,
    openPosition,
    closePosition,
    isConnected: !!address && !!walletClient,
  };
};
