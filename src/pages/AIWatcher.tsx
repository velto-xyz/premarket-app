import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, TrendingUp, TrendingDown, Activity, Radio, Clock, ExternalLink, Target, ChevronLeft, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, ReferenceDot } from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "react-router-dom";
import { startupLogos } from "@/assets/logos";
import { getTicker } from "@/lib/tickers";

// Mock AI news feed data
const aiNewsFeed = [
  {
    id: 1,
    headline: "OpenAI releases Sora v2 with extended generation capabilities",
    source: "TechCrunch",
    time: "12m ago",
    sentiment: "BULLISH",
    impact: ["nebuladrive-spaceworks", "synapsehive-robotics"],
  },
  {
    id: 2,
    headline: "Anthropic closes $750M Series D at $18.4B valuation",
    source: "Bloomberg",
    time: "34m ago",
    sentiment: "BULLISH",
    impact: ["quantumloop-finance", "finorachain"],
  },
  {
    id: 3,
    headline: "EU AI Act enforcement begins, compliance costs rise for startups",
    source: "Reuters",
    time: "1h ago",
    sentiment: "BEARISH",
    impact: ["drivemind-robotics", "autopilot-nexus"],
  },
  {
    id: 4,
    headline: "Google DeepMind announces breakthrough in protein folding speed",
    source: "Nature",
    time: "2h ago",
    sentiment: "BULLISH",
    impact: ["geneweaver-labs", "helixdrive-therapeutics"],
  },
  {
    id: 5,
    headline: "NVIDIA reports record Q4 data center revenue, AI chip demand surges",
    source: "CNBC",
    time: "3h ago",
    sentiment: "BULLISH",
    impact: ["orbicore-iot-systems", "glintmotion-iot"],
  },
  {
    id: 6,
    headline: "Autonomous vehicle regulations tighten in California",
    source: "WSJ",
    time: "4h ago",
    sentiment: "NEUTRAL",
    impact: ["voltfrost-vehicles", "evofleet-automotive", "aeropulse-mobility"],
  },
  {
    id: 7,
    headline: "SpaceX Starship completes orbital flight, opens commercial opportunities",
    source: "Space.com",
    time: "5h ago",
    sentiment: "BULLISH",
    impact: ["skyforge-aerospace", "orbitalnet-relay"],
  },
  {
    id: 8,
    headline: "Federal Reserve signals potential rate cuts in 2025",
    source: "Financial Times",
    time: "6h ago",
    sentiment: "BULLISH",
    impact: ["pulsebridge-fintech", "quantumloop-finance"],
  },
];

// Generate mock valuation curve data with sharp lines and event markers
const generateValuationData = (baseValuation: number, volatility: number = 0.02) => {
  const data = [];
  let currentValue = baseValuation;
  const now = new Date();
  
  // Map news events to chart positions
  const eventPositions = [5, 12, 20, 28, 35, 42]; // Positions where events occurred
  
  for (let i = 48; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 30 * 60 * 1000);
    const change = (Math.random() - 0.5) * 2 * volatility * currentValue;
    
    // Add spike for event positions
    const eventIndex = eventPositions.indexOf(48 - i);
    if (eventIndex !== -1) {
      const eventNews = aiNewsFeed[eventIndex];
      const spike = eventNews?.sentiment === "BULLISH" ? 0.02 : eventNews?.sentiment === "BEARISH" ? -0.015 : 0;
      currentValue = currentValue * (1 + spike);
    }
    
    currentValue = Math.max(currentValue + change, baseValuation * 0.8);
    
    data.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      valuation: Math.round(currentValue * 100) / 100,
      timestamp: time.getTime(),
      dataIndex: 48 - i,
    });
  }
  
  return data;
};

