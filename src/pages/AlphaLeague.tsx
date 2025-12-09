import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        .select("*, industries(name)")
        .order("price_change_24h", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
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
      <div className="min-h-screen p-6 space-y-8" style={{ backgroundColor: "#050505" }}>
        {/* Status Banner */}
        <div className="rounded-xl p-4 flex items-center justify-between" style={{ 
          background: "linear-gradient(135deg, rgba(0,240,255,0.1) 0%, rgba(255,77,0,0.1) 100%)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <div className="flex items-center gap-4">
            <Clock className="w-5 h-5" style={{ color: "#00F0FF" }} />
            <div>
              <p className="text-sm text-gray-400">Weekly Cycle Ends in:</p>
              <p className="text-xl font-mono font-bold text-white">
                {String(countdown.days).padStart(2, '0')}d {String(countdown.hours).padStart(2, '0')}h {String(countdown.minutes).padStart(2, '0')}m {String(countdown.seconds).padStart(2, '0')}s
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-300">
              Holders of Top 3 startups receive <span style={{ color: "#00F0FF" }} className="font-bold">+15% APY Boost</span> in $VELTO rewards
            </p>
            <Button 
              onClick={() => navigate("/markets")}
              className="rounded-lg font-semibold"
              style={{ backgroundColor: "#00F0FF", color: "#050505" }}
            >
              Trade to Qualify <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>
            Alpha League
          </h1>
          <p className="text-gray-400 text-lg">Weekly startup competition for yield dominance</p>
        </div>

        {/* Hero Section: Live Race */}
        <Card className="border-0" style={{ 
          backgroundColor: "rgba(255,255,255,0.03)", 
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)"
        }}>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: "#00F0FF" }} />
              Live Race — Real-Time Rankings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {raceData.map((startup, index) => (
              <div 
                key={startup.id} 
                className="flex items-center gap-4 transition-all duration-700 ease-out"
                style={{ 
                  transform: `translateY(${index * 0}px)`,
                }}
              >
                <span className="text-2xl font-mono font-bold w-8" style={{ color: index === 0 ? "#00F0FF" : "#666" }}>
                  #{index + 1}
                </span>
                <div 
                  className="relative h-14 rounded-xl flex items-center gap-4 px-4 transition-all duration-700 ease-out"
                  style={{ 
                    width: `${startup.score}%`,
                    background: index === 0 
                      ? "linear-gradient(90deg, rgba(0,240,255,0.3) 0%, rgba(0,240,255,0.1) 100%)"
                      : "linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)",
                    border: index === 0 ? "1px solid rgba(0,240,255,0.4)" : "1px solid rgba(255,255,255,0.1)",
                    boxShadow: index === 0 ? "0 0 20px rgba(0,240,255,0.2)" : "none",
                    animation: "pulse 2s ease-in-out infinite"
                  }}
                >
                  <img 
                    src={getLogoUrl(startup.slug)} 
                    alt={startup.name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  <span className="font-mono font-bold text-white">{startup.ticker}</span>
                  <span className="text-gray-400 text-sm">{startup.name}</span>
                  <span className="ml-auto font-mono text-sm" style={{ color: "#00F0FF" }}>
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
          <Card className="border-0 relative overflow-hidden" style={{ 
            backgroundColor: "rgba(255,255,255,0.03)", 
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(34,197,94,0.2)"
          }}>
            <div className="absolute inset-0 opacity-20" style={{ 
              background: "radial-gradient(circle at 50% 0%, #22C55E 0%, transparent 70%)"
            }} />
            <CardHeader className="relative">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(34,197,94,0.2)" }}>
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <CardTitle className="text-gray-400 text-sm">Top Gainer</CardTitle>
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
                      <p className="font-mono font-bold text-white text-lg">{topGainer.ticker}</p>
                      <p className="text-gray-400 text-sm">{topGainer.name}</p>
                    </div>
                  </div>
                  <p className="text-4xl font-mono font-bold text-success">
                    +{topGainer.change.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">Price Performance</p>
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
                <div className="text-gray-500 text-center py-4">Loading...</div>
              )}
            </CardContent>
          </Card>

          {/* Most Liquid */}
          <Card className="border-0 relative overflow-hidden" style={{ 
            backgroundColor: "rgba(255,255,255,0.03)", 
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(59,130,246,0.2)"
          }}>
            <div className="absolute inset-0 opacity-20" style={{ 
              background: "radial-gradient(circle at 50% 0%, #3B82F6 0%, transparent 70%)"
            }} />
            <CardHeader className="relative">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(59,130,246,0.2)" }}>
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <CardTitle className="text-gray-400 text-sm">Most Liquid</CardTitle>
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
                      <p className="font-mono font-bold text-white text-lg">{mostLiquid.ticker}</p>
                      <p className="text-gray-400 text-sm">{mostLiquid.name}</p>
                    </div>
                  </div>
                  <p className="text-4xl font-mono font-bold text-blue-400">
                    ${mostLiquid.volume.toFixed(1)}M
                  </p>
                  <p className="text-xs text-gray-500">Trading Volume</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-0"
                    style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "#3B82F6" }}
                    onClick={() => navigate("/markets")}
                  >
                    Trade to Qualify
                  </Button>
                </>
              ) : (
                <div className="text-gray-500 text-center py-4">Loading...</div>
              )}
            </CardContent>
          </Card>

          {/* Highest AI Sentiment */}
          <Card className="border-0 relative overflow-hidden" style={{ 
            backgroundColor: "rgba(255,255,255,0.03)", 
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(168,85,247,0.2)"
          }}>
            <div className="absolute inset-0 opacity-20" style={{ 
              background: "radial-gradient(circle at 50% 0%, #A855F7 0%, transparent 70%)"
            }} />
            <CardHeader className="relative">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(168,85,247,0.2)" }}>
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <CardTitle className="text-gray-400 text-sm">Highest AI Sentiment</CardTitle>
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
                      <p className="font-mono font-bold text-white text-lg">{highestSentiment.ticker}</p>
                      <p className="text-gray-400 text-sm">{highestSentiment.name}</p>
                    </div>
                  </div>
                  <p className="text-4xl font-mono font-bold text-purple-400">
                    {highestSentiment.sentiment}/100
                  </p>
                  <p className="text-xs text-gray-500">Bullish Score</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-0"
                    style={{ backgroundColor: "rgba(168,85,247,0.1)", color: "#A855F7" }}
                    onClick={() => navigate("/markets")}
                  >
                    Trade to Qualify
                  </Button>
                </>
              ) : (
                <div className="text-gray-500 text-center py-4">Loading...</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Full Rankings Table */}
        <Card className="border-0" style={{ 
          backgroundColor: "rgba(255,255,255,0.03)", 
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)"
        }}>
          <CardHeader>
            <CardTitle className="text-white">Full Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/10 hover:bg-transparent">
                  <TableHead className="text-gray-400 font-mono">Rank</TableHead>
                  <TableHead className="text-gray-400">Asset Name</TableHead>
                  <TableHead className="text-gray-400 text-right font-mono">Current Price</TableHead>
                  <TableHead className="text-gray-400 text-right font-mono">7d Change</TableHead>
                  <TableHead className="text-gray-400 text-right font-mono">Sentiment</TableHead>
                  <TableHead className="text-gray-400 text-right font-mono">Est. Yield Boost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {startups?.map((startup, index) => {
                  const yieldBoost = index < 3 ? "+15%" : index < 5 ? "+8%" : index < 10 ? "+3%" : "—";
                  const yieldColor = index < 3 ? "#00F0FF" : index < 5 ? "#3B82F6" : index < 10 ? "#A855F7" : "#666";
                  const sentimentScore = Math.floor(60 + Math.random() * 35);
                  const priceChange = startup.price_change_24h || 0;
                  
                  return (
                    <TableRow 
                      key={startup.id} 
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group"
                      onClick={() => navigate(`/startup/${startup.slug}`)}
                    >
                      <TableCell className="font-mono font-bold" style={{ color: index < 3 ? "#00F0FF" : "#888" }}>
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
                            <p className="text-white font-medium group-hover:text-[#00F0FF] transition-colors">{startup.name}</p>
                            <p className="text-gray-500 text-xs">{startup.industries?.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-white">
                        ${startup.current_price.toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right font-mono ${priceChange >= 0 ? "text-success" : "text-destructive"}`}>
                        {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-gray-300">
                        {sentimentScore}/100
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold" style={{ color: yieldColor }}>
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
