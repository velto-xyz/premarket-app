import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { storage } from "@/lib/storage";
import { StorageLayer } from "@/lib/storage/StorageLayer";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp as LucideTrendingUp, Filter, Sparkles, BarChart3, Brain, DollarSign, ChevronRight, PlayIcon,
  Search,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import * as Icons from "lucide-react";
import {
  ChartIncreaseIcon,
  AiImageIcon,
  MenuSquareIcon,
  ChartDecreaseIcon,
  Layout01Icon,
  ArrowRight02Icon,
  SparklesIcon,
  Activity01Icon,
  CpuIcon,
  ZapIcon,
  Factory02Icon,
  Globe02Icon,
  Leaf01Icon,
  Rocket01Icon,
  ServerStack02Icon,
  Database01Icon,
  BankIcon,
  SmartPhone01Icon,
  PaintBoardIcon,
  Building03Icon,
  Layers01Icon,
  Robot01Icon
} from "@/components/icons";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startupLogos } from "@/assets/logos";
import { getTicker } from "@/lib/tickers";
import { formatUSD, formatPercent, formatCompactUSD } from "@/lib/format";
import { useMarketDataStream } from "@/hooks/useMarketDataStream";
import { useSentiments } from "@/hooks/useSentiment";

// Map Lucide icon names (from DB) to HugeIcons
const hugeIconMapping: Record<string, any> = {
  "Activity": Activity01Icon,
  "Cpu": CpuIcon,
  "Zap": ZapIcon,
  "Factory": Factory02Icon,
  "Globe": Globe02Icon,
  "Leaf": Leaf01Icon,
  "Rocket": Rocket01Icon,
  "Server": ServerStack02Icon,
  "Database": Database01Icon,
  "Bank": BankIcon,
  "ShoppingBag": SmartPhone01Icon,
  // Add common fallbacks or others as needed
  "LayoutGradient": Layout01Icon,
  // Likely Lucide names for categories
  "Users": SmartPhone01Icon,
  "Palette": AiImageIcon,
  "Building": Building03Icon,
  "Building2": Building03Icon,
  "Layers": Layers01Icon,
  "Bot": Robot01Icon,
};

// Fallback mapping by Industry Name (most robust)
const categoryNameMapping: Record<string, any> = {
  "Consumer": SmartPhone01Icon,
  "Creative": AiImageIcon,
  "Enterprise": Building03Icon,
  "Foundation": Layers01Icon,
  "Robotics": Robot01Icon,
  "Infra": CpuIcon,
};

