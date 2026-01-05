import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, TrendingUp, TrendingDown, Activity, Radio, Clock, Database, Globe, Newspaper, MessageCircle, Wifi, AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Link } from "react-router-dom";
import { startupLogos } from "@/assets/logos";
import { getTicker } from "@/lib/tickers";
import { useAllSentimentData, useEconomicIndicators } from "@/hooks/useSentiment";
import type { SourceScore } from "@/lib/sentiment/types";
import type { EconomicIndicator } from "@/lib/sentiment";

// Source icons and labels
const SOURCE_CONFIG: Record<string, { icon: typeof Globe; label: string; color: string }> = {
  'wikipedia': { icon: Globe, label: 'Wikipedia', color: 'text-blue-500' },
  'google-news': { icon: Newspaper, label: 'Google News', color: 'text-red-500' },
  'hackernews': { icon: MessageCircle, label: 'Hacker News', color: 'text-orange-500' },
  'reddit': { icon: MessageCircle, label: 'Reddit', color: 'text-orange-600' },
  'techcrunch': { icon: Newspaper, label: 'TechCrunch', color: 'text-green-500' },
};

const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up': return <TrendingUp className="w-4 h-4 text-success" />;
    case 'down': return <TrendingDown className="w-4 h-4 text-destructive" />;
    default: return <Activity className="w-4 h-4 text-muted-foreground" />;
  }
};

const getScoreColor = (score: number) => {
  if (score >= 70) return 'text-success';
  if (score >= 40) return 'text-warning';
  return 'text-destructive';
};

interface NewsItem {
  headline: string;
  source: string;
  sourceType: string;
  startup: string;
  startupSlug: string;
  score?: number;
}

function extractNewsFromSentiment(
  sentimentData: Map<string, { sources: SourceScore[]; aggregate: any }> | undefined
): NewsItem[] {
  if (!sentimentData) return [];

  const news: NewsItem[] = [];

  for (const [slug, data] of sentimentData.entries()) {
    for (const source of data.sources) {
      const metadata = source.metadata as Record<string, unknown>;

      // Google News headlines
      if (source.source === 'google-news' && metadata?.recentHeadlines) {
        const headlines = metadata.recentHeadlines as string[];
        for (const headline of headlines.slice(0, 3)) {
          news.push({
            headline,
            source: 'Google News',
            sourceType: 'google-news',
            startup: data.aggregate.startupName,
            startupSlug: slug,
            score: source.normalizedScore,
          });
        }
      }

      // Hacker News stories
      if (source.source === 'hackernews' && metadata?.topStories) {
        const stories = metadata.topStories as { title: string; points: number }[];
        for (const story of stories.slice(0, 3)) {
          news.push({
            headline: story.title,
            source: `HN (${story.points} pts)`,
            sourceType: 'hackernews',
            startup: data.aggregate.startupName,
            startupSlug: slug,
            score: source.normalizedScore,
          });
        }
      }

      // TechCrunch articles
      if (source.source === 'techcrunch' && metadata?.articles) {
        const articles = metadata.articles as string[];
        for (const article of articles.slice(0, 2)) {
          news.push({
            headline: article,
            source: 'TechCrunch',
            sourceType: 'techcrunch',
            startup: data.aggregate.startupName,
            startupSlug: slug,
            score: source.normalizedScore,
          });
        }
      }

      // Reddit top posts
      if (source.source === 'reddit' && metadata?.topPosts) {
        const posts = metadata.topPosts as { title: string; score: number; subreddit: string }[];
        for (const post of posts.slice(0, 2)) {
          news.push({
            headline: post.title,
            source: `r/${post.subreddit}`,
            sourceType: 'reddit',
            startup: data.aggregate.startupName,
            startupSlug: slug,
            score: source.normalizedScore,
          });
        }
      }
    }
  }

  return news;
}

