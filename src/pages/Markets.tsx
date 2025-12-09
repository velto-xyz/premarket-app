import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Filter } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect, useCallback } from "react";
import { startupLogos } from "@/assets/logos";
import { getTicker } from "@/lib/tickers";

// Seeded random for consistent sparkline data per startup
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate sparkline data based on startup properties
const generateSparklineData = (startupId: string, basePrice: number, priceChange: number, tick: number) => {
  const seed = startupId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const trend = priceChange >= 0 ? 1 : -1;
  const volatility = Math.abs(priceChange) * 0.15;
  
  return Array.from({ length: 14 }, (_, i) => {
    const randomFactor = seededRandom(seed + i + tick * 0.1) * volatility;
    const trendFactor = (i / 13) * priceChange * 0.08;
    const price = basePrice * (1 - trendFactor * trend + (randomFactor - volatility / 2));
    return { day: i, price: Math.max(0.01, price) };
  });
};

export default function Markets() {
  const navigate = useNavigate();
  const { industrySlug } = useParams();
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sparklineTick, setSparklineTick] = useState(0);

  // Update sparklines every 3 seconds for dynamic effect
  useEffect(() => {
    const interval = setInterval(() => {
      setSparklineTick(prev => prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const { data: industries } = useQuery({
    queryKey: ["industries"],
    queryFn: async () => {
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

  const { data: startups, isLoading } = useQuery({
    queryKey: ["all-startups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startups")
        .select("*, industries(*)")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

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
          <h1 className="text-5xl font-heading font-bold mb-2 text-foreground">
            <span className="text-foreground">All</span> <span className="text-gradient">Markets</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Explore and trade pre-IPO tokenized stocks from private startups
          </p>
        </div>

        {/* Filters and Sorting */}
        <div className="mb-6 flex flex-wrap gap-4 items-center glass rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground">Filters & Sort:</span>
          </div>

          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries?.map((industry) => (
                <SelectItem key={industry.id} value={industry.id}>
                  {industry.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

          <div className="ml-auto text-sm text-muted-foreground">
            {filteredAndSortedStartups.length} {filteredAndSortedStartups.length === 1 ? 'startup' : 'startups'}
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
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            ${Number(startup.market_cap).toLocaleString()}
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
                            data={generateSparklineData(
                              startup.id, 
                              Number(startup.current_price), 
                              startup.price_change_24h || 0, 
                              sparklineTick
                            )}
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

                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          ${startup.current_price}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Current Price
                        </div>
                      </div>

                      <Badge
                        variant={isPositive ? "success" : "destructive"}
                        className="flex items-center gap-1 px-3 py-1"
                      >
                        {isPositive ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {isPositive ? "+" : ""}
                        {startup.price_change_24h}%
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
