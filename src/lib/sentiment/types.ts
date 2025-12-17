/**
 * AI Sentiment Data Types
 *
 * Extensible system for aggregating sentiment from multiple sources
 * (Wikipedia pageviews, social media, news, etc.)
 */

export interface SourceScore {
  source: string;           // e.g., 'wikipedia', 'twitter', 'news'
  rawValue: number;         // Raw metric from source
  normalizedScore: number;  // 0-100 normalized score
  trend: 'up' | 'down' | 'stable';
  metadata?: Record<string, unknown>;
}

export interface SentimentScore {
  startupSlug: string;
  startupName: string;
  aggregateScore: number;   // 0-100 weighted average
  trend: 'up' | 'down' | 'stable';
  sources: SourceScore[];
  updatedAt: Date;
}

export interface ISentimentSource {
  readonly name: string;

  /**
   * Fetch sentiment score for a startup
   * Returns null if data unavailable (e.g., no Wikipedia article)
   */
  fetchScore(startupSlug: string, startupName: string): Promise<SourceScore | null>;
}

export interface SentimentConfig {
  cacheTtlMs: number;       // How long to cache results
  sources: {
    name: string;
    weight: number;         // Weight in aggregate (0-1)
    enabled: boolean;
  }[];
}
