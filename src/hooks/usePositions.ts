import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { storage, StorageLayer } from "@/lib/storage";
import { useAccount, useWalletClient } from "wagmi";
import type { Position as StoragePosition } from "@/types/models";

// Legacy interface for backward compatibility
// TODO: Migrate components to use Position from @/types/models
export interface Position {
  id: string;
  user_id: string;
  startup_id: string;
  position_type: "long" | "short";
  entry_price: number;
  quantity: number;
  leverage: number;
  liquidation_price: number;
  status: "open" | "closed" | "liquidated";
  created_at: string;
  updated_at: string;
}

// Map storage position to legacy format
function mapStoragePositionToLegacy(pos: StoragePosition): Position {
  return {
    id: pos.id,
    user_id: pos.userId,
    startup_id: pos.marketId,
    position_type: pos.positionType,
    entry_price: pos.entryPrice,
    quantity: pos.baseSize,
    leverage: pos.leverage,
    liquidation_price: pos.liquidationPrice,
    status: pos.status,
    created_at: pos.openedAt.toISOString(),
    updated_at: pos.openedAt.toISOString(),
  };
}

export const usePositions = (startupSlug?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const { data: positions, isLoading } = useQuery({
    queryKey: ["positions", address, startupSlug],
    queryFn: async () => {
      if (!address) {
        return [];
      }

      if (startupSlug) {
        // Get positions for specific market
        const storagePositions = await storage.getUserMarketPositions(address, startupSlug);
        return storagePositions.map(mapStoragePositionToLegacy);
      } else {
        // Get all user positions across all markets
        const storagePositions = await storage.getUserOpenPositions(address);
        return storagePositions.map(mapStoragePositionToLegacy);
      }
    },
    enabled: !!address,
  });

  const openPosition = useMutation({
    mutationFn: async ({
      startupSlug,
      positionType,
      amount,
      leverage,
    }: {
      startupSlug: string;
      positionType: "long" | "short";
      amount: number;
      leverage: number;
    }) => {
      if (!address) throw new Error("Wallet not connected");

      // Open position via storage layer (which calls contracts)
      const result = await storage.openPosition(address, {
        marketSlug: startupSlug,
        side: positionType,
        totalAmount: amount,
        leverage,
      });

      if (result.status === "failed") {
        throw new Error(result.error || "Failed to open position");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast({
        title: "Position Opened",
        description: "Your position has been successfully opened",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const closePosition = useMutation({
    mutationFn: async (positionId: string) => {
      if (!address || !walletClient) throw new Error("Wallet not connected");
      if (!startupSlug) throw new Error("Market slug required to close position");

      const walletStorage = new StorageLayer(walletClient);
      const contractInfo = await walletStorage['supabase'].getMarketContractInfoBySlug(startupSlug);

      if (!contractInfo) {
        throw new Error(`Market ${startupSlug} does not have contracts deployed`);
      }

      const result = await walletStorage.contracts.closePosition(
        address,
        contractInfo.perpEngineAddress,
        { positionId }
      );

      if (result.status === "failed") {
        throw new Error(result.error || "Failed to close position");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast({
        title: "Position Closed",
        description: "Your position has been successfully closed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    positions,
    isLoading,
    openPosition,
    closePosition,
  };
};

export const calculatePnL = (
  position: Position,
  currentPrice: number
): { pnl: number; pnlPercent: number; isProfit: boolean } => {
  const isLong = position.position_type === "long";
  const priceChange = currentPrice - position.entry_price;
  const pnl = isLong
    ? (priceChange * position.quantity * position.leverage)
    : (-priceChange * position.quantity * position.leverage);
  
  const investment = position.entry_price * position.quantity;
  const pnlPercent = (pnl / investment) * 100;

  return {
    pnl,
    pnlPercent,
    isProfit: pnl >= 0,
  };
};

export const checkLiquidationRisk = (
  position: Position,
  currentPrice: number
): { risk: "low" | "medium" | "high"; distance: number } => {
  const isLong = position.position_type === "long";
  const distanceToLiquidation = isLong
    ? ((currentPrice - position.liquidation_price) / position.liquidation_price) * 100
    : ((position.liquidation_price - currentPrice) / currentPrice) * 100;

  let risk: "low" | "medium" | "high" = "low";
  if (distanceToLiquidation < 5) risk = "high";
  else if (distanceToLiquidation < 15) risk = "medium";

  return { risk, distance: distanceToLiquidation };
};