// Get chart events with positions - filtered by startup impact
const getChartEvents = (valuationData: any[], startupSlug: string | null) => {
  const eventPositions = [5, 12, 20, 28, 35, 42];
  
  // Filter events that impact the selected startup
  const relevantEvents = aiNewsFeed.filter(event => 
    !startupSlug || event.impact.includes(startupSlug)
  );
  
  return eventPositions.slice(0, relevantEvents.length).map((pos, index) => {
    const dataPoint = valuationData[pos];
    if (!dataPoint || !relevantEvents[index]) return null;
    return {
      ...relevantEvents[index],
      chartX: dataPoint.time,
      chartY: dataPoint.valuation,
      dataIndex: pos,
    };
  }).filter(Boolean);
};

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case "BULLISH":
      return "bg-success/20 text-success border-success/30";
    case "BEARISH":
      return "bg-destructive/20 text-destructive border-destructive/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

export default function AIWatcher() {
  const [selectedStartup, setSelectedStartup] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const itemsPerView = 6;

  const { data: startups = [] } = useQuery({
    queryKey: ["startups-watcher"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startups")
        .select("*, industries(*)")
        .order("market_cap", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const selectedStartupData = startups.find((s) => s.slug === selectedStartup) || startups[0];
  const valuationData = selectedStartupData
    ? generateValuationData(selectedStartupData.market_cap || 1000000, 0.015)
    : [];

  // Get chart events filtered by selected startup
  const chartEvents = getChartEvents(valuationData, selectedStartupData?.slug || null);

  // Calculate OTC anchor (simulated last verified trade)
  const otcAnchor = selectedStartupData
    ? {
        valuation: (selectedStartupData.market_cap || 1000000) * 0.97,
        timeAgo: "2h ago",
      }
    : null;

  return (
    <AppLayout>
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold">AI Watcher</h1>
            <p className="text-muted-foreground">
              Real-time AI intelligence & market signals
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30">
              <Radio className="w-3 h-3 text-success animate-pulse" />
              <span className="text-xs font-medium text-success">LIVE</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Startup Selector */}
            <Card className="glass border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Valuation Curve
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Startup Pills Carousel with Arrows */}
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
                    disabled={carouselIndex === 0}
                    className="p-2 rounded-lg border border-muted bg-card hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex-1 overflow-hidden">
                    <div 
                      className="flex gap-2 transition-transform duration-300"
                      style={{ transform: `translateX(-${carouselIndex * 112}px)` }}
                    >
                      {startups.map((startup) => (
                        <button
                          key={startup.id}
                          onClick={() => setSelectedStartup(startup.slug)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap min-w-[100px] shrink-0 ${
                            (selectedStartup || startups[0]?.slug) === startup.slug
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card hover:bg-muted border-muted"
                          }`}
                        >
                          <img
                            src={startupLogos[startup.slug]}
                            alt={startup.name}
                            className="w-5 h-5 rounded object-contain shrink-0"
                          />
                          <span className="text-sm font-mono font-medium">{getTicker(startup.slug)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setCarouselIndex(Math.min(startups.length - itemsPerView, carouselIndex + 1))}
                    disabled={carouselIndex >= startups.length - itemsPerView}
                    className="p-2 rounded-lg border border-muted bg-card hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Carousel Indicator */}
                <div className="flex justify-center gap-1 mb-4">
                  {Array.from({ length: Math.ceil(startups.length / itemsPerView) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCarouselIndex(i * itemsPerView)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        Math.floor(carouselIndex / itemsPerView) === i 
                          ? "bg-primary w-4" 
                          : "bg-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>

                {/* Chart */}
                <div className="h-[300px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={valuationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        dataKey="time"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                        domain={['dataMin - 50000', 'dataMax + 50000']}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, "Valuation"]}
                      />
                      {/* OTC Anchor Reference Line */}
                      {otcAnchor && (
                        <ReferenceLine
                          y={otcAnchor.valuation}
                          stroke="hsl(var(--warning))"
                          strokeDasharray="5 5"
                          strokeWidth={2}
                          label={{
                            value: "OTC Anchor",
                            position: "right",
                            fill: "hsl(var(--warning))",
                            fontSize: 10,
                          }}
                        />
                      )}
                      {/* Event Markers */}
                      {chartEvents.map((event: any) => (
                        <ReferenceDot
                          key={event.id}
                          x={event.chartX}
                          y={event.chartY}
                          r={8}
                          fill={event.sentiment === "BULLISH" ? "hsl(var(--success))" : event.sentiment === "BEARISH" ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))"}
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                          style={{ cursor: "pointer" }}
                          onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                        />
                      ))}
                      <Line
                        type="linear"
                        dataKey="valuation"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Selected Event Detail */}
                {selectedEvent && (
                  <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/30 animate-fade-in">
                    {(() => {
                      const event = chartEvents.find((e: any) => e.id === selectedEvent);
                      if (!event) return null;
                      return (
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${event.sentiment === "BULLISH" ? "bg-success/20" : event.sentiment === "BEARISH" ? "bg-destructive/20" : "bg-muted"}`}>
                            {event.sentiment === "BULLISH" ? (
                              <TrendingUp className="w-4 h-4 text-success" />
                            ) : event.sentiment === "BEARISH" ? (
                              <TrendingDown className="w-4 h-4 text-destructive" />
                            ) : (
                              <Activity className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={getSentimentColor(event.sentiment)}>
                                {event.sentiment}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{event.source} • {event.time}</span>
                            </div>
                            <p className="text-sm font-medium">{event.headline}</p>
                          </div>
                          <button 
                            onClick={() => setSelectedEvent(null)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* OTC Reality Check */}
                {otcAnchor && selectedStartupData && (
                  <div className="mt-4 p-4 rounded-lg bg-warning/10 border border-warning/30">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-warning" />
                      <div>
                        <div className="text-sm font-semibold text-warning">Reality Check</div>
                        <div className="text-xs text-muted-foreground">
                          Last OTC Settlement:{" "}
                          <span className="font-mono font-bold text-foreground">
                            ${(otcAnchor.valuation / 1000000).toFixed(2)}M Valuation
                          </span>{" "}
                          (Verified {otcAnchor.timeAgo})
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Movers */}
            <Card className="glass border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">AI-Impacted Movers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {startups.slice(0, 4).map((startup) => {
                    const isPositive = (startup.price_change_24h || 0) >= 0;
                    return (
                      <Link
                        key={startup.id}
                        to={`/startup/${startup.slug}`}
                        className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all group"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <img
                            src={startupLogos[startup.slug]}
                            alt={startup.name}
                            className="w-8 h-8 rounded object-contain"
                          />
                          <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                            {startup.name}
                          </span>
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-bold ${
                          isPositive ? "text-success" : "text-destructive"
                        }`}>
                          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {isPositive ? "+" : ""}{(startup.price_change_24h || 0).toFixed(2)}%
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Watcher Feed Sidebar */}
          <div className="space-y-6">
            <Card className="glass border-border h-[calc(100vh-16rem)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  AI Signal Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-22rem)]">
                  <div className="px-4 pb-4 space-y-3">
                    {aiNewsFeed.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className={`text-xs font-mono ${getSentimentColor(item.sentiment)}`}
                          >
                            [{item.sentiment}]
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {item.time}
                          </div>
                        </div>
                        <p className="text-sm font-medium mb-2 group-hover:text-primary transition-colors">
                          {item.headline}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{item.source}</span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {/* Impacted Startups */}
                        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
                          <span className="text-xs text-muted-foreground mr-1">Impact:</span>
                          <div className="flex -space-x-1">
                            {item.impact.slice(0, 3).map((slug) => (
                              <img
                                key={slug}
                                src={startupLogos[slug]}
                                alt={slug}
                                className="w-5 h-5 rounded-full border-2 border-background object-contain bg-card"
                              />
                            ))}
                            {item.impact.length > 3 && (
                              <div className="w-5 h-5 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                                <span className="text-[8px] font-bold">+{item.impact.length - 3}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
