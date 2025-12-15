import { useState, useMemo } from "react";
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

interface PriceChartProps {
  startupName: string;
  currentPrice: number;
  priceChange24h: number;
  color?: string;
}

type TimeFrame = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

// Generate mock historical price data
const generatePriceHistory = (
  currentPrice: number,
  priceChange24h: number,
  timeframe: TimeFrame
) => {
  const dataPoints: { [key in TimeFrame]: number } = {
    "1D": 24,
    "1W": 7 * 24,
    "1M": 30,
    "3M": 90,
    "1Y": 365,
    "ALL": 730,
  };

  const points = dataPoints[timeframe];
  const data = [];
  const volatility = 0.03; // 3% volatility
  const trend = priceChange24h / 100;

  let price = currentPrice * (1 - trend * (points / 24));

  for (let i = 0; i < points; i++) {
    const randomChange = (Math.random() - 0.5) * volatility;
    const trendChange = trend / (points / 24);
    price = price * (1 + trendChange + randomChange);

    let timeLabel = "";
    if (timeframe === "1D") {
      timeLabel = `${i}:00`;
    } else if (timeframe === "1W") {
      const day = Math.floor(i / 24);
      timeLabel = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day % 7];
    } else if (timeframe === "1M" || timeframe === "3M") {
      timeLabel = i % 5 === 0 ? `Day ${i}` : "";
    } else {
      timeLabel = i % 30 === 0 ? `${Math.floor(i / 30)}M` : "";
    }

    data.push({
      time: timeLabel,
      price: parseFloat(price.toFixed(2)),
      index: i,
    });
  }

  return data;
};

export default function PriceChart({
  startupName,
  currentPrice,
  priceChange24h,
  color = "#8B5CF6",
}: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<TimeFrame>("1M");
  const { resolvedTheme } = useTheme();

  const chartData = useMemo(
    () => generatePriceHistory(currentPrice, priceChange24h, timeframe),
    [currentPrice, priceChange24h, timeframe]
  );

  const isPositive = priceChange24h >= 0;
  const isDark = resolvedTheme === "dark";

  // Theme-aware chart colors: brighter in dark mode, more muted in light mode
  const chartColor = isPositive
    ? (isDark ? "#10b981" : "#16A34A")  // Green: bright in dark, professional in light
    : (isDark ? "#ef4444" : "#EA580C"); // Red/Orange: bright in dark, warm in light

  const prices = chartData.map((d) => d.price).filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 100;
  const priceRange = maxPrice - minPrice || 1;

  return (
    <div className="space-y-4">
      {/* Price Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-muted-foreground mb-1">
            {startupName} Price
          </div>
          <div className="text-4xl font-bold">${currentPrice.toFixed(2)}</div>
          <div
            className={`flex items-center gap-2 mt-2 text-lg font-medium ${
              isPositive ? "text-success" : "text-destructive"
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
              className={`text-xs px-3 ${
                timeframe === tf ? "glow" : ""
              }`}
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 w-full rounded-lg bg-background/30 border border-border p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`colorPrice-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={chartColor}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={chartColor}
                  stopOpacity={0}
                />
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
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              domain={[
                Math.max(0, minPrice - priceRange * 0.1),
                maxPrice + priceRange * 0.1,
              ]}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
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
              formatter={(value: number) => [
                `$${value.toFixed(2)}`,
                "Price",
              ]}
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
      </div>

      {/* Chart Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 rounded-lg bg-background/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">24h High</div>
          <div className="text-lg font-bold">${maxPrice.toFixed(2)}</div>
        </div>
        <div className="p-3 rounded-lg bg-background/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">24h Low</div>
          <div className="text-lg font-bold">${minPrice.toFixed(2)}</div>
        </div>
        <div className="p-3 rounded-lg bg-background/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">24h Volume</div>
          <div className="text-lg font-bold">
            ${((currentPrice * 1000000 * Math.random()) / 1000).toFixed(0)}K
          </div>
        </div>
      </div>
    </div>
  );
}
