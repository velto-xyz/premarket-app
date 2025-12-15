import { supabase } from '@/integrations/supabase/client'
import type { MarketMetadata, MarketContractInfo } from '@/types/models'

/**
 * Supabase Source
 *
 * Handles fetching market metadata and contract information from Supabase
 */
export class SupabaseSource {
  /**
   * Get market metadata (company info, logo, etc.)
   * Source: startups table
   */
  async getMarketMetadata(slug: string): Promise<MarketMetadata | null> {
    const { data, error } = await supabase
      .from('startups')
      .select(
        `
        id,
        name,
        slug,
        description,
        logo_url,
        industry_id,
        hq_location,
        hq_latitude,
        hq_longitude,
        unicorn_color,
        year_founded,
        founders
      `
      )
      .eq('slug', slug)
      .single()

    if (error || !data) {
      console.error('Error fetching market metadata:', error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description || '',
      logoUrl: data.logo_url || '',
      industryId: data.industry_id,
      hqLocation: data.hq_location || undefined,
      hqLatitude: data.hq_latitude || undefined,
      hqLongitude: data.hq_longitude || undefined,
      unicornColor: data.unicorn_color || undefined,
      yearFounded: data.year_founded || undefined,
      founders: data.founders || undefined
    }
  }

  /**
   * Get all markets metadata
   */
  async getAllMarketsMetadata(): Promise<MarketMetadata[]> {
    const { data, error } = await supabase
      .from('startups')
      .select(
        `
        id,
        name,
        slug,
        description,
        logo_url,
        industry_id,
        hq_location,
        hq_latitude,
        hq_longitude,
        unicorn_color,
        year_founded,
        founders
      `
      )
      .order('name')

    if (error || !data) {
      console.error('Error fetching all markets:', error)
      return []
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description || '',
      logoUrl: item.logo_url || '',
      industryId: item.industry_id,
      hqLocation: item.hq_location || undefined,
      hqLatitude: item.hq_latitude || undefined,
      hqLongitude: item.hq_longitude || undefined,
      unicornColor: item.unicorn_color || undefined,
      yearFounded: item.year_founded || undefined,
      founders: item.founders || undefined
    }))
  }

  /**
   * Get markets by industry
   */
  async getMarketsByIndustry(industrySlug: string): Promise<MarketMetadata[]> {
    // First get industry ID
    const { data: industry } = await supabase
      .from('industries')
      .select('id')
      .eq('slug', industrySlug)
      .single()

    if (!industry) {
      return []
    }

    const { data, error } = await supabase
      .from('startups')
      .select(
        `
        id,
        name,
        slug,
        description,
        logo_url,
        industry_id,
        hq_location,
        hq_latitude,
        hq_longitude,
        unicorn_color
      `
      )
      .eq('industry_id', industry.id)
      .order('name')

    if (error || !data) {
      console.error('Error fetching markets by industry:', error)
      return []
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description || '',
      logoUrl: item.logo_url || '',
      industryId: item.industry_id,
      hqLocation: item.hq_location || undefined,
      hqLatitude: item.hq_latitude || undefined,
      hqLongitude: item.hq_longitude || undefined,
      unicornColor: item.unicorn_color || undefined
    }))
  }

  /**
   * Get contract information for a market
   * Source: market_contracts table
   */
  async getMarketContractInfo(
    marketId: string
  ): Promise<MarketContractInfo | null> {
    const { data, error } = await supabase
      .from('market_contracts')
      .select(
        `
        startup_id,
        perp_engine_address,
        perp_market_address,
        position_manager_address,
        chain_id,
        deployment_block
      `
      )
      .eq('startup_id', marketId)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      // Market doesn't have contracts deployed yet
      return null
    }

    return {
      marketId: data.startup_id,
      contractAddress: data.perp_engine_address, // Using engine as main contract
      perpEngineAddress: data.perp_engine_address,
      perpMarketAddress: data.perp_market_address,
      positionManagerAddress: data.position_manager_address,
      chainId: data.chain_id,
      deploymentBlock: data.deployment_block
    }
  }

  /**
   * Get contract info by slug (convenience method)
   */
  async getMarketContractInfoBySlug(
    slug: string
  ): Promise<MarketContractInfo | null> {
    const metadata = await this.getMarketMetadata(slug)
    if (!metadata) {
      return null
    }

    return this.getMarketContractInfo(metadata.id)
  }

  /**
   * Get all markets with contract info using view
   */
  async getAllMarketsWithContracts() {
    const { data, error } = await supabase
      .from('markets_with_contracts')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching markets with contracts:', error)
      return []
    }

    return data || []
  }

  /**
   * Legacy: Get positions from old user_positions table
   * Used as fallback before indexer is ready
   */
  async getLegacyPositions(userAddress: string) {
    const { data, error } = await supabase
      .from('user_positions')
      .select('*')
      .eq('user_id', userAddress)

    if (error) {
      console.error('Error fetching legacy positions:', error)
      return []
    }

    return data || []
  }
}
