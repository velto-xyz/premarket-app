import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import unicornVideo from "@/assets/unicorn-visualization.mp4";
import { startupLogos } from "@/assets/logos";
import { getTicker } from "@/lib/tickers";

export default function StartupDetail() {
  const { startupSlug } = useParams();

  const { data: startup, isLoading } = useQuery({
    queryKey: ["startup", startupSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startups")
        .select("*, industries(*)")
        .eq("slug", startupSlug)
        .single();

      if (error) throw error;
      return data;
    },
  });

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
                      ${(startup.market_cap || 0).toLocaleString()}
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
                  startupName={startup.name}
                  currentPrice={startup.current_price}
                  priceChange24h={startup.price_change_24h || 0}
                  color={startup.unicorn_color || '#8B5CF6'}
                />
              </CardContent>
            </Card>

            {/* Unicorn Visualization */}
            <Card className="glass border-border overflow-hidden" style={{ backgroundColor: '#0A0A0A' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-mono">
                  {getTicker(startup.slug)} Unicorn
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div 
                  className="w-full flex items-center justify-center" 
                  style={{ backgroundColor: '#050505' }}
                >
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto object-contain"
                    style={{ maxHeight: '500px' }}
                  >
                    <source src={unicornVideo} type="video/mp4" />
                  </video>
                </div>
                <div className="px-6 py-4 border-t border-border/40" style={{ backgroundColor: '#0A0A0A' }}>
                  <p className="text-sm text-muted-foreground text-center">
                    Startup Visualization. You're betting on this future Unicorn!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trading Sidebar */}
          <div className="space-y-6">
            <LiquidationMonitor />
            <TradingPanel
              startupId={startup.id}
              startupName={startup.name}
              currentPrice={startup.current_price}
            />
            <PositionsPanel
              startupId={startup.id}
              currentPrice={startup.current_price}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
