import { useQuery } from "@tanstack/react-query";
import { storage } from "@/lib/storage";
import { StorageLayer } from "@/lib/storage/StorageLayer";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMarketDataStream } from "@/hooks/useMarketDataStream";

export default function Industries() {
  const navigate = useNavigate();

  //  Industries still from Supabase (not migrated to storage layer yet)
  const { data: industries, isLoading } = useQuery({
    queryKey: ["industries"],
    queryFn: async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("industries")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const { data: markets } = useQuery({
    queryKey: ["all-markets"],
    queryFn: async () => {
      return await storage.getAllMarkets();
    },
  });

  // Stream real-time market data from contracts (polls every 3s)
  useMarketDataStream(markets);

  // Calculate totals from markets
  const totalMarketCap = useMemo(() => {
    if (!markets) return 0;
    return markets.reduce((sum, m) => sum + (Number(m.quoteReserve) || 0), 0);
  }, [markets]);

  const totalVolume = useMemo(() => {
    if (!markets) return 0;
    return markets.reduce((sum, m) => sum + (Number(m.totalVolume) || 0), 0);
  }, [markets]);

  // Fetch platform volume history
  const { data: volumeData = [] } = useQuery({
    queryKey: ["platform-volume-history"],
    queryFn: async () => {
      const storageLayer = new StorageLayer();
      const data = await storageLayer['supabase'].getPlatformVolumeByDay(30);
      return data.map(d => ({
        time: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: d.volume
      }));
    },
    staleTime: 60000,
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

  return (
    <AppLayout>
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-5xl font-heading font-bold mb-2 text-foreground">
            AI Startups <span className="text-gradient">Market</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Trade tokenized stocks of private companies across industries
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries?.map((industry) => {
            const IconComponent = industry.icon_name 
              ? (Icons as any)[industry.icon_name] || Icons.Sparkles
              : Icons.Sparkles;

            return (
              <Card
                key={industry.id}
                className="group cursor-pointer border-border hover:border-primary transition-all duration-300 overflow-hidden glass hover:glow"
                onClick={() => navigate(`/markets/${industry.slug}`)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-6 relative">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                      <IconComponent className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-heading font-bold mb-2 group-hover:text-primary transition-colors">
                        {industry.name}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {industry.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Analytics Dashboard */}
        <div className="mt-12 space-y-6">
          <h2 className="text-3xl font-heading font-bold text-foreground">
            Platform <span className="text-gradient">Analytics</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Markets */}
            <Card className="glass border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icons.Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Markets</p>
                    <p className="text-3xl font-bold text-foreground">{markets?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Market Cap */}
            <Card className="glass border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icons.DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Market Cap</p>
                    <p className="text-3xl font-bold tabular-nums text-foreground">
                      ${totalMarketCap >= 1000000000
                        ? `${(totalMarketCap / 1000000000).toFixed(2)}B`
                        : totalMarketCap >= 1000000
                        ? `${(totalMarketCap / 1000000).toFixed(2)}M`
                        : totalMarketCap.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 24H Volume */}
            <Card className="glass border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icons.BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">24H Volume</p>
                    <p className="text-3xl font-bold tabular-nums text-foreground">
                      ${totalVolume >= 1000000000
                        ? `${(totalVolume / 1000000000).toFixed(2)}B`
                        : totalVolume >= 1000000
                        ? `${(totalVolume / 1000000).toFixed(2)}M`
                        : totalVolume.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trading Volume Chart */}
          <Card className="glass border-border">
            <CardContent className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-heading font-bold text-foreground">Trading Volume</h3>
                <p className="text-sm text-muted-foreground">Daily trading volume (last 30 days)</p>
              </div>

              {volumeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={volumeData}>
                    <defs>
                      <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis
                      dataKey="time"
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))',
                      }}
                      formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, 'Volume']}
                    />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#volumeGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Icons.BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No volume data yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
