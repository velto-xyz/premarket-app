import { useQuery } from "@tanstack/react-query";
import { storage } from "@/lib/storage";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, MapPin } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import PriceChart from "@/components/PriceChart";
import TradingPanel from "@/components/trading/TradingPanel";
import PositionsPanel from "@/components/trading/PositionsPanel";
import LiquidationMonitor from "@/components/trading/LiquidationMonitor";
import NewsTicker from "@/components/NewsTicker";
import { startupLogos } from "@/assets/logos";
import { getTicker } from "@/lib/tickers";
import { formatUSD, formatCompact } from "@/lib/format";
import { SupabaseSource } from "@/lib/storage/sources/SupabaseSource";
import { useSync } from "@/hooks/useSync";

const supabaseSource = new SupabaseSource();

export default function StartupDetail() {
  const { startupSlug } = useParams();

  // Sync data from indexer on page load
  useSync();

  const { data: market, isLoading } = useQuery({
    queryKey: ["market", startupSlug],
    queryFn: async () => {
      if (!startupSlug) return null;
      return await storage.getMarket(startupSlug);
    },
    refetchInterval: 5000, // Refresh price every 5 seconds
  });

  // Get industry info (temporary - until we add to storage layer)
  const { data: industry } = useQuery({
    queryKey: ["industry", market?.industryId],
    queryFn: async () => {
      if (!market?.industryId) return null;
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase
        .from("industries")
        .select("*")
        .eq("id", market.industryId)
        .single();
      return data;
    },
    enabled: !!market?.industryId,
  });

  // Get 24h price change from Supabase
  const { data: priceChange24h = 0 } = useQuery({
    queryKey: ["priceChange24h", startupSlug],
    queryFn: async () => {
      if (!startupSlug) return 0;
      const contractInfo = await supabaseSource.getMarketContractInfoBySlug(startupSlug);
      if (!contractInfo?.perpEngineAddress) return 0;
      const stats = await supabaseSource.getMarketStats24h(contractInfo.perpEngineAddress);
      return stats?.change24h || 0;
    },
    enabled: !!startupSlug,
    staleTime: 60000, // 1 minute
  });

  // Transform to match component expectations
  const startup = market ? {
    id: market.id,
    name: market.name,
    slug: market.slug,
    description: market.description,
    logo_url: market.logoUrl,
    industry_id: market.industryId,
    hq_location: market.hqLocation,
    hq_latitude: market.hqLatitude,
    hq_longitude: market.hqLongitude,
    current_price: market.currentPrice,
    price_change_24h: priceChange24h,
    market_cap: market.quoteReserve,  // quoteReserve is the market cap in vAMM model
    unicorn_color: market.unicornColor,
    year_founded: market.yearFounded,
    founders: market.founders,
    industries: industry
  } : null;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!startup) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Startup not found</p>
        </div>
      </AppLayout>
    );
  }

  const isPositive = (startup.price_change_24h || 0) >= 0;

  return (
    <AppLayout>
      {/* Bloomberg-style News Ticker */}
      <NewsTicker startupSlug={startup.slug} startupName={startup.name} />
      
      <div className="container mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card className="glass border-border">
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-background flex items-center justify-center p-2">
                      <img 
                        src={startupLogos[startup.slug]} 
                        alt={`${startup.name} logo`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-xl text-primary font-bold">{getTicker(startup.slug)}</span>
                        <h1 className="text-4xl font-heading font-bold">
                          {startup.name}
                        </h1>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{startup.hq_location}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {startup.industries?.name}
                  </Badge>
                </div>

                <p className="text-muted-foreground mb-6">
                  {startup.description}
                </p>

                {/* Market Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-card border border-border shadow-sm">
                    <div className="text-sm text-muted-foreground mb-1">
                      Market Cap
                    </div>
                    <div className="text-2xl font-bold">
                      ${formatCompact(startup.market_cap || 0)}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-card border border-border shadow-sm">
                    <div className="text-sm text-muted-foreground mb-1">
                      24h Change
                    </div>
                    <div
                      className={`text-2xl font-bold flex items-center gap-2 ${
                        isPositive ? "text-success" : "text-destructive"
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                      {isPositive ? "+" : ""}
                      {(startup.price_change_24h || 0).toFixed(2)}%
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-card border border-border shadow-sm">
                    <div className="text-sm text-muted-foreground mb-1">
                      Year Founded
                    </div>
                    <div className="text-2xl font-bold">
                      {startup.year_founded || 'N/A'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Chart */}
            <Card className="glass border-border">
              <CardHeader>
                <CardTitle>Price Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <PriceChart
                  marketSlug={startup.slug}
                  startupName={startup.name}
                  currentPrice={startup.current_price}
                  priceChange24h={startup.price_change_24h || 0}
                  color={startup.unicorn_color || '#8B5CF6'}
                />
              </CardContent>
            </Card>
          </div>

          {/* Trading Sidebar */}
          <div className="space-y-6">
            <LiquidationMonitor />
            <TradingPanel
              startupId={startup.id}
              startupName={startup.name}
              startupSlug={startupSlug!}
              currentPrice={startup.current_price}
            />
            <PositionsPanel
              startupSlug={startup.slug}
              currentPrice={startup.current_price}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
