import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, TrendingDown, AlertTriangle, Info, Wallet } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTrading } from "@/hooks/useTrading";
import { StorageLayer } from "@/lib/storage";
import { SupabaseSource } from "@/lib/storage/sources/SupabaseSource";

const supabaseSource = new SupabaseSource();

interface TradingPanelProps {
  startupId: string;
  startupName: string;
  startupSlug: string;
  currentPrice: number;
}

export default function TradingPanel({
  startupId,
  startupName,
  startupSlug,
  currentPrice,
}: TradingPanelProps) {
  const [positionType, setPositionType] = useState<"long" | "short">("long");
  const [amount, setAmount] = useState<string>("100");
  const [leverage, setLeverage] = useState<number>(1);
  const { openPosition, internalBalance, availableBalance, isConnected } = useTrading(startupSlug);

  const amountNum = parseFloat(amount) || 0;
  const investment = amountNum;
  const notional = investment * leverage;

  // Simulate trade to get estimated entry price with slippage
  const { data: tradeSimulation } = useQuery({
    queryKey: ["tradeSimulation", startupSlug, positionType, notional],
    queryFn: async () => {
      if (notional <= 0) return null;
      const contractInfo = await supabaseSource.getMarketContractInfoBySlug(startupSlug);
      if (!contractInfo?.perpMarketAddress) return null;

      const storage = new StorageLayer();
      return storage.contracts.simulateOpenPosition(
        contractInfo.perpMarketAddress,
        positionType === "long",
        notional
      );
    },
    enabled: notional > 0,
    staleTime: 2000,
  });

  const estimatedEntryPrice = tradeSimulation?.avgPrice || currentPrice;
  const slippage = tradeSimulation?.slippage || 0;

  const potentialGain = investment * leverage * 0.1; // 10% move example
  const liquidationPrice =
    positionType === "long"
      ? estimatedEntryPrice * (1 - 1 / leverage)
      : estimatedEntryPrice * (1 + 1 / leverage);

  const needsDeposit = amountNum > internalBalance;
  const totalAvailable = internalBalance + availableBalance;
  const insufficientFunds = amountNum > totalAvailable;

  const handleOpenPosition = () => {
    if (amountNum <= 0) return;
    if (!isConnected) {
      return;
    }

    openPosition.mutate({
      marketSlug: startupSlug,
      positionType,
      amount: amountNum,
      leverage,
    });

    // Reset form
    setAmount("100");
    setLeverage(1);
  };

  return (
    <Card className="glass border-border sticky top-8">
      <CardHeader>
        <CardTitle className="flex flex-col">
          <span className="text-primary">Trade</span>
          <span>{startupName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Position Type Selector */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setPositionType("long")}
            variant={positionType === "long" ? "default" : "outline"}
            className={positionType === "long" ? "bg-success hover:bg-success/90 text-success-foreground glow" : ""}
            size="lg"
          >
            <TrendingUp className="mr-2 h-5 w-5" />
            Will go Up
          </Button>
          <Button
            onClick={() => setPositionType("short")}
            variant={positionType === "short" ? "destructive" : "outline"}
            size="lg"
          >
            <TrendingDown className="mr-2 h-5 w-5" />
            Will go Down
          </Button>
        </div>

        {/* Balance Display */}
        {isConnected && (
          <div className="p-3 rounded-lg bg-background/50 border border-border space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Wallet className="h-4 w-4" />
                Wallet Balance
              </span>
              <span className="font-mono font-semibold">${availableBalance.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Deposited Balance</span>
              <span className="font-mono font-semibold">${internalBalance.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (USDC)</Label>
          <Input
            id="amount"
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="font-mono"
          />
          {needsDeposit && isConnected && !insufficientFunds && (
            <p className="text-xs text-amber-500">
              Will deposit <span className="font-mono">${(amountNum - internalBalance).toFixed(2)}</span> from wallet
            </p>
          )}
          {insufficientFunds && isConnected && (
            <p className="text-xs text-destructive">
              Need <span className="font-mono">${(amountNum - totalAvailable).toFixed(2)}</span> more USDC
            </p>
          )}
        </div>

        {/* Leverage Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Multiplier</Label>
            <span className="text-lg font-bold text-primary font-mono">{leverage}x</span>
          </div>
          <Slider
            value={[leverage]}
            onValueChange={([val]) => setLeverage(val)}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>1x (Safe)</span>
            <span>5x</span>
            <span>10x (Risky)</span>
          </div>
        </div>

        {/* Liquidation Warning */}
        {leverage > 3 && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <div className="text-sm font-medium text-destructive mb-1">
                  High Liquidation Risk
                </div>
                <p className="text-xs text-muted-foreground">
                  Your position will hit auto-sell if price reaches <span className="font-mono">${liquidationPrice.toFixed(2)}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Position Summary */}
        <div className="p-4 rounded-lg bg-background/50 border border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mark Price</span>
            <span className="font-medium font-mono">${currentPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              Est. Entry Price
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[220px]">Estimated average price after slippage. Larger trades move the market more.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <span className="font-medium font-mono">
              ${estimatedEntryPrice.toFixed(2)}
              {slippage !== 0 && (
                <span className={`ml-1 text-xs ${slippage > 0 ? "text-destructive" : "text-success"}`}>
                  ({slippage > 0 ? "+" : ""}{slippage.toFixed(2)}%)
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Investment</span>
            <span className="font-medium font-mono">${investment.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              Position Value
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[220px]">If I put in $100 with 5x multiplier, my "Total Position Value" is $500.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <span className="font-bold text-primary font-mono">
              ${(investment * leverage).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              Liquidation Price
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[200px]">If the stock price hits this level, we automatically close your trade to prevent debt.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <span className="font-medium text-destructive font-mono">
              ${liquidationPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-border">
            <span className="text-muted-foreground">Potential +10% Gain</span>
            <span className="font-bold text-success font-mono">
              +${potentialGain.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Open Position Button */}
        <Button
          onClick={handleOpenPosition}
          disabled={!isConnected || amountNum <= 0 || openPosition.isPending || insufficientFunds}
          className="w-full glow"
          size="lg"
        >
          {!isConnected
            ? "Connect Wallet to Trade"
            : insufficientFunds
              ? "Insufficient Funds"
              : openPosition.isPending
                ? "Processing..."
                : needsDeposit
                  ? "Deposit & Trade"
                  : "Confirm Trade"}
        </Button>

        <p className="text-xs text-muted-foreground text-center font-mono">
          Trading fee: 0.1% • Max multiplier: 10x
          {needsDeposit && isConnected && !insufficientFunds && (
            <span className="block mt-1 text-amber-500 font-sans">
              Requires permit signature + transaction
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
