/**
 * Wikipedia Pageviews Sentiment Source
 *
 * Uses Wikimedia REST API to get pageview counts as a proxy for public interest.
 * Trending score = (recent 7d avg) / (previous 23d avg)
 *
 * API Docs: https://wikimedia.org/api/rest_v1/
 */

import type { ISentimentSource, SourceScore } from '../types';

// Map startup slugs to Wikipedia article titles
const WIKI_ARTICLES: Record<string, string> = {
  'spacex-perp': 'SpaceX',
  'stripe-perp': 'Stripe,_Inc.',
  'velto-perp': 'Velto', // May not exist
  // Add more mappings as needed
};

interface WikiPageviewResponse {
  items: Array<{
    project: string;
    article: string;
    granularity: string;
    timestamp: string;
    access: string;
    agent: string;
    views: number;
  }>;
}

export class WikipediaSource implements ISentimentSource {
  readonly name = 'wikipedia';

  private getArticleTitle(startupSlug: string, startupName: string): string {
    // Use mapping if available, otherwise try the startup name
    return WIKI_ARTICLES[startupSlug] || startupName.replace(/ /g, '_');
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }

  async fetchScore(startupSlug: string, startupName: string): Promise<SourceScore | null> {
    const article = this.getArticleTitle(startupSlug, startupName);

    // Get last 30 days of data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${encodeURIComponent(article)}/daily/${this.formatDate(startDate)}/${this.formatDate(endDate)}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        // Article doesn't exist or API error
        console.warn(`Wikipedia: No data for ${article} (${response.status})`);
        return null;
      }

      const data: WikiPageviewResponse = await response.json();

      if (!data.items || data.items.length === 0) {
        return null;
      }

      // Calculate metrics
      const views = data.items.map(item => item.views);
      const totalViews = views.reduce((sum, v) => sum + v, 0);
      const avgDailyViews = totalViews / views.length;

      // Split into recent (7d) and historical (23d before)
      const recent7d = views.slice(-7);
      const historical = views.slice(0, -7);

      const recent7dAvg = recent7d.reduce((sum, v) => sum + v, 0) / recent7d.length;
      const historicalAvg = historical.length > 0
        ? historical.reduce((sum, v) => sum + v, 0) / historical.length
        : recent7dAvg;

      // Trending ratio: >1 means increasing interest
      const trendRatio = historicalAvg > 0 ? recent7dAvg / historicalAvg : 1;

      // Determine trend direction
      let trend: 'up' | 'down' | 'stable';
      if (trendRatio > 1.1) {
        trend = 'up';
      } else if (trendRatio < 0.9) {
        trend = 'down';
      } else {
        trend = 'stable';
      }

      // Normalize to 0-100 score
      // Base score from absolute views (log scale for fairness)
      // SpaceX gets ~50k views/day, smaller startups might get 1k
      const logViews = Math.log10(Math.max(avgDailyViews, 1));
      const baseScore = Math.min(100, (logViews / 5) * 60); // 100k views = 60 base

      // Trend bonus: up to +/-20 based on trend ratio
      const trendBonus = Math.min(20, Math.max(-20, (trendRatio - 1) * 40));

      const normalizedScore = Math.min(100, Math.max(0, baseScore + trendBonus));

      return {
        source: this.name,
        rawValue: avgDailyViews,
        normalizedScore: Math.round(normalizedScore),
        trend,
        metadata: {
          articleTitle: article,
          totalViews30d: totalViews,
          avgDailyViews: Math.round(avgDailyViews),
          recent7dAvg: Math.round(recent7dAvg),
          historicalAvg: Math.round(historicalAvg),
          trendRatio: Number(trendRatio.toFixed(2)),
        },
      };
    } catch (error) {
      console.error(`Wikipedia: Failed to fetch for ${article}:`, error);
      return null;
    }
  }
}

// Singleton instance
export const wikipediaSource = new WikipediaSource();
