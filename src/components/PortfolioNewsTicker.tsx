import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Radio, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface NewsItem {
  id: string;
  headline: string;
  source: string;
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  time: string;
  startupName: string;
  startupSlug: string;
}

// Startup-specific news mapping
const startupNewsData: Record<string, { headline: string; source: string; sentiment: "BULLISH" | "BEARISH" | "NEUTRAL"; time: string }[]> = {
  "aeropulse-mobility": [
    { headline: "AeroPulse secures FAA approval for urban air taxi trials in Miami", source: "Aviation Week", sentiment: "BULLISH", time: "15m ago" },
    { headline: "Competitor Lilium expands European operations, intensifying eVTOL race", source: "Reuters", sentiment: "NEUTRAL", time: "1h ago" },
  ],
  "nebuladrive-spaceworks": [
    { headline: "NebulaDrive's new ion propulsion system achieves record efficiency", source: "Space.com", sentiment: "BULLISH", time: "22m ago" },
    { headline: "SpaceX Starship success may impact small satellite launcher demand", source: "Bloomberg", sentiment: "BEARISH", time: "2h ago" },
  ],
  "quantumloop-finance": [
    { headline: "QuantumLoop deploys quantum-resistant encryption for major bank", source: "Financial Times", sentiment: "BULLISH", time: "18m ago" },
    { headline: "Federal Reserve explores quantum computing risks to financial systems", source: "WSJ", sentiment: "NEUTRAL", time: "1h ago" },
  ],
  "helixdrive-therapeutics": [
    { headline: "HelixDrive's cancer immunotherapy shows 78% response rate in trials", source: "The Lancet", sentiment: "BULLISH", time: "20m ago" },
    { headline: "HelixDrive receives FDA Breakthrough Therapy designation", source: "FDA", sentiment: "BULLISH", time: "3h ago" },
  ],
  "synapsehive-robotics": [
    { headline: "SynapseHive robots deployed in 500 Amazon warehouses globally", source: "TechCrunch", sentiment: "BULLISH", time: "25m ago" },
    { headline: "Labor unions push back against warehouse automation expansion", source: "WSJ", sentiment: "NEUTRAL", time: "2h ago" },
  ],
  "finorachain": [
    { headline: "FinoraChain processes $2B in cross-border payments this quarter", source: "CoinDesk", sentiment: "BULLISH", time: "28m ago" },
    { headline: "SEC signals stricter crypto regulations may be coming", source: "Bloomberg", sentiment: "BEARISH", time: "1h ago" },
  ],
};

const startupNames: Record<string, string> = {
  "aeropulse-mobility": "AeroPulse Mobility",
  "nebuladrive-spaceworks": "NebulaDrive Spaceworks",
  "quantumloop-finance": "QuantumLoop Finance",
  "helixdrive-therapeutics": "HelixDrive Therapeutics",
  "synapsehive-robotics": "SynapseHive Robotics",
  "finorachain": "FinoraChain",
};

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case "BULLISH":
      return <TrendingUp className="w-3 h-3" />;
    case "BEARISH":
      return <TrendingDown className="w-3 h-3" />;
    default:
      return <Minus className="w-3 h-3" />;
  }
};

const getSentimentStyles = (sentiment: string) => {
  switch (sentiment) {
    case "BULLISH":
      return "bg-success/20 text-success border-success/30";
    case "BEARISH":
      return "bg-destructive/20 text-destructive border-destructive/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

interface PortfolioNewsTickerProps {
  holdingSlugs: string[];
}

export default function PortfolioNewsTicker({ holdingSlugs }: PortfolioNewsTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Aggregate news from all held startups
  const aggregatedNews: NewsItem[] = holdingSlugs.flatMap((slug) => {
    const newsForStartup = startupNewsData[slug] || [];
    return newsForStartup.map((news, idx) => ({
      ...news,
      id: `${slug}-${idx}`,
      startupSlug: slug,
      startupName: startupNames[slug] || slug,
    }));
  });

  useEffect(() => {
    if (aggregatedNews.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % aggregatedNews.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [aggregatedNews.length]);

  if (aggregatedNews.length === 0) return null;

  const currentNews = aggregatedNews[currentIndex];

  return (
    <div className="w-full bg-card/80 backdrop-blur-sm border border-border rounded-lg">
      <div className="px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Live Indicator */}
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-destructive/10 border border-destructive/30 shrink-0">
            <Radio className="w-3 h-3 text-destructive animate-pulse" />
            <span className="text-xs font-mono font-bold text-destructive">LIVE</span>
          </div>

          {/* Startup Tag */}
          <Badge variant="secondary" className="shrink-0 text-xs font-mono bg-primary/10 text-primary border-primary/30">
            {currentNews.startupName}
          </Badge>

          {/* News Content */}
          <div className="flex-1 flex items-center gap-3 overflow-hidden">
            <Badge
              variant="outline"
              className={`shrink-0 text-xs font-mono flex items-center gap-1 ${getSentimentStyles(currentNews.sentiment)}`}
            >
              {getSentimentIcon(currentNews.sentiment)}
              {currentNews.sentiment}
            </Badge>

            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate animate-in slide-in-from-right-4 duration-500" key={currentNews.id}>
                {currentNews.headline}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
              <span className="font-medium">{currentNews.source}</span>
              <span>•</span>
              <span>{currentNews.time}</span>
            </div>
          </div>

          {/* News Dots */}
          <div className="flex items-center gap-1 shrink-0">
            {aggregatedNews.slice(0, 8).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? "bg-primary w-3" : "bg-muted-foreground/30"
                }`}
              />
            ))}
            {aggregatedNews.length > 8 && (
              <span className="text-xs text-muted-foreground ml-1">+{aggregatedNews.length - 8}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
