import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, TrendingDown, AlertTriangle, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePositions } from "@/hooks/usePositions";

interface TradingPanelProps {
  startupId: string;
  startupName: string;
  currentPrice: number;
}

export default function TradingPanel({
  startupId,
  startupName,
  currentPrice,
}: TradingPanelProps) {
  const [positionType, setPositionType] = useState<"long" | "short">("long");
  const [quantity, setQuantity] = useState<string>("1");
  const [leverage, setLeverage] = useState<number>(1);
  const { openPosition } = usePositions(startupId);

  const quantityNum = parseFloat(quantity) || 0;
  const investment = currentPrice * quantityNum;
  const potentialGain = investment * leverage * 0.1; // 10% move example
  const liquidationPrice =
    positionType === "long"
      ? currentPrice * (1 - 1 / leverage)
      : currentPrice * (1 + 1 / leverage);

  const handleOpenPosition = () => {
    if (quantityNum <= 0) return;

    openPosition.mutate({
      startupId,
      positionType,
      currentPrice,
      quantity: quantityNum,
      leverage,
    });

    // Reset form
    setQuantity("1");
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

        {/* Quantity Input */}
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity (Shares)</Label>
          <Input
            id="quantity"
            type="number"
            min="0.01"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Enter quantity"
          />
        </div>

        {/* Leverage Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Multiplier</Label>
            <span className="text-lg font-bold text-primary">{leverage}x</span>
          </div>
          <Slider
            value={[leverage]}
            onValueChange={([val]) => setLeverage(val)}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
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
                  Your position will hit auto-sell if price reaches $
                  {liquidationPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Position Summary */}
        <div className="p-4 rounded-lg bg-background/50 border border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Entry Price</span>
            <span className="font-medium">${currentPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Investment</span>
            <span className="font-medium">${investment.toFixed(2)}</span>
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
            <span className="font-bold text-primary">
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
            <span className="font-medium text-destructive">
              ${liquidationPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-border">
            <span className="text-muted-foreground">Potential +10% Gain</span>
            <span className="font-bold text-success">
              +${potentialGain.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Open Position Button */}
        <Button
          onClick={handleOpenPosition}
          disabled={quantityNum <= 0 || openPosition.isPending}
          className="w-full glow"
          size="lg"
        >
          {openPosition.isPending ? "Processing..." : "Confirm Trade"}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Trading fee: 0.1% • Max multiplier: 10x
        </p>
      </CardContent>
    </Card>
  );
}
