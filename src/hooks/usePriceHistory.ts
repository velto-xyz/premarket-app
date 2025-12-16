import { useQuery } from "@tanstack/react-query";
import { SupabaseSource, type PeriodStats } from "@/lib/storage/sources/SupabaseSource";
import type { PricePoint } from "@/types/models";

export type TimeFrame = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

type IntervalType = 'D' | 'W' | 'M' | '3M' | 'Y' | 'ALL';

function getTimeframeSince(timeframe: TimeFrame): Date | undefined {
  const now = Date.now();
  switch (timeframe) {
    case "1D":
      return new Date(now - 24 * 60 * 60 * 1000);
    case "1W":
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case "1M":
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    case "3M":
      return new Date(now - 90 * 24 * 60 * 60 * 1000);
    case "1Y":
      return new Date(now - 365 * 24 * 60 * 60 * 1000);
    case "ALL":
      return undefined;
  }
}

function timeframeToInterval(timeframe: TimeFrame): IntervalType {
  switch (timeframe) {
    case "1D": return 'D';
    case "1W": return 'W';
    case "1M": return 'M';
    case "3M": return '3M';
    case "1Y": return 'Y';
    case "ALL": return 'ALL';
  }
}

export interface PriceHistoryData {
  points: PricePoint[];
  stats: {
    high: number;
    low: number;
    volume: number;
    changePct?: number;
  };
}

const supabaseSource = new SupabaseSource();

export function usePriceHistory(
  marketSlug: string,
  timeframe: TimeFrame,
  currentPrice?: number
) {
  return useQuery({
    queryKey: ["price-history", marketSlug, timeframe],
    queryFn: async (): Promise<PriceHistoryData> => {
      const since = getTimeframeSince(timeframe);
      let points: PricePoint[] = [];
      let stats = { high: 0, low: 0, volume: 0, changePct: 0 };

      const contractInfo = await supabaseSource.getMarketContractInfoBySlug(marketSlug);

      if (contractInfo?.perpEngineAddress) {
        // Use 5m for 1D, hourly for 1W, daily for longer timeframes
        const interval = timeframe === "1D" ? "5m" : timeframe === "1W" ? "1h" : "1d";
        const ohlcv = await supabaseSource.getOHLCV(
          contractInfo.perpEngineAddress,
          interval,
          since
        );

        // Convert OHLCV to price points (using close price)
        points = ohlcv.map(candle => ({
          timestamp: candle.timestamp,
          price: candle.close,
          volume: candle.volume
        }));

        // Get period stats
        const periodStats = await supabaseSource.getPeriodStats(
          contractInfo.perpEngineAddress,
          timeframeToInterval(timeframe)
        );

        if (periodStats) {
          stats = {
            high: periodStats.high,
            low: periodStats.low,
            volume: periodStats.volume,
            changePct: periodStats.changePct
          };
        }
      }

      // Add current price as the latest point if provided
      if (currentPrice && currentPrice > 0) {
        points.push({
          price: currentPrice,
          timestamp: new Date(),
        });
      }

      return { points, stats };
    },
    enabled: !!marketSlug,
    staleTime: 60000, // Consider data stale after 1 minute (no polling)
  });
}

export function formatTimeLabel(timestamp: Date, timeframe: TimeFrame): string {
  switch (timeframe) {
    case "1D":
      return timestamp.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    case "1W":
      return timestamp.toLocaleDateString("en-US", { weekday: "short" });
    case "1M":
    case "3M":
      return timestamp.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    case "1Y":
    case "ALL":
      return timestamp.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
  }
}
