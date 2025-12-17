/**
 * Sentiment Service
 *
 * Reads sentiment data from Supabase (populated by edge function).
 * Data is pre-aggregated from multiple sources:
 * - Wikipedia pageviews
 * - Google News
 * - Hacker News
 * - Reddit
 * - TechCrunch
 */

import { supabase } from '@/integrations/supabase/client';
import type { SentimentScore, SourceScore } from './types';

// Source weights for aggregation
const SOURCE_WEIGHTS: Record<string, number> = {
  'wikipedia': 1.0,
  'google-news': 0.9,
  'hackernews': 0.8,
  'reddit': 0.7,
  'techcrunch': 0.9,
};

interface DbSentimentRow {
  startup_slug: string;
  startup_name: string;
  source: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  raw_value: number;
  metadata: Record<string, unknown>;
  fetched_at: string;
}

interface DbEconomicRow {
  indicator_code: string;
  indicator_name: string;
  category: string;
  value: number;
  unit: string;
  change_1m: number | null;
  change_1y: number | null;
  trend: 'up' | 'down' | 'stable';
  observation_date: string;
  fetched_at: string;
}

export interface EconomicIndicator {
  code: string;
  name: string;
  category: string;
  value: number;
  unit: string;
  change1m: number | null;
  change1y: number | null;
  trend: 'up' | 'down' | 'stable';
  observationDate: string;
  fetchedAt: Date;
}

class SentimentService {
  /**
   * Get aggregated sentiment for a startup from Supabase
   */
  async getSentiment(startupSlug: string, startupName: string): Promise<SentimentScore> {
    const { data, error } = await supabase
      .from('sentiment_data')
      .select('*')
      .eq('startup_slug', startupSlug)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Failed to fetch sentiment:', error);
      return this.getDefaultSentiment(startupSlug, startupName);
    }

    if (!data || data.length === 0) {
      return this.getDefaultSentiment(startupSlug, startupName);
    }

