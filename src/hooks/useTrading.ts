import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, useWalletClient } from "wagmi";
import { toast } from "sonner";
import { StorageLayer } from "@/lib/storage/StorageLayer";
import { getDeployment } from "@/integrations/contract-api";
import { getChainId } from "@/lib/viem-client";

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

  // Get internal balance
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
    refetchInterval: 10000, // Refresh every 10 seconds
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

      // Check if user has enough internal balance
      const hasEnoughBalance = internalBalance >= params.amount;

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

        const depositAmount = params.amount - internalBalance;

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
    onSuccess: async (result, variables) => {
      console.log('[useTrading] openPosition result:', result);

      if (result.status === "confirmed") {
        toast.success("Position opened successfully!", {
          description: `Position ID: ${result.positionId}`,
        });

        // Wait for event indexing (local node needs time to index events)
        console.log('[useTrading] Waiting for event indexing...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Invalidate queries to refetch positions from blockchain
        console.log('[useTrading] Invalidating position queries...');
        queryClient.invalidateQueries({ queryKey: ["positions"] });
        queryClient.invalidateQueries({ queryKey: ["internalBalance"] });
      } else {
        toast.error("Transaction failed", {
          description: result.error || "Unknown error",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Error opening position:", error);
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
    onSuccess: async (result, variables) => {
      if (result.status === "confirmed") {
        const pnlText = result.totalPnl
          ? ` PnL: ${result.totalPnl >= 0 ? '+' : ''}$${result.totalPnl.toFixed(2)}`
          : '';

        toast.success("Position closed successfully!" + pnlText, {
          description: `Transaction: ${result.txHash?.slice(0, 10)}...`,
        });

        // Invalidate queries to refetch positions from blockchain
        queryClient.invalidateQueries({ queryKey: ["positions"] });
        queryClient.invalidateQueries({ queryKey: ["internalBalance"] });
      } else {
        toast.error("Transaction failed", {
          description: result.error || "Unknown error",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Error closing position:", error);
      toast.error("Failed to close position", {
        description: error.message,
      });
    },
  });

  return {
    internalBalance,
    openPosition,
    closePosition,
    isConnected: !!address && !!walletClient,
  };
};
