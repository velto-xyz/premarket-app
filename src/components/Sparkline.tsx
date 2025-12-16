import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { useTheme } from "next-themes";

interface SparklineProps {
  data: { price: number }[];
  width?: number | string;
  height?: number;
  showGradient?: boolean;
}

export default function Sparkline({
  data,
  width = "100%",
  height = 40,
  showGradient = true,
}: SparklineProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (!data || data.length === 0) {
    return (
      <div style={{ width, height }} className="flex items-center justify-center">
        <span className="text-xs text-muted-foreground">No data</span>
      </div>
    );
  }

  const prices = data.map((d) => d.price);
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const isPositive = lastPrice >= firstPrice;

  const chartColor = isPositive
    ? isDark ? "#10b981" : "#16A34A"
    : isDark ? "#ef4444" : "#EA580C";

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.1 || 1;

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          {showGradient && (
            <defs>
              <linearGradient id={`sparkGrad-${isPositive}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
          )}
          <YAxis
            domain={[minPrice - padding, maxPrice + padding]}
            hide
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={chartColor}
            strokeWidth={1.5}
            fill={showGradient ? `url(#sparkGrad-${isPositive})` : "transparent"}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