function SourceBreakdown({ sources }: { sources: SourceScore[] }) {
  if (sources.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">No data sources available</div>
    );
  }

  return (
    <div className="space-y-2">
      {sources.map((source) => {
        const config = SOURCE_CONFIG[source.source] || { icon: Database, label: source.source, color: 'text-muted-foreground' };
        const Icon = config.icon;

        return (
          <div key={source.source} className="flex items-center gap-2 text-xs">
            <Icon className={`w-3 h-3 ${config.color}`} />
            <span className="text-muted-foreground w-20 truncate">{config.label}</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${source.normalizedScore >= 50 ? 'bg-success' : 'bg-destructive'}`}
                style={{ width: `${source.normalizedScore}%` }}
              />
            </div>
            <span className={`font-mono w-8 text-right ${getScoreColor(source.normalizedScore)}`}>
              {source.normalizedScore}
            </span>
            {getTrendIcon(source.trend)}
          </div>
        );
      })}
    </div>
  );
}

function EconomicIndicatorsPanel({ indicators }: { indicators: EconomicIndicator[] }) {
  if (indicators.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No economic data available</p>
        <p className="text-xs">Set FRED_API_KEY and run sentiment-fetcher</p>
      </div>
    );
  }

  // Group by category
  const byCategory = indicators.reduce((acc, ind) => {
    if (!acc[ind.category]) acc[ind.category] = [];
    acc[ind.category].push(ind);
    return acc;
  }, {} as Record<string, EconomicIndicator[]>);

  return (
    <div className="space-y-4">
      {Object.entries(byCategory).map(([category, items]) => (
        <div key={category}>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {category.replace('_', ' ')}
          </h4>
          <div className="space-y-2">
            {items.map((ind) => (
              <div key={ind.code} className="flex items-center justify-between p-2 rounded bg-card border border-border">
                <div>
                  <div className="text-sm font-medium">{ind.name}</div>
                  <div className="text-xs text-muted-foreground">{ind.code}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold">{ind.value.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">{ind.unit}</span>
                    {getTrendIcon(ind.trend)}
                  </div>
                  {ind.change1m !== null && (
                    <div className={`text-xs ${ind.change1m >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {ind.change1m >= 0 ? '+' : ''}{ind.change1m.toFixed(2)}% (1m)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AIWatcher() {
  const { data: sentimentData, isLoading: sentimentLoading } = useAllSentimentData();
  const { data: economicIndicators = [] } = useEconomicIndicators();

  const newsItems = extractNewsFromSentiment(sentimentData?.startups);

  return (
    <AppLayout className="relative overflow-hidden">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold">AI Watcher</h1>
            <p className="text-muted-foreground">
              Real-time sentiment & market signals
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {sentimentData?.lastUpdated && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Updated {sentimentData.lastUpdated.toLocaleTimeString()}
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30">
              <Radio className="w-3 h-3 text-success animate-pulse" />
              <span className="text-xs font-medium text-success">LIVE</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 opacity-100 pointer-events-none select-none filter blur-[2px] transition-all duration-500">
          {/* Main Sentiment Grid */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Startup Sentiment Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sentimentLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wifi className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                    <p className="text-sm">Loading sentiment data...</p>
                  </div>
                ) : !sentimentData || sentimentData.startups.size === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No sentiment data available</p>
                    <p className="text-xs mt-1">Run the sentiment-fetcher edge function to populate data</p>
                    <div className="mt-4 p-3 rounded bg-muted/50 text-left max-w-md mx-auto">
                      <code className="text-xs">
                        curl -X POST 'http://localhost:54321/functions/v1/sentiment-fetcher'
                      </code>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from(sentimentData.startups.entries()).map(([slug, data]) => (
                      <Link
                        key={slug}
                        to={`/startup/${slug}`}
                        className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all group"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <img
                            src={startupLogos[slug]}
                            alt={data.aggregate.startupName}
                            className="w-10 h-10 rounded object-contain"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                              {data.aggregate.startupName}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {getTicker(slug)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold font-mono ${getScoreColor(data.aggregate.aggregateScore)}`}>
                              {data.aggregate.aggregateScore}
                            </div>
                            <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                              {getTrendIcon(data.aggregate.trend)}
                              <span>{data.aggregate.trend}</span>
                            </div>
                          </div>
                        </div>
                        <SourceBreakdown sources={data.sources} />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Economic Indicators */}
            <Card className="glass border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Economic Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EconomicIndicatorsPanel indicators={economicIndicators} />
              </CardContent>
            </Card>
          </div>

          {/* Signal Feed Sidebar */}
          <div className="space-y-6">
            <Card className="glass border-border h-[calc(100vh-16rem)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Signal Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-22rem)]">
                  <div className="px-4 pb-4 space-y-3">
                    {newsItems.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No signals yet</p>
                        <p className="text-xs">Headlines will appear after fetching sentiment</p>
                      </div>
                    ) : (
                      newsItems.map((item, idx) => {
                        const sourceConfig = SOURCE_CONFIG[item.sourceType] || { icon: Newspaper, color: 'text-muted-foreground' };
                        const Icon = sourceConfig.icon;

                        return (
                          <Link
                            key={`${item.startupSlug}-${idx}`}
                            to={`/startup/${item.startupSlug}`}
                            className="block p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-all group"
                          >
                            <div className="flex items-start gap-3">
                              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${sourceConfig.color}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                  {item.headline}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{item.source}</span>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <img
                                      src={startupLogos[item.startupSlug]}
                                      alt={item.startup}
                                      className="w-4 h-4 rounded object-contain"
                                    />
                                    <span>{item.startup}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Data Source Status */}
            <Card className="glass border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-primary" />
                  Data Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(SOURCE_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    const hasData = sentimentData?.startups &&
                      Array.from(sentimentData.startups.values()).some(s =>
                        s.sources.some(src => src.source === key)
                      );

                    return (
                      <div key={key} className="flex items-center gap-2 p-2 rounded bg-card border border-border">
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        <span className="text-sm flex-1">{config.label}</span>
                        <Badge variant="outline" className={hasData ? 'bg-success/20 text-success border-success/30' : 'bg-muted text-muted-foreground'}>
                          {hasData ? 'Active' : 'No Data'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/30 backdrop-blur-sm">
        <Card className="w-full max-w-md mx-4 shadow-none border-default bg-background/20 backdrop-blur-xl animate-in fade-in zoom-in duration-300">
          <CardHeader className="text-center pb-4 pt-10">
            <CardTitle className="text-3xl font-bold text-black dark:text-white">
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-12 px-7">
            <p className="text-muted-foreground text-md leading-relaxed">
              We're building an advanced AI engine to analyze market sentiment and deliver real-time trading signals.
            </p>

            <div className="mt-8 flex items-center justify-center gap-2">
              <Badge variant="secondary" className="px-4 py-1.5 bg-primary/30 text-black border-none font-medium text-sm rounded-[8px]">
                Sentiment Analysis
              </Badge>
              <Badge variant="secondary" className="px-4 py-1.5 bg-primary/30 text-black border-none font-medium text-sm rounded-[8px]">
                Live Signals
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