    return this.aggregateScores(startupSlug, startupName, data as DbSentimentRow[]);
  }

  /**
   * Get sentiment for multiple startups
   */
  async getAllSentiments(
    startups: Array<{ slug: string; name: string }>
  ): Promise<Map<string, SentimentScore>> {
    const slugs = startups.map(s => s.slug);

    const { data, error } = await supabase
      .from('sentiment_data')
      .select('*')
      .in('startup_slug', slugs)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Failed to fetch sentiments:', error);
    }

    const results = new Map<string, SentimentScore>();
    const rows = (data as DbSentimentRow[]) || [];

    // Group by startup
    const byStartup = new Map<string, DbSentimentRow[]>();
    for (const row of rows) {
      const existing = byStartup.get(row.startup_slug) || [];
      existing.push(row);
      byStartup.set(row.startup_slug, existing);
    }

    // Aggregate for each startup
    for (const startup of startups) {
      const startupRows = byStartup.get(startup.slug);
      if (startupRows && startupRows.length > 0) {
        results.set(startup.slug, this.aggregateScores(startup.slug, startup.name, startupRows));
      } else {
        results.set(startup.slug, this.getDefaultSentiment(startup.slug, startup.name));
      }
    }

    return results;
  }

  /**
   * Get raw sentiment data per source for a startup
   */
  async getSentimentBreakdown(startupSlug: string): Promise<SourceScore[]> {
    const { data, error } = await supabase
      .from('sentiment_data')
      .select('*')
      .eq('startup_slug', startupSlug)
      .gt('expires_at', new Date().toISOString());

    if (error || !data) return [];

    return (data as DbSentimentRow[]).map(row => ({
      source: row.source,
      rawValue: row.raw_value,
      normalizedScore: row.score,
      trend: row.trend,
      metadata: row.metadata,
    }));
  }

  /**
   * Get economic indicators
   */
  async getEconomicIndicators(): Promise<EconomicIndicator[]> {
    const { data, error } = await supabase
      .from('economic_indicators')
      .select('*')
      .order('category');

    if (error || !data) return [];

    return (data as DbEconomicRow[]).map(row => ({
      code: row.indicator_code,
      name: row.indicator_name,
      category: row.category,
      value: row.value,
      unit: row.unit,
      change1m: row.change_1m,
      change1y: row.change_1y,
      trend: row.trend,
      observationDate: row.observation_date,
      fetchedAt: new Date(row.fetched_at),
    }));
  }

  /**
   * Get all sentiment data for AI Watcher dashboard
   */
  async getAllSentimentData(): Promise<{
    startups: Map<string, { sources: SourceScore[]; aggregate: SentimentScore }>;
    economic: EconomicIndicator[];
    lastUpdated: Date | null;
  }> {
    const [sentimentResult, economicResult] = await Promise.all([
      supabase
        .from('sentiment_data')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('startup_slug'),
      supabase
        .from('economic_indicators')
        .select('*')
        .order('category'),
    ]);

    const sentimentRows = (sentimentResult.data as DbSentimentRow[]) || [];
    const economicRows = (economicResult.data as DbEconomicRow[]) || [];

    // Group sentiment by startup
    const byStartup = new Map<string, DbSentimentRow[]>();
    let lastUpdated: Date | null = null;

    for (const row of sentimentRows) {
      const existing = byStartup.get(row.startup_slug) || [];
      existing.push(row);
      byStartup.set(row.startup_slug, existing);

      const fetchedAt = new Date(row.fetched_at);
      if (!lastUpdated || fetchedAt > lastUpdated) {
        lastUpdated = fetchedAt;
      }
    }

    // Build result
    const startups = new Map<string, { sources: SourceScore[]; aggregate: SentimentScore }>();

    for (const [slug, rows] of byStartup) {
      const name = rows[0]?.startup_name || slug;
      const sources: SourceScore[] = rows.map(row => ({
        source: row.source,
        rawValue: row.raw_value,
        normalizedScore: row.score,
        trend: row.trend,
        metadata: row.metadata,
      }));

      startups.set(slug, {
        sources,
        aggregate: this.aggregateScores(slug, name, rows),
      });
    }

    const economic: EconomicIndicator[] = economicRows.map(row => ({
      code: row.indicator_code,
      name: row.indicator_name,
      category: row.category,
      value: row.value,
      unit: row.unit,
      change1m: row.change_1m,
      change1y: row.change_1y,
      trend: row.trend,
      observationDate: row.observation_date,
      fetchedAt: new Date(row.fetched_at),
    }));

    return { startups, economic, lastUpdated };
  }

  private aggregateScores(slug: string, name: string, rows: DbSentimentRow[]): SentimentScore {
    const sourceScores: SourceScore[] = [];
    let totalWeight = 0;
    let weightedSum = 0;

    for (const row of rows) {
      const weight = SOURCE_WEIGHTS[row.source] || 0.5;
      sourceScores.push({
        source: row.source,
        rawValue: row.raw_value,
        normalizedScore: row.score,
        trend: row.trend,
        metadata: row.metadata,
      });
      weightedSum += row.score * weight;
      totalWeight += weight;
    }

    const aggregateScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;

    // Determine trend (majority wins)
    const trendCounts = { up: 0, down: 0, stable: 0 };
    for (const row of rows) {
      trendCounts[row.trend]++;
    }

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (trendCounts.up > trendCounts.down && trendCounts.up > trendCounts.stable) {
      trend = 'up';
    } else if (trendCounts.down > trendCounts.up && trendCounts.down > trendCounts.stable) {
      trend = 'down';
    }

    const latestFetch = rows.reduce((latest, row) => {
      const fetchedAt = new Date(row.fetched_at);
      return fetchedAt > latest ? fetchedAt : latest;
    }, new Date(0));

    return {
      startupSlug: slug,
      startupName: name,
      aggregateScore,
      trend,
      sources: sourceScores,
      updatedAt: latestFetch,
    };
  }

  private getDefaultSentiment(slug: string, name: string): SentimentScore {
    return {
      startupSlug: slug,
      startupName: name,
      aggregateScore: 50,
      trend: 'stable',
      sources: [],
      updatedAt: new Date(),
    };
  }
}

// Singleton instance
export const sentimentService = new SentimentService();
