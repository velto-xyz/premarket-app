import { useQuery } from '@tanstack/react-query';
import { sentimentService, type SentimentScore, type EconomicIndicator } from '@/lib/sentiment';
import type { SourceScore } from '@/lib/sentiment/types';

interface StartupInfo {
  slug: string;
  name: string;
}

/**
 * Hook to fetch sentiment scores for multiple startups
 */
export function useSentiments(startups: StartupInfo[] | undefined) {
  return useQuery({
    queryKey: ['sentiments', startups?.map(s => s.slug).join(',')],
    queryFn: async () => {
      if (!startups || startups.length === 0) {
        return new Map<string, SentimentScore>();
      }
      return sentimentService.getAllSentiments(startups);
    },
    enabled: !!startups && startups.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
}

/**
 * Hook to fetch sentiment for a single startup
 */
export function useSentiment(startupSlug: string | undefined, startupName: string | undefined) {
  return useQuery({
    queryKey: ['sentiment', startupSlug],
    queryFn: async () => {
      if (!startupSlug || !startupName) return null;
      return sentimentService.getSentiment(startupSlug, startupName);
    },
    enabled: !!startupSlug && !!startupName,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch all sentiment data for the AI Watcher dashboard
 */
export function useAllSentimentData() {
  return useQuery({
    queryKey: ['all-sentiment-data'],
    queryFn: async () => {
      return sentimentService.getAllSentimentData();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch economic indicators
 */
export function useEconomicIndicators() {
  return useQuery<EconomicIndicator[]>({
    queryKey: ['economic-indicators'],
    queryFn: async () => {
      return sentimentService.getEconomicIndicators();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - economic data updates less frequently
    refetchInterval: 60 * 60 * 1000, // 1 hour
  });
}
