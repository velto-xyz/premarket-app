import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, BarChart3, Brain, Sparkles, Clock, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { startupLogos } from "@/assets/logos";
import { getTicker } from "@/lib/tickers";

export default function AlphaLeague() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState({ days: 2, hours: 14, minutes: 30, seconds: 0 });
  const [scores, setScores] = useState<Record<string, number>>({});

  // Fetch startups for the full rankings table
  const { data: startups = [] } = useQuery({
    queryKey: ["startups-league"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startups")
        .select("id, name, slug, industries(name)")
        .order("name")
        .limit(20);
      if (error) throw error;
      // Add placeholder data - real prices/rankings come from contracts/views
      return data?.map(s => ({
        ...s,
        current_price: 100 + Math.random() * 50,
        price_change_24h: (Math.random() - 0.3) * 20,
        market_cap: 1000000 + Math.random() * 5000000
      })) || [];
    },
  });

  // Initialize and animate scores based on real startups
  useEffect(() => {
    if (startups.length > 0) {
      // Initialize scores based on price change and market cap
      const initialScores: Record<string, number> = {};
      startups.forEach((startup, index) => {
        const baseScore = 95 - (index * 3); // Higher ranked startups get higher base scores
        const priceBonus = (startup.price_change_24h || 0) * 2;
        initialScores[startup.id] = Math.min(100, Math.max(60, baseScore + priceBonus));
      });
      setScores(initialScores);
    }
  }, [startups]);

  // Animate the bar race
  useEffect(() => {
    if (startups.length === 0) return;

    const interval = setInterval(() => {
      setScores(prev => {
        const newScores = { ...prev };
        Object.keys(newScores).forEach(id => {
          newScores[id] = Math.max(60, Math.min(100, newScores[id] + (Math.random() - 0.5) * 3));
        });
        return newScores;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [startups]);

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

  // Race data derived from startups with animated scores
  const raceData = useMemo(() => {
    return startups
      .slice(0, 5)
      .map(startup => ({
        id: startup.id,
        ticker: getTicker(startup.slug),

        name: startup.name,
        slug: startup.slug,
        score: scores[startup.id] || 75,
        change: startup.price_change_24h || 0,
        volume: (startup.market_cap || 0) / 1000000, // Volume as market cap in millions
        sentiment: Math.floor(60 + Math.abs(startup.price_change_24h || 0) * 5 + Math.random() * 20),
        price: startup.current_price,
      }))
      .sort((a, b) => b.score - a.score);
  }, [startups, scores]);

  const topGainer = raceData[0] || null;
  const mostLiquid = raceData.length > 0 ? [...raceData].sort((a, b) => b.volume - a.volume)[0] : null;
  const highestSentiment = raceData.length > 0 ? [...raceData].sort((a, b) => b.sentiment - a.sentiment)[0] : null;

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
                      <p className="font-mono font-bold text-foreground text-lg">{topGainer.ticker}</p>
                      <p className="text-muted-foreground text-sm">{topGainer.name}</p>
                    </div>
                  </div>
                  <p className="text-4xl font-mono font-bold text-success">
                    +{topGainer.change.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Price Performance</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-0 bg-success/10 text-success hover:bg-success/20"
                    onClick={() => navigate("/markets")}
                  >
                    Trade to Qualify
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
                      <p className="font-mono font-bold text-foreground text-lg">{mostLiquid.ticker}</p>
                      <p className="text-muted-foreground text-sm">{mostLiquid.name}</p>
                    </div>
                  </div>
                  <p className="text-4xl font-mono font-bold text-blue-500">
                    ${mostLiquid.volume.toFixed(1)}M
                  </p>
                  <p className="text-xs text-muted-foreground">Trading Volume</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-0 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                    onClick={() => navigate("/markets")}
                  >
                    Trade to Qualify
                  </Button>
                </>
              ) : (
                <div className="text-muted-foreground text-center py-4">Loading...</div>
              )}
            </CardContent>
          </Card>

          {/* Highest AI Sentiment */}
          <Card className="glass border-purple-500/20 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-gradient-to-b from-purple-500 to-transparent" />
            <CardHeader className="relative">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Brain className="w-5 h-5 text-purple-500" />
                </div>
                <CardTitle className="text-muted-foreground text-sm">Highest AI Sentiment</CardTitle>
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
                      <p className="font-mono font-bold text-foreground text-lg">{highestSentiment.ticker}</p>
                      <p className="text-muted-foreground text-sm">{highestSentiment.name}</p>
                    </div>
                  </div>
                  <p className="text-4xl font-mono font-bold text-purple-500">
                    {highestSentiment.sentiment}/100
                  </p>
                  <p className="text-xs text-muted-foreground">Bullish Score</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-0 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
                    onClick={() => navigate("/markets")}
                  >
                    Trade to Qualify
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
                  <TableHead className="text-muted-foreground text-right font-mono">Current Price</TableHead>
                  <TableHead className="text-muted-foreground text-right font-mono">7d Change</TableHead>
                  <TableHead className="text-muted-foreground text-right font-mono">Sentiment</TableHead>
                  <TableHead className="text-muted-foreground text-right font-mono">Est. Yield Boost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {startups?.map((startup, index) => {
                  const yieldBoost = index < 3 ? "+15%" : index < 5 ? "+8%" : index < 10 ? "+3%" : "—";
                  const sentimentScore = Math.floor(60 + Math.random() * 35);
                  const priceChange = startup.price_change_24h || 0;

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
                            src={startupLogos[startup.slug as keyof typeof startupLogos] || startupLogos["synapsehive-robotics"]}
                            alt={startup.name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                          <div>
                            <p className="text-foreground font-medium group-hover:text-primary transition-colors">{startup.name}</p>
                            <p className="text-muted-foreground text-xs">{startup.industries?.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-foreground">
                        ${startup.current_price.toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right font-mono ${priceChange >= 0 ? "text-success" : "text-destructive"}`}>
                        {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {sentimentScore}/100
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
