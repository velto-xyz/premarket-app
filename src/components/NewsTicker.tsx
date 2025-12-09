import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Radio, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface NewsItem {
  id: number;
  headline: string;
  source: string;
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  time: string;
}

// Startup-specific news mapping
const startupNewsData: Record<string, NewsItem[]> = {
  "aeropulse-mobility": [
    { id: 1, headline: "AeroPulse secures FAA approval for urban air taxi trials in Miami", source: "Aviation Week", sentiment: "BULLISH", time: "15m ago" },
    { id: 2, headline: "Competitor Lilium expands European operations, intensifying eVTOL race", source: "Reuters", sentiment: "NEUTRAL", time: "1h ago" },
    { id: 3, headline: "AeroPulse announces $120M Series C led by Andreessen Horowitz", source: "TechCrunch", sentiment: "BULLISH", time: "3h ago" },
  ],
  "nebuladrive-spaceworks": [
    { id: 1, headline: "NebulaDrive's new ion propulsion system achieves record efficiency", source: "Space.com", sentiment: "BULLISH", time: "22m ago" },
    { id: 2, headline: "SpaceX Starship success may impact small satellite launcher demand", source: "Bloomberg", sentiment: "BEARISH", time: "2h ago" },
    { id: 3, headline: "NebulaDrive wins NASA contract for lunar cargo missions", source: "NASA", sentiment: "BULLISH", time: "4h ago" },
  ],
  "quantumloop-finance": [
    { id: 1, headline: "QuantumLoop deploys quantum-resistant encryption for major bank", source: "Financial Times", sentiment: "BULLISH", time: "18m ago" },
    { id: 2, headline: "Federal Reserve explores quantum computing risks to financial systems", source: "WSJ", sentiment: "NEUTRAL", time: "1h ago" },
    { id: 3, headline: "QuantumLoop partners with IBM for next-gen quantum infrastructure", source: "CNBC", sentiment: "BULLISH", time: "5h ago" },
  ],
  "geneweaver-labs": [
    { id: 1, headline: "GeneWeaver's CRISPR therapy enters Phase 3 trials for rare disease", source: "Nature Medicine", sentiment: "BULLISH", time: "30m ago" },
    { id: 2, headline: "FDA tightens gene therapy approval process, timeline concerns rise", source: "BioPharma Dive", sentiment: "BEARISH", time: "2h ago" },
    { id: 3, headline: "GeneWeaver acquires AI drug discovery startup for $85M", source: "FierceBiotech", sentiment: "BULLISH", time: "6h ago" },
  ],
  "voltfrost-vehicles": [
    { id: 1, headline: "VoltFrost unveils solid-state battery with 500-mile range", source: "Electrek", sentiment: "BULLISH", time: "12m ago" },
    { id: 2, headline: "Tesla announces price cuts on Model 3, EV competition intensifies", source: "Bloomberg", sentiment: "BEARISH", time: "1h ago" },
    { id: 3, headline: "VoltFrost opens first gigafactory in Texas, 2000 jobs created", source: "Reuters", sentiment: "BULLISH", time: "4h ago" },
  ],
  "synapsehive-robotics": [
    { id: 1, headline: "SynapseHive robots deployed in 500 Amazon warehouses globally", source: "TechCrunch", sentiment: "BULLISH", time: "25m ago" },
    { id: 2, headline: "Labor unions push back against warehouse automation expansion", source: "WSJ", sentiment: "NEUTRAL", time: "2h ago" },
    { id: 3, headline: "SynapseHive AI achieves 99.8% pick accuracy in stress tests", source: "IEEE Spectrum", sentiment: "BULLISH", time: "5h ago" },
  ],
  "helixdrive-therapeutics": [
    { id: 1, headline: "HelixDrive's cancer immunotherapy shows 78% response rate in trials", source: "The Lancet", sentiment: "BULLISH", time: "20m ago" },
    { id: 2, headline: "Big Pharma M&A activity heats up in biotech sector", source: "BioPharma Dive", sentiment: "BULLISH", time: "1h ago" },
    { id: 3, headline: "HelixDrive receives FDA Breakthrough Therapy designation", source: "FDA", sentiment: "BULLISH", time: "3h ago" },
  ],
  "drivemind-robotics": [
    { id: 1, headline: "DriveMind partners with Waymo for next-gen autonomous systems", source: "The Verge", sentiment: "BULLISH", time: "35m ago" },
    { id: 2, headline: "California tightens autonomous vehicle testing regulations", source: "Reuters", sentiment: "BEARISH", time: "2h ago" },
    { id: 3, headline: "DriveMind's Level 4 system passes 1 million miles without incident", source: "Ars Technica", sentiment: "BULLISH", time: "4h ago" },
  ],
  "finorachain": [
    { id: 1, headline: "FinoraChain processes $2B in cross-border payments this quarter", source: "CoinDesk", sentiment: "BULLISH", time: "28m ago" },
    { id: 2, headline: "SEC signals stricter crypto regulations may be coming", source: "Bloomberg", sentiment: "BEARISH", time: "1h ago" },
    { id: 3, headline: "FinoraChain partners with JPMorgan for institutional DeFi pilot", source: "Financial Times", sentiment: "BULLISH", time: "5h ago" },
  ],
  "orbitalnet-relay": [
    { id: 1, headline: "OrbitalNet launches 60 new satellites, constellation 80% complete", source: "SpaceNews", sentiment: "BULLISH", time: "40m ago" },
    { id: 2, headline: "Starlink price war impacts satellite internet sector margins", source: "Bloomberg", sentiment: "BEARISH", time: "2h ago" },
    { id: 3, headline: "OrbitalNet secures $400M government contract for rural connectivity", source: "Reuters", sentiment: "BULLISH", time: "6h ago" },
  ],
};

// Default news for startups without specific data
const defaultNews: NewsItem[] = [
  { id: 1, headline: "Pre-IPO market sees increased institutional interest in Q4", source: "Bloomberg", sentiment: "BULLISH", time: "30m ago" },
  { id: 2, headline: "Venture funding remains strong despite macroeconomic headwinds", source: "TechCrunch", sentiment: "NEUTRAL", time: "1h ago" },
  { id: 3, headline: "Private market valuations stabilize after 2024 correction", source: "PitchBook", sentiment: "BULLISH", time: "3h ago" },
];

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

interface NewsTickerProps {
  startupSlug: string;
  startupName: string;
}

export default function NewsTicker({ startupSlug, startupName }: NewsTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const newsItems = startupNewsData[startupSlug] || defaultNews;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % newsItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [newsItems.length]);

  const currentNews = newsItems[currentIndex];

  return (
    <div className="w-full bg-card/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center gap-4">
          {/* Live Indicator */}
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-destructive/10 border border-destructive/30 shrink-0">
            <Radio className="w-3 h-3 text-destructive animate-pulse" />
            <span className="text-xs font-mono font-bold text-destructive">LIVE</span>
          </div>

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
              <p className="text-sm font-medium truncate animate-in slide-in-from-right-4 duration-500">
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
            {newsItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? "bg-primary w-3" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
