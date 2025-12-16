import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, X, AlertTriangle } from "lucide-react";
import {
  usePositions,
  calculatePnL,
  checkLiquidationRisk,
} from "@/hooks/usePositions";

interface PositionsPanelProps {
  startupSlug: string;
  currentPrice: number;
}

export default function PositionsPanel({
  startupSlug,
  currentPrice,
}: PositionsPanelProps) {
  const { positions, isLoading, closePosition } = usePositions(startupSlug);

  if (isLoading) {
    return (
      <Card className="glass border-border">
        <CardHeader>
          <CardTitle>Your Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Loading positions...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!positions || positions.length === 0) {
    return (
      <Card className="glass border-border">
        <CardHeader>
          <CardTitle>Your Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-2">
            <div className="text-muted-foreground">
              No open positions for this startup
            </div>
            <div className="text-xs text-muted-foreground">
              New positions will appear here after opening a trade
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Positions</span>
          <Badge variant="outline">{positions.length} Open</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {positions.map((position) => {
          const { pnl, pnlPercent, isProfit } = calculatePnL(
            position,
            currentPrice
          );
          const { risk, distance } = checkLiquidationRisk(
            position,
            currentPrice
          );
          const isLong = position.position_type === "long";

          return (
            <div
              key={position.id}
              className="p-4 rounded-lg bg-background/50 border border-border space-y-3"
            >
              {/* Position Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {isLong ? (
                    <TrendingUp className="w-5 h-5 text-success" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-destructive" />
                  )}
                  <div>
                    <div className="font-semibold">
                      {isLong ? "Long" : "Short"} {Math.round(position.leverage)}x
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {position.quantity.toFixed(4)} shares
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => closePosition.mutate(position.id)}
                  variant="ghost"
                  size="icon"
                  disabled={closePosition.isPending}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Position Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Entry Price</div>
                  <div className="font-medium">
                    ${position.entry_price.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Current Price</div>
                  <div className="font-medium">${currentPrice.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Investment</div>
                  <div className="font-medium">
                    ${(position.entry_price * position.quantity).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Exposure</div>
                  <div className="font-bold text-primary">
                    $
                    {(
                      position.entry_price *
                      position.quantity *
                      position.leverage
                    ).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* P&L Display */}
              <div
                className={`p-3 rounded-lg ${
                  isProfit ? "bg-success/10" : "bg-destructive/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Unrealized P&L
                  </div>
                  <div
                    className={`font-bold text-lg ${
                      isProfit ? "text-success" : "text-destructive"
                    }`}
                  >
                    {isProfit ? "+" : ""}${pnl.toFixed(2)}
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground mt-1">
                  {isProfit ? "+" : ""}
                  {pnlPercent.toFixed(2)}%
                </div>
              </div>

              {/* Liquidation Risk */}
              <div
                className={`flex items-start gap-2 p-2 rounded-lg ${
                  risk === "high"
                    ? "bg-destructive/10 border border-destructive/20"
                    : risk === "medium"
                    ? "bg-yellow-500/10 border border-yellow-500/20"
                    : "bg-success/10 border border-success/20"
                }`}
              >
                {risk === "high" && (
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                )}
                <div className="flex-1 text-xs">
                  <div
                    className={`font-medium ${
                      risk === "high"
                        ? "text-destructive"
                        : risk === "medium"
                        ? "text-yellow-500"
                        : "text-success"
                    }`}
                  >
                    {risk === "high" && "⚠️ High Risk"}
                    {risk === "medium" && "⚡ Medium Risk"}
                    {risk === "low" && "✓ Low Risk"}
                  </div>
                  <div className="text-muted-foreground mt-1">
                    Liquidation: ${position.liquidation_price.toFixed(2)} (
                    {distance.toFixed(1)}% away)
                  </div>
                </div>
              </div>

              {/* Close Position Button */}
              <Button
                onClick={() => closePosition.mutate(position.id)}
                variant="outline"
                className="w-full"
                disabled={closePosition.isPending}
              >
                {closePosition.isPending ? "Closing..." : "Close Position"}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
