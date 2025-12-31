import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTheme } from "next-themes";
import { usePriceHistory, formatTimeLabel, type TimeFrame } from "@/hooks/usePriceHistory";
import { formatUSD } from "@/lib/format";

interface PriceChartProps {
  marketSlug: string;
  startupName: string;
  currentPrice: number;
  priceChange24h: number;
  color?: string;
}

export default function PriceChart({
  marketSlug,
  startupName,
  currentPrice,
  priceChange24h,
  color = "#8B5CF6",
}: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<TimeFrame>("1M");
  const { resolvedTheme } = useTheme();

  // Fetch real price history from positions
  const { data: priceData, isLoading } = usePriceHistory(
    marketSlug,
    timeframe,
    currentPrice
  );

  const isPositive = priceChange24h >= 0;
  const isDark = resolvedTheme === "dark";

  // Theme-aware chart colors
  const chartColor = isPositive
    ? isDark
      ? "#10b981"
      : "#16A34A"
    : isDark
      ? "#ef4444"
      : "#EA580C";

  // Transform price points to chart data
  const chartData = (priceData?.points || []).map((point) => ({
    time: formatTimeLabel(point.timestamp, timeframe),
    price: point.price,
    timestamp: point.timestamp.getTime(),
  }));

  // If no historical data, show just current price
  if (chartData.length === 0 && currentPrice > 0) {
    chartData.push({
      time: "Now",
      price: currentPrice,
      timestamp: Date.now(),
    });
  }

  const prices = chartData.map((d) => d.price).filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : currentPrice * 0.9;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : currentPrice * 1.1;
  const priceRange = maxPrice - minPrice || currentPrice * 0.1;

  // Use real 24h stats if available, otherwise calculate from chart data
  const stats = priceData?.stats || { high: maxPrice, low: minPrice, volume: 0 };
  const displayHigh = stats.high > 0 ? stats.high : maxPrice;
  const displayLow = stats.low > 0 ? stats.low : minPrice;

  return (
    <div className="space-y-4">
      {/* Price Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-muted-foreground mb-1">
            {startupName} Price
          </div>
          <div className="text-4xl font-bold font-mono">{formatUSD(currentPrice)}</div>
          <div
            className={`flex items-center gap-2 mt-2 text-lg font-bold font-mono ${isPositive ? "text-success" : "text-destructive"
              }`}
          >
            {isPositive ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
            {isPositive ? "+" : ""}
            {priceChange24h.toFixed(2)}%
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-1 p-1 rounded-lg bg-background/50 border border-border">
          {(["1D", "1W", "1M", "3M", "1Y", "ALL"] as TimeFrame[]).map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeframe(tf)}
              className={`text-xs px-3 ${timeframe === tf ? "glow" : ""}`}
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 w-full rounded-lg bg-background/30 border border-border p-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Loading price data...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No trading data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id={`colorPrice-${color}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.2}
              />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
                tickLine={false}
              />
              <YAxis
                domain={[
                  Math.max(0, minPrice - priceRange * 0.1),
                  maxPrice + priceRange * 0.1,
                ]}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
                tickLine={false}
                width={60}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
                }}
                labelStyle={{
                  color: "hsl(var(--foreground))",
                  fontWeight: "bold",
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={chartColor}
                strokeWidth={2}
                fill={`url(#colorPrice-${color})`}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 rounded-lg bg-background/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">{timeframe} High</div>
          <div className="text-lg font-bold font-mono">
            {displayHigh > 0 ? formatUSD(displayHigh) : "-"}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-background/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">{timeframe} Low</div>
          <div className="text-lg font-bold font-mono">
            {displayLow > 0 ? formatUSD(displayLow) : "-"}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-background/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">{timeframe} Volume</div>
          <div className="text-lg font-bold font-mono">
            {stats.volume > 0 ? formatUSD(stats.volume) : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}
