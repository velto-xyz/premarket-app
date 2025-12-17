import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, BarChart3, Brain, Sparkles, Clock, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { startupLogos } from "@/assets/logos";
import { getTicker } from "@/lib/tickers";
import { storage } from "@/lib/storage";
import { useMarketDataStream } from "@/hooks/useMarketDataStream";
import { useSentiments } from "@/hooks/useSentiment";
import { formatUSD, formatPercent, formatCompactUSD } from "@/lib/format";

export default function AlphaLeague() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState({ days: 2, hours: 14, minutes: 30, seconds: 0 });

  // Fetch markets from storage layer (real data)
  const { data: markets = [] } = useQuery({
    queryKey: ["all-markets"],
    queryFn: async () => storage.getAllMarkets(),
  });

  // Stream real-time market data from contracts
  useMarketDataStream(markets);

  // Fetch industries for display
  const { data: industries } = useQuery({
    queryKey: ["industries"],
    queryFn: async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.from("industries").select("*").order("name");
      return data;
    },
  });

  // Transform markets to startup format
  const startups = useMemo(() => {
    return markets.map(m => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      current_price: m.currentPrice || 0,
      price_change_24h: m.priceChange24h || 0,
      market_cap: m.quoteReserve || 0,
      volume_24h: m.totalVolume || 0,
      industries: industries?.find(ind => ind.id === m.industryId),
    }));
  }, [markets, industries]);

  // Fetch sentiment scores from Wikipedia
  const { data: sentimentMap } = useSentiments(
    startups.map(s => ({ slug: s.slug, name: s.name }))
  );

  // Calculate ranking scores based on real metrics
  const rankedStartups = useMemo(() => {
    return startups
      .map(startup => {
        const sentiment = sentimentMap?.get(startup.slug);
        // Score = price change weight + volume weight + sentiment weight
        const priceScore = Math.min(40, Math.max(0, (startup.price_change_24h + 20) * 1)); // -20% to +20% -> 0-40
        const volumeScore = Math.min(30, Math.log10(Math.max(startup.volume_24h, 1)) * 5); // Log scale
        const sentimentScore = sentiment ? (sentiment.aggregateScore / 100) * 30 : 15; // 0-30
        const totalScore = Math.min(100, Math.max(0, priceScore + volumeScore + sentimentScore));

        return {
          ...startup,
          score: totalScore,
          sentiment: sentiment?.aggregateScore || 50,
          sentimentTrend: sentiment?.trend || 'stable',
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [startups, sentimentMap]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { days, hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; days--; }
        if (days < 0) { days = 6; hours = 23; minutes = 59; seconds = 59; }
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Race data derived from ranked startups (top 5)
  const raceData = useMemo(() => {
    return rankedStartups.slice(0, 5).map(startup => ({
      id: startup.id,
      ticker: getTicker(startup.slug),
      name: startup.name,
      slug: startup.slug,
      score: startup.score,
      change: startup.price_change_24h,
      volume: startup.volume_24h,
      marketCap: startup.market_cap,
      sentiment: startup.sentiment,
      sentimentTrend: startup.sentimentTrend,
      price: startup.current_price,
    }));
  }, [rankedStartups]);

  // Podium winners
  const topGainer = useMemo(() => {
    if (rankedStartups.length === 0) return null;
    return [...rankedStartups].sort((a, b) => b.price_change_24h - a.price_change_24h)[0];
  }, [rankedStartups]);

  const mostLiquid = useMemo(() => {
    if (rankedStartups.length === 0) return null;
    return [...rankedStartups].sort((a, b) => b.volume_24h - a.volume_24h)[0];
  }, [rankedStartups]);

  const highestSentiment = useMemo(() => {
    if (rankedStartups.length === 0) return null;
    return [...rankedStartups].sort((a, b) => b.sentiment - a.sentiment)[0];
  }, [rankedStartups]);

  const getLogoUrl = (slug: string) => {
    return startupLogos[slug as keyof typeof startupLogos] || startupLogos["synapsehive-robotics"];
  };

  return (
    <AppLayout>
      <div className="min-h-screen p-6 space-y-8 bg-background">
        {/* Status Banner */}
        <div className="rounded-xl p-4 flex items-center justify-between bg-gradient-to-r from-primary/10 to-destructive/10 border border-border">
          <div className="flex items-center gap-4">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Weekly Cycle Ends in:</p>
              <p className="text-xl font-mono font-bold text-foreground">
                {String(countdown.days).padStart(2, '0')}d {String(countdown.hours).padStart(2, '0')}h {String(countdown.minutes).padStart(2, '0')}m {String(countdown.seconds).padStart(2, '0')}s
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Holders of Top 3 startups receive <span className="text-primary font-bold">+15% APY Boost</span> in $VELTO rewards
            </p>
            <Button
              onClick={() => navigate("/markets")}
              className="rounded-lg font-semibold"
            >
              Trade to Qualify <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Alpha League
          </h1>
          <p className="text-muted-foreground text-lg">Weekly startup competition for yield dominance</p>
        </div>

        {/* Hero Section: Live Race */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Live Race — Real-Time Rankings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {raceData.map((startup, index) => (
              <div
                key={startup.id}
                className="flex items-center gap-4 transition-all duration-700 ease-out"
              >
                <span className={`text-2xl font-mono font-bold w-8 ${index === 0 ? "text-primary" : "text-muted-foreground"}`}>
                  #{index + 1}
                </span>
                <div
                  className={`relative h-14 rounded-xl flex items-center gap-4 px-4 transition-all duration-700 ease-out border ${
                    index === 0
                      ? "bg-primary/20 border-primary/40 shadow-[0_0_20px_hsl(var(--primary)/0.2)]"
                      : "bg-muted/30 border-border"
                  }`}
                  style={{ width: `${startup.score}%` }}
                >
                  <img
                    src={getLogoUrl(startup.slug)}
                    alt={startup.name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  <span className="font-mono font-bold text-foreground">{startup.ticker}</span>
                  <span className="text-muted-foreground text-sm">{startup.name}</span>
                  <span className="ml-auto font-mono text-sm text-primary">
                    Score: {startup.score.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* The Three Competition Categories (Podium) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top Gainer */}
          <Card className="glass border-success/20 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-gradient-to-b from-success to-transparent" />
            <CardHeader className="relative">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-success/20">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <CardTitle className="text-muted-foreground text-sm">Top Gainer</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-4">
              {topGainer ? (
                <>
                  <div className="flex items-center gap-3">
                    <img
                      src={getLogoUrl(topGainer.slug)}
                      alt={topGainer.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <p className="font-mono font-bold text-foreground text-lg">{getTicker(topGainer.slug)}</p>
                      <p className="text-muted-foreground text-sm">{topGainer.name}</p>
                    </div>
                  </div>
                  <p className={`text-4xl font-mono font-bold ${topGainer.price_change_24h >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {topGainer.price_change_24h >= 0 ? '+' : ''}{formatPercent(topGainer.price_change_24h)}
                  </p>
                  <p className="text-xs text-muted-foreground">24h Price Change</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-0 bg-success/10 text-success hover:bg-success/20"
                    onClick={() => navigate(`/startup/${topGainer.slug}`)}
                  >
                    Trade Now
                  </Button>
                </>
              ) : (
                <div className="text-muted-foreground text-center py-4">Loading...</div>
              )}
            </CardContent>
          </Card>

          {/* Most Liquid */}
          <Card className="glass border-blue-500/20 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-gradient-to-b from-blue-500 to-transparent" />
            <CardHeader className="relative">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                </div>
                <CardTitle className="text-muted-foreground text-sm">Most Liquid</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-4">
              {mostLiquid ? (
                <>
                  <div className="flex items-center gap-3">
                    <img
                      src={getLogoUrl(mostLiquid.slug)}
                      alt={mostLiquid.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <p className="font-mono font-bold text-foreground text-lg">{getTicker(mostLiquid.slug)}</p>
                      <p className="text-muted-foreground text-sm">{mostLiquid.name}</p>
                    </div>
                  </div>
                  <p className="text-4xl font-mono font-bold text-blue-500">
                    {formatCompactUSD(mostLiquid.volume_24h)}
                  </p>
                  <p className="text-xs text-muted-foreground">24h Volume</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-0 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                    onClick={() => navigate(`/startup/${mostLiquid.slug}`)}
                  >
                    Trade Now
                  </Button>
                </>
              ) : (
                <div className="text-muted-foreground text-center py-4">Loading...</div>
              )}
            </CardContent>
          </Card>

          {/* Highest AI Sentiment (Wikipedia Trending) */}
          <Card className="glass border-purple-500/20 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-gradient-to-b from-purple-500 to-transparent" />
            <CardHeader className="relative">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Brain className="w-5 h-5 text-purple-500" />
                </div>
                <CardTitle className="text-muted-foreground text-sm">Most Trending</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-4">
              {highestSentiment ? (
                <>
                  <div className="flex items-center gap-3">
                    <img
                      src={getLogoUrl(highestSentiment.slug)}
                      alt={highestSentiment.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <p className="font-mono font-bold text-foreground text-lg">{getTicker(highestSentiment.slug)}</p>
                      <p className="text-muted-foreground text-sm">{highestSentiment.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-4xl font-mono font-bold text-purple-500">
                      {highestSentiment.sentiment}
                    </p>
                    <span className={`text-sm px-2 py-0.5 rounded ${
                      highestSentiment.sentimentTrend === 'up' ? 'bg-success/20 text-success' :
                      highestSentiment.sentimentTrend === 'down' ? 'bg-destructive/20 text-destructive' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {highestSentiment.sentimentTrend === 'up' ? '↑ Rising' :
                       highestSentiment.sentimentTrend === 'down' ? '↓ Falling' : '→ Stable'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Wikipedia Interest Score</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-0 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
                    onClick={() => navigate(`/startup/${highestSentiment.slug}`)}
                  >
                    Trade Now
                  </Button>
                </>
              ) : (
                <div className="text-muted-foreground text-center py-4">Loading...</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Full Rankings Table */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Full Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-mono">Rank</TableHead>
                  <TableHead className="text-muted-foreground">Asset Name</TableHead>
                  <TableHead className="text-muted-foreground text-right font-mono">Price</TableHead>
                  <TableHead className="text-muted-foreground text-right font-mono">24h Change</TableHead>
                  <TableHead className="text-muted-foreground text-right font-mono">Trending</TableHead>
                  <TableHead className="text-muted-foreground text-right font-mono">Score</TableHead>
                  <TableHead className="text-muted-foreground text-right font-mono">Yield Boost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedStartups.map((startup, index) => {
                  const yieldBoost = index < 3 ? "+15%" : index < 5 ? "+8%" : index < 10 ? "+3%" : "—";

                  return (
                    <TableRow
                      key={startup.id}
                      className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors group"
                      onClick={() => navigate(`/startup/${startup.slug}`)}
                    >
                      <TableCell className={`font-mono font-bold ${index < 3 ? "text-primary" : "text-muted-foreground"}`}>
                        #{index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={getLogoUrl(startup.slug)}
                            alt={startup.name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                          <div>
                            <p className="text-foreground font-medium group-hover:text-primary transition-colors">{startup.name}</p>
                            <p className="text-muted-foreground text-xs">{startup.industries?.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-foreground tabular-nums">
                        {formatUSD(startup.current_price)}
                      </TableCell>
                      <TableCell className={`text-right font-mono tabular-nums ${startup.price_change_24h >= 0 ? "text-success" : "text-destructive"}`}>
                        {startup.price_change_24h >= 0 ? "+" : ""}{formatPercent(startup.price_change_24h)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        <span className={`inline-flex items-center gap-1 ${
                          startup.sentimentTrend === 'up' ? 'text-success' :
                          startup.sentimentTrend === 'down' ? 'text-destructive' : ''
                        }`}>
                          {startup.sentiment}
                          {startup.sentimentTrend === 'up' && '↑'}
                          {startup.sentimentTrend === 'down' && '↓'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-purple-500 tabular-nums">
                        {startup.score.toFixed(0)}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-bold ${
                        index < 3 ? "text-primary" : index < 5 ? "text-blue-500" : index < 10 ? "text-purple-500" : "text-muted-foreground"
                      }`}>
                        {yieldBoost}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
