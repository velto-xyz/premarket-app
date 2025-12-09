import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

export const usePositions = (startupId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: positions, isLoading } = useQuery({
    queryKey: ["positions", startupId],
    queryFn: async () => {
      const query = supabase
        .from("user_positions")
        .select("*")
        .eq("status", "open");

      if (startupId) {
        query.eq("startup_id", startupId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data as Position[];
    },
  });

  const openPosition = useMutation({
    mutationFn: async ({
      startupId,
      positionType,
      currentPrice,
      quantity,
      leverage,
    }: {
      startupId: string;
      positionType: "long" | "short";
      currentPrice: number;
      quantity: number;
      leverage: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Calculate liquidation price
      const liquidationPrice =
        positionType === "long"
          ? currentPrice * (1 - 1 / leverage)
          : currentPrice * (1 + 1 / leverage);

      const { data, error } = await supabase.from("user_positions").insert({
        user_id: user.id,
        startup_id: startupId,
        position_type: positionType,
        entry_price: currentPrice,
        quantity,
        leverage,
        liquidation_price: liquidationPrice,
        status: "open",
      }).select().single();

      if (error) throw error;
      return data;
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
      const { error } = await supabase
        .from("user_positions")
        .update({ status: "closed" })
        .eq("id", positionId);

      if (error) throw error;
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
