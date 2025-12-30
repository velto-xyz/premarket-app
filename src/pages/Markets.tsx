import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { storage } from "@/lib/storage";
import { StorageLayer } from "@/lib/storage/StorageLayer";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Filter, Sparkles, BarChart3, Brain, DollarSign, ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startupLogos } from "@/assets/logos";
import { getTicker } from "@/lib/tickers";
import { formatUSD, formatPercent, formatCompactUSD } from "@/lib/format";
import { useMarketDataStream } from "@/hooks/useMarketDataStream";
import { useSentiments } from "@/hooks/useSentiment";

export default function Markets() {
  const navigate = useNavigate();
  const { industrySlug } = useParams();
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");

  // Industries still from Supabase directly (not in storage layer yet)
  const { data: industries } = useQuery({
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

  // Set the selected industry based on URL slug
  useEffect(() => {
    if (industrySlug && industries) {
      const industry = industries.find((ind) => ind.slug === industrySlug);
      if (industry) {
        setSelectedIndustry(industry.id);
      }
    }
  }, [industrySlug, industries]);

  const { data: markets, isLoading } = useQuery({
    queryKey: ["all-markets"],
    queryFn: async () => {
      return await storage.getAllMarkets();
    },
  });

  // Fetch 7-day price trends for sparklines
  const engineAddresses = markets?.map(m => m.perpEngineAddress).filter(Boolean) || [];
  const { data: priceTrends = {} } = useQuery({
    queryKey: ["markets-7d-trends", engineAddresses],
    queryFn: async () => {
      if (engineAddresses.length === 0) return {};
      const storageLayer = new StorageLayer();
      const trends: Record<string, { price: number }[]> = {};
      await Promise.all(
        engineAddresses.map(async (engine) => {
          if (!engine) return;
          const data = await storageLayer['supabase'].get7dTrend(engine);
          trends[engine] = data.map(p => ({ price: p.price }));
        })
      );
      return trends;
    },
    enabled: engineAddresses.length > 0,
    staleTime: 60000,
  });

  // Stream real-time market data from contracts (polls every 3s)
  useMarketDataStream(markets);

  // Transform Market[] to match component expectations (temporary compatibility layer)
  const startups = markets?.map(m => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    description: m.description,
    logo_url: m.logoUrl,
    industry_id: m.industryId,
    hq_location: m.hqLocation,
    hq_latitude: m.hqLatitude,
    hq_longitude: m.hqLongitude,
    current_price: m.currentPrice,
    price_change_24h: m.priceChange24h,
    market_cap: m.quoteReserve,  // quoteReserve is the market cap in vAMM model
    year_founded: m.yearFounded,
    unicorn_color: m.unicornColor,
    volume_24h: m.totalVolume,
    perp_engine_address: m.perpEngineAddress,
    industries: industries?.find(ind => ind.id === m.industryId)
  }));

  const getLogoUrl = (slug: string) => {
    return startupLogos[slug as keyof typeof startupLogos] || startupLogos["synapsehive-robotics"];
  };

  // Fetch sentiment scores for "Most Trending" card
  const { data: sentimentMap } = useSentiments(
    startups?.map(s => ({ slug: s.slug, name: s.name })) || []
  );

  // Analytics Calculations
  const totalMarketCap = useMemo(() => {
    if (!markets) return 0;
    return markets.reduce((sum, m) => sum + (Number(m.quoteReserve) || 0), 0);
  }, [markets]);

  const totalVolume = useMemo(() => {
    if (!markets) return 0;
    return markets.reduce((sum, m) => sum + (Number(m.totalVolume) || 0), 0);
  }, [markets]);

  const topGainer = useMemo(() => {
    if (!startups || startups.length === 0) return null;
    return [...startups].sort((a, b) => Number(b.price_change_24h || 0) - Number(a.price_change_24h || 0))[0];
  }, [startups]);

  const mostLiquid = useMemo(() => {
    if (!startups || startups.length === 0) return null;
    return [...startups].sort((a, b) => Number(b.volume_24h || 0) - Number(a.volume_24h || 0))[0];
  }, [startups]);

  // Extract unique regions from startup locations
  const regions = useMemo(() => {
    if (!startups) return [];
    const uniqueRegions = new Set<string>();
    startups.forEach((startup) => {
      if (startup.hq_location) {
        // Extract region/country from location (last part after comma)
        const parts = startup.hq_location.split(",");
        const region = parts[parts.length - 1].trim();
        uniqueRegions.add(region);
      }
    });
    return Array.from(uniqueRegions).sort();
  }, [startups]);

  // Filter and sort startups
  const filteredAndSortedStartups = useMemo(() => {
    if (!startups) return [];

    let filtered = startups;

    // Filter by industry
    if (selectedIndustry !== "all") {
      filtered = filtered.filter((s) => s.industry_id === selectedIndustry);
    }

    // Filter by region
    if (selectedRegion !== "all") {
      filtered = filtered.filter((s) =>
        s.hq_location?.endsWith(selectedRegion)
      );
    }

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case "price-asc":
        sorted.sort((a, b) => Number(a.current_price) - Number(b.current_price));
        break;
      case "price-desc":
        sorted.sort((a, b) => Number(b.current_price) - Number(a.current_price));
        break;
      case "change-asc":
        sorted.sort((a, b) => Number(a.price_change_24h || 0) - Number(b.price_change_24h || 0));
        break;
      case "change-desc":
        sorted.sort((a, b) => Number(b.price_change_24h || 0) - Number(a.price_change_24h || 0));
        break;
      case "marketcap-asc":
        sorted.sort((a, b) => Number(a.market_cap || 0) - Number(b.market_cap || 0));
        break;
      case "marketcap-desc":
        sorted.sort((a, b) => Number(b.market_cap || 0) - Number(a.market_cap || 0));
        break;
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }

    return sorted;
  }, [startups, selectedIndustry, selectedRegion, sortBy]);

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
          <h1 className="text-6xl font-heading font-bold mb-2 text-foreground">
            <span className="text-foreground">Trade AI Startups</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-[520px]">
            Don't just watch the news, trade it! Predict the next move for the top Ai startups before they hit the stock market.
          </p>
        </div>

        {/* Analytics Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-12">
          {/* Column 1: Top Gainer */}
          <Card className="glass border-border relative overflow-hidden group h-full flex flex-col justify-between">
            <CardHeader className="p-5 pb-0 relative">
              <CardTitle className="text-muted-foreground text-xs uppercase tracking-wider">Top Gainer</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-5 relative">
              {topGainer ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={getLogoUrl(topGainer.slug)}
                        alt={topGainer.name}
                        className="w-16 h-16 rounded-xl object-cover border border-white/[0.08]"
                      />
                      <div>
                        <p className="font-mono font-bold text-foreground text-lg">{getTicker(topGainer.slug)}</p>
                        <p className="text-muted-foreground text-sm truncate max-w-[120px]">{topGainer.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-mono font-bold ${topGainer.price_change_24h >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {topGainer.price_change_24h >= 0 ? '+' : ''}{formatPercent(topGainer.price_change_24h)}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">24h Change</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full transition-all rounded-lg border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => navigate(`/startup/${topGainer.slug}`)}
                  >
                    Trade Now <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-4">Scanning markets...</div>
              )}
            </CardContent>
          </Card>

          {/* Column 2: Most Liquid */}
          <Card className="glass border-border relative overflow-hidden group h-full flex flex-col justify-between">
            <CardHeader className="p-5 pb-0 relative">
              <CardTitle className="text-muted-foreground text-xs uppercase tracking-wider">Most Liquid</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-5 relative">
              {mostLiquid ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={getLogoUrl(mostLiquid.slug)}
                        alt={mostLiquid.name}
                        className="w-16 h-16 rounded-xl object-cover border border-white/[0.08]"
                      />
                      <div>
                        <p className="font-mono font-bold text-foreground text-lg">{getTicker(mostLiquid.slug)}</p>
                        <p className="text-muted-foreground text-sm truncate max-w-[120px]">{mostLiquid.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-mono font-bold text-foreground">
                        {formatCompactUSD(mostLiquid.volume_24h)}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">24h Volume</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full transition-all rounded-lg border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => navigate(`/startup/${mostLiquid.slug}`)}
                  >
                    Trade Now <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-4">Scanning markets...</div>
              )}
            </CardContent>
          </Card>

          {/* Column 3: Stats Stacked */}
          <div className="flex flex-col gap-3">
            <Card className="glass border-border flex-1">
              <CardContent className="p-5 flex items-center h-full">
                <div className="flex items-center gap-4 w-full">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Market Cap</p>
                    <p className="text-3xl font-bold font-mono text-foreground">
                      {formatCompactUSD(totalMarketCap)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border flex-1">
              <CardContent className="p-5 flex items-center h-full">
                <div className="flex items-center gap-4 w-full">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">24H Volume</p>
                    <p className="text-3xl font-bold font-mono text-foreground">
                      {formatCompactUSD(totalVolume)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <h2 className="text-2xl font-heading font-bold mb-6 text-foreground">Startups Market</h2>

        {/* Category Filter Cards */}
        {/* Category Filter Cards */}
        <div className="flex overflow-x-auto pb-4 gap-3 mb-8 -mx-4 px-4 scrollbar-hide snap-x">
          {/* All Categories Card */}
          <Card
            className={`group cursor-pointer transition-all duration-300 overflow-hidden w-[160px] h-[160px] shrink-0 ${selectedIndustry === "all"
              ? "border-primary bg-primary/10 glow"
              : "border-border hover:border-primary glass hover:glow"
              }`}
            onClick={() => setSelectedIndustry("all")}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <CardContent className="p-4 relative h-full flex flex-col items-center justify-center text-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 ${selectedIndustry === "all"
                ? "bg-primary"
                : "bg-muted/40 group-hover:bg-primary group-hover:scale-110"
                }`}>
                <Icons.LayoutGrid className={`w-6 h-6 transition-colors ${selectedIndustry === "all"
                  ? "text-primary-foreground"
                  : "text-muted-foreground/70 group-hover:text-primary-foreground"
                  }`} />
              </div>
              <div className="space-y-1">
                <h3 className={`text-base font-heading font-bold transition-colors ${selectedIndustry === "all" ? "text-primary" : "group-hover:text-primary"
                  }`}>
                  All
                </h3>
                <p className="text-muted-foreground text-[12px] leading-tight px-1">
                  All available startups
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Industry Cards */}
          {industries?.map((industry) => {
            const IconComponent = industry.icon_name
              ? (Icons as any)[industry.icon_name] || Sparkles
              : Sparkles;
            const isSelected = selectedIndustry === industry.id;

            return (
              <Card
                key={industry.id}
                className={`group cursor-pointer transition-all duration-300 overflow-hidden w-[160px] h-[160px] shrink-0 ${isSelected
                  ? "border-primary bg-primary/10 glow"
                  : "border-border hover:border-primary glass hover:glow"
                  }`}
                onClick={() => setSelectedIndustry(industry.id)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <CardContent className="p-4 relative h-full flex flex-col items-center justify-center text-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 ${isSelected
                    ? "bg-primary"
                    : "bg-muted/40 group-hover:bg-primary group-hover:scale-110"
                    }`}>
                    <IconComponent className={`w-6 h-6 transition-colors ${isSelected
                      ? "text-primary-foreground"
                      : "text-muted-foreground/70 group-hover:text-primary-foreground"
                      }`} />
                  </div>
                  <div className="space-y-1">
                    <h3 className={`text-base font-heading font-bold transition-colors ${isSelected ? "text-primary" : "group-hover:text-primary"
                      }`}>
                      {industry.name}
                    </h3>
                    <p className="text-muted-foreground text-[12px] leading-tight px-1 line-clamp-2">
                      {industry.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters and Sorting */}
        <div className="mb-8 flex flex-wrap items-center justify-between">
          <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
            <span className="font-mono">{filteredAndSortedStartups.length}</span> {filteredAndSortedStartups.length === 1 ? 'startup' : 'startups'}
          </div>

          <div className="flex items-center gap-4">
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                <SelectItem value="change-asc">Change (Low to High)</SelectItem>
                <SelectItem value="change-desc">Change (High to Low)</SelectItem>
                <SelectItem value="marketcap-asc">Market Cap (Low to High)</SelectItem>
                <SelectItem value="marketcap-desc">Market Cap (High to Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredAndSortedStartups.map((startup) => {
            const isPositive = (startup.price_change_24h || 0) >= 0;

            return (
              <Card
                key={startup.id}
                className="group cursor-pointer border-border hover:border-primary transition-all duration-300 glass hover:glow"
                onClick={() => navigate(`/startup/${startup.slug}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-16 h-16 rounded-xl bg-background flex items-center justify-center p-2">
                        <img
                          src={startupLogos[startup.slug]}
                          alt={`${startup.name} logo`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-primary font-semibold">{getTicker(startup.slug)}</span>
                          <h3 className="text-xl font-heading font-bold group-hover:text-primary transition-colors">
                            {startup.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{startup.hq_location}</span>
                          <span>•</span>
                          <span>{startup.industries?.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {startup.market_cap && (
                        <div className="text-right w-32">
                          <div className="text-lg font-semibold font-mono">
                            {formatCompactUSD(startup.market_cap)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Market Cap
                          </div>
                        </div>
                      )}

                      {/* Sparkline */}
                      <div className="w-28 h-12">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={priceTrends[startup.perp_engine_address || ''] || []}
                          >
                            <defs>
                              <linearGradient id={`gradient-${startup.id}`} x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"} stopOpacity={0.6} />
                                <stop offset="100%" stopColor={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"} stopOpacity={1} />
                              </linearGradient>
                            </defs>
                            <Line
                              type="monotone"
                              dataKey="price"
                              stroke={`url(#gradient-${startup.id})`}
                              strokeWidth={2}
                              dot={false}
                              animationDuration={800}
                              animationEasing="ease-in-out"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="text-right w-28">
                        <div className="text-2xl font-bold font-mono">
                          {formatUSD(startup.current_price)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Current Price
                        </div>
                      </div>

                      <Badge
                        variant={isPositive ? "success" : "destructive"}
                        className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-base font-bold ${isPositive ? "text-success" : "text-destructive"}`}
                      >
                        {isPositive ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <TrendingDown className="w-5 h-5" />
                        )}
                        {isPositive ? "+" : ""}
                        {formatPercent(startup.price_change_24h || 0)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
