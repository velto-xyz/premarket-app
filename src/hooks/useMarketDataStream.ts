import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { storage } from '@/lib/storage';
import type { Market } from '@/types/models';

/**
 * Streams real-time market data from contracts
 * Polls each market every 3s and updates the query cache
 */
export function useMarketDataStream(markets: Market[] | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!markets || markets.length === 0) return;

    const pollMarketData = async () => {
      // Poll all markets in parallel
      const updates = await Promise.allSettled(
        markets.map(async (market) => {
          const contractData = await storage.getMarketContractData(market.slug);
          return { slug: market.slug, ...contractData };
        })
      );

      // Update query cache with fresh data
      queryClient.setQueryData<Market[]>(['all-markets'], (oldData) => {
        if (!oldData) return oldData;

        return oldData.map((market) => {
          const update = updates.find(
            (u) => u.status === 'fulfilled' && u.value.slug === market.slug
          );

          if (update && update.status === 'fulfilled') {
            return {
              ...market,
              ...update.value,
            };
          }

          return market;
        });
      });
    };

    // Initial poll
    pollMarketData();

    // Poll every 3 seconds
    const interval = setInterval(pollMarketData, 3000);

    return () => clearInterval(interval);
  }, [markets, queryClient]);
}