export default function Markets() {
  const navigate = useNavigate();
  const { industrySlug } = useParams();

  // --- UI State ---
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'market_cap', direction: 'desc' });

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // --- Data Fetching ---

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

  const getLogoUrl = (startup: any) => {
    if (startup.logo_url) return startup.logo_url;
    return startupLogos[startup.slug as keyof typeof startupLogos] || startupLogos["synapsehive-robotics"];
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

  // --- Filtering & Sorting Logic ---
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
    const { key, direction } = sortConfig;

    sorted.sort((a, b) => {
      let comparison = 0;
      switch (key) {
        case "current_price":
          comparison = Number(a.current_price) - Number(b.current_price);
          break;
        case "price_change_24h":
          comparison = Number(a.price_change_24h || 0) - Number(b.price_change_24h || 0);
          break;
        case "market_cap":
          comparison = Number(a.market_cap || 0) - Number(b.market_cap || 0);
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      return direction === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [startups, selectedIndustry, selectedRegion, sortConfig]);

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
    <AppLayout className="py-0">
      <div className="container mx-auto px-[3vw] py-[48px]">

        {/* === Header Section === */}
        <div className="mb-8">
          <h1 className="text-6xl font-heading font-bold mb-4 text-foreground">
            <span className="text-foreground">Trade AI Startups</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-[520px]">
            Don't just watch the news, trade it! Predict the next move for the top Ai startups before they hit the stock market.
          </p>
        </div>

        {/* === Analytics Overview Grid === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-12">
          {/* Column 1: Top Gainer */}
          <Card
            className="glass border-border relative overflow-hidden group h-full flex flex-col justify-between cursor-pointer transition-all duration-300 hover:bg-muted/80"
            onClick={() => topGainer && navigate(`/startup/${topGainer.slug}`)}
          >
            <CardHeader className="p-6 pb-2 relative">
              <CardTitle className="text-muted-foreground text-sm font-medium">Top Gainer</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 h-full flex flex-col justify-between relative">
              {topGainer ? (
                <>
                  <div className="flex items-start gap-4 mb-6">
                    <img
                      src={getLogoUrl(topGainer)}
                      alt={topGainer.name}
                      className="w-12 h-12 rounded-xl object-contain"
                    />
                    <div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="font-bold text-foreground text-lg">{topGainer.name}</h3>
                        <span className="text-muted-foreground font-mono text-sm">{getTicker(topGainer.slug)}</span>
                      </div>
                      {topGainer.industries?.name && (
                        <Badge variant="secondary" className="mt-1">
                          {topGainer.industries.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-auto">
                    <div>
                      <p className={`text-4xl font-mono font-bold ${topGainer.price_change_24h >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {topGainer.price_change_24h >= 0 ? '+' : ''}{formatPercent(topGainer.price_change_24h)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">24h Price Change</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-secondary-soft group-hover:bg-border h-11 w-11 shrink-0 [&_svg]:size-5 transition-colors duration-300"
                      onClick={() => navigate(`/startup/${topGainer.slug}`)}
                    >
                      <ArrowRight02Icon className="text-muted-foreground" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground text-center py-4">Scanning markets...</div>
              )}
            </CardContent>
          </Card>

          {/* Column 2: Most Liquid */}
          <Card
            className="glass border-border relative overflow-hidden group h-full flex flex-col justify-between cursor-pointer transition-all duration-300 hover:bg-muted/80"
            onClick={() => mostLiquid && navigate(`/startup/${mostLiquid.slug}`)}
          >
            <CardHeader className="p-6 pb-2 relative">
              <CardTitle className="text-muted-foreground text-sm font-medium">Most Traded</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 h-full flex flex-col justify-between relative">
              {mostLiquid ? (
                <>
                  <div className="flex items-start gap-4 mb-6">
                    <img
                      src={getLogoUrl(mostLiquid)}
                      alt={mostLiquid.name}
                      className="w-12 h-12 rounded-xl object-contain"
                    />
                    <div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="font-bold text-foreground text-lg">{mostLiquid.name}</h3>
                        <span className="text-muted-foreground font-mono text-sm">{getTicker(mostLiquid.slug)}</span>
                      </div>
                      {mostLiquid.industries?.name && (
                        <Badge variant="secondary" className="mt-1">
                          {mostLiquid.industries.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-auto">
                    <div>
                      <p className="text-4xl font-mono font-bold text-foreground">
                        {formatCompactUSD(mostLiquid.volume_24h)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">24h Volume</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-secondary-soft group-hover:bg-border h-11 w-11 shrink-0 [&_svg]:size-5 transition-colors duration-300"
                      onClick={() => navigate(`/startup/${mostLiquid.slug}`)}
                    >
                      <ArrowRight02Icon className="text-muted-foreground" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground text-center py-4">Scanning markets...</div>
              )}
            </CardContent>
          </Card>

          {/* Column 3: Market Stats Stacked */}
          <div className="flex flex-col gap-3">
            <Card className="glass border-border flex-1">
              <CardContent className="p-5 flex items-center h-full">
                <div className="flex items-center gap-4 w-full">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium pb-2">Total Market Cap</p>
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

                  <div>
                    <p className="text-sm text-muted-foreground font-medium pb-2">24H Volume</p>
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

        {/* === Category Filter Cards === */}
        <div className="flex overflow-x-auto pt-2 pb-4 gap-3 mb-8 -mx-4 px-4 scrollbar-hide snap-x">
          {/* All Categories Card */}
          <Card
            className={`group cursor-pointer transition-all duration-300 w-[140px] h-[140px] shrink-0 ${selectedIndustry === "all"
              ? "border-border ring-2 ring-foreground bg-muted"
              : "border-border hover:bg-muted glass"
              }`}
            onClick={() => setSelectedIndustry("all")}
          >
            <CardContent className="p-4 relative h-full flex flex-col items-center justify-center text-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-0 transition-all duration-300 bg-transparent group-hover:scale-110 ${selectedIndustry === "all" ? "scale-110" : ""}`}>
                <MenuSquareIcon
                  strokeWidth={1.5}
                  className={`w-7 h-7 transition-colors ${selectedIndustry === "all"
                    ? "text-foreground"
                    : "text-muted-foreground/70 group-hover:text-foreground"
                    }`}
                />
              </div>
              <div className="space-y-2">
                <h3 className={`text-[17px] font-heading transition-colors ${selectedIndustry === "all"
                  ? "text-foreground font-bold"
                  : "text-content-secondary font-medium group-hover:text-foreground"
                  }`}>
                  All Startups
                </h3>
              </div>
            </CardContent>
          </Card>

          {/* Industry Cards */}
          {industries?.map((industry) => {
            let IconComponent = SparklesIcon;

            // 1. Try mapping by icon_name (Lucide name from DB)
            if (industry.icon_name && hugeIconMapping[industry.icon_name]) {
              IconComponent = hugeIconMapping[industry.icon_name];
            }
            // 2. Try mapping by Industry Name (fallback)
            else if (categoryNameMapping[industry.name]) {
              IconComponent = categoryNameMapping[industry.name];
            }

            const isSelected = selectedIndustry === industry.id;

            return (
              <Card
                key={industry.id}
                className={`group cursor-pointer transition-all duration-300 w-[140px] h-[140px] shrink-0 ${isSelected
                  ? "border-border ring-2 ring-foreground bg-muted"
                  : "border-border hover:bg-muted glass"
                  }`}
                onClick={() => setSelectedIndustry(industry.id)}
              >
                <CardContent className="p-4 relative h-full flex flex-col items-center justify-center text-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-1 transition-all duration-300 bg-transparent group-hover:scale-110 ${isSelected ? "scale-110" : ""}`}>
                    <IconComponent
                      strokeWidth={1.5}
                      className={`w-7 h-7 transition-colors ${isSelected
                        ? "text-foreground"
                        : "text-muted-foreground/70 group-hover:text-foreground"
                        }`}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className={`text-[17px] font-heading transition-colors ${isSelected
                      ? "text-foreground font-bold"
                      : "text-content-secondary font-medium group-hover:text-foreground"
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

        {/* === Table Controls: Filters & Sorting === */}
        <div className="mb-8 flex flex-wrap items-center justify-between">
          <div className="text-base font-bold text-content-secondary">
            Trade {filteredAndSortedStartups.length} {filteredAndSortedStartups.length === 1 ? 'Startup' : 'Startups'}
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
          </div>
        </div>

        {/* === Table Section with Isolated Horizontal Scroll === */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="min-w-[1000px]">
            {/* === Table Headers === */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_100px] gap-6 px-6 pb-4 pt-5 mb-4 border-b border-border text-sm font-medium text-muted-foreground uppercase tracking-wider items-center sticky top-0 z-10 bg-background min-w-[1090px] whitespace-nowrap">
              <div
                className="cursor-pointer flex items-center gap-2 hover:text-foreground transition-colors"
                onClick={() => handleSort('name')}
              >
                Startup
                {sortConfig.key === 'name' && (
                  sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                )}
              </div>
              <div
                className="cursor-pointer flex items-center gap-2 hover:text-foreground transition-colors"
                onClick={() => handleSort('price_change_24h')}
              >
                Price Action
                {sortConfig.key === 'price_change_24h' && (
                  sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                )}
              </div>
              <div
                className="cursor-pointer flex items-center gap-2 hover:text-foreground transition-colors"
                onClick={() => handleSort('current_price')}
              >
                Current Price
                {sortConfig.key === 'current_price' && (
                  sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                )}
              </div>
              <div>Industry</div>
              <div
                className="cursor-pointer flex items-center gap-2 hover:text-foreground transition-colors"
                onClick={() => handleSort('market_cap')}
              >
                Market Cap
                {sortConfig.key === 'market_cap' && (
                  sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                )}
              </div>
              <div></div>
            </div>

            {/* === Main Startup List === */}
            <div className="space-y-1">
              {filteredAndSortedStartups.map((startup) => {
                const isPositive = (startup.price_change_24h || 0) >= 0;

                return (
                  <Card
                    key={startup.id}
                    className="group border-none shadow-none bg-transparent hover:bg-muted/100 transition-colors duration-200 rounded-xl cursor-pointer"
                    onClick={() => navigate(`/startup/${startup.slug}`)}
                  >
                    <CardContent className="p-4 px-6">
                      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_100px] gap-6 items-center min-w-[1060px]">

                        {/* Startup Info */}
                        <div className="flex items-center gap-4 w-full">
                          <div className="w-16 h-16 rounded-xl bg-background flex items-center justify-center p-2 shrink-0">
                            <img
                              src={getLogoUrl(startup)}
                              alt={`${startup.name} logo`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-lg font-heading font-bold text-foreground truncate">
                              {startup.name}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {startup.hq_location}
                            </p>
                          </div>
                        </div>

                        {/* Price Action */}
                        <div className="w-full">
                          <span className="md:hidden text-sm text-muted-foreground">24h Change</span>
                          <div className={`font-mono text-base font-bold ${isPositive ? "text-success" : "text-destructive"}`}>
                            {isPositive ? "+" : ""}{formatPercent(startup.price_change_24h || 0)}
                          </div>
                        </div>

                        {/* Current Price */}
                        <div className="w-full flex md:block justify-between md:justify-start">
                          <span className="md:hidden text-sm text-muted-foreground">Price</span>
                          <div className="text-base font-bold font-mono text-foreground">
                            {formatUSD(startup.current_price)}
                          </div>
                        </div>

                        {/* Industry */}
                        <div className="w-full flex md:block justify-between md:justify-start">
                          <span className="md:hidden text-sm text-muted-foreground">Industry</span>
                          <Badge variant="secondary">
                            {startup.industries?.name}
                          </Badge>
                        </div>

                        {/* Market Cap */}
                        <div className="w-full flex md:block justify-between md:justify-start">
                          <span className="md:hidden text-sm text-muted-foreground">Market Cap</span>
                          <div className="text-base font-semibold font-mono text-foreground">
                            {formatCompactUSD(startup.market_cap)}
                          </div>
                        </div>

                        {/* Trade Button */}
                        <div className="w-full flex justify-end p-1">
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-full px-6 text-[14px] !shadow-[0_0_0_5px_hsl(var(--primary)/0.2)]"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click
                              navigate(`/startup/${startup.slug}`);
                            }}
                          >
                            Trade
                          </Button>
                        </div>

                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
