/**
 * Sentiment Fetcher Edge Function
 *
 * Fetches sentiment data from multiple external sources:
 * - Wikipedia Pageviews
 * - Google News RSS
 * - Hacker News API
 * - Reddit JSON
 * - TechCrunch RSS
 * - FRED Economic Indicators
 *
 * Run on schedule (every 15-30 minutes) or manually trigger
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const FRED_API_KEY = Deno.env.get('FRED_API_KEY') || ''

// Startup configurations
interface StartupConfig {
  slug: string
  name: string
  wikiArticle: string
  searchQuery: string
  subreddits: string[]
}

const STARTUPS: StartupConfig[] = [
  {
    slug: 'spacex-perp',
    name: 'SpaceX',
    wikiArticle: 'SpaceX',
    searchQuery: 'SpaceX',
    subreddits: ['spacex', 'space', 'investing'],
  },
  {
    slug: 'stripe-perp',
    name: 'Stripe',
    wikiArticle: 'Stripe,_Inc.',
    searchQuery: 'Stripe payments fintech',
    subreddits: ['fintech', 'startups', 'programming'],
  },
  {
    slug: 'velto-perp',
    name: 'Velto',
    wikiArticle: 'Velto',
    searchQuery: 'Velto crypto',
    subreddits: ['cryptocurrency', 'defi'],
  },
]

// Economic indicators to track
const FRED_INDICATORS = [
  { code: 'DFF', name: 'Federal Funds Rate', category: 'interest_rate', unit: 'percent' },
  { code: 'CPIAUCSL', name: 'Consumer Price Index', category: 'inflation', unit: 'index' },
  { code: 'UNRATE', name: 'Unemployment Rate', category: 'employment', unit: 'percent' },
  { code: 'VIXCLS', name: 'VIX Volatility Index', category: 'market', unit: 'index' },
]

// ============================================================================
// SOURCE FETCHERS
// ============================================================================

interface SourceResult {
  score: number
  trend: 'up' | 'down' | 'stable'
  rawValue: number
  metadata: Record<string, unknown>
}

// Wikipedia Pageviews
async function fetchWikipedia(config: StartupConfig): Promise<SourceResult | null> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  const formatDate = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '')
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${encodeURIComponent(config.wikiArticle)}/daily/${formatDate(startDate)}/${formatDate(endDate)}`

  try {
    const res = await fetch(url)
    if (!res.ok) return null

    const data = await res.json()
    const items = data.items || []
    if (items.length === 0) return null

    const views = items.map((i: { views: number }) => i.views)
    const totalViews = views.reduce((sum: number, v: number) => sum + v, 0)
    const avgDaily = totalViews / views.length

    // Trend: compare last 7d to previous
    const recent7d = views.slice(-7)
    const historical = views.slice(0, -7)
    const recent7dAvg = recent7d.reduce((s: number, v: number) => s + v, 0) / recent7d.length
    const historicalAvg = historical.length > 0
      ? historical.reduce((s: number, v: number) => s + v, 0) / historical.length
      : recent7dAvg

    const trendRatio = historicalAvg > 0 ? recent7dAvg / historicalAvg : 1
    const trend = trendRatio > 1.1 ? 'up' : trendRatio < 0.9 ? 'down' : 'stable'

    // Normalize score (log scale)
    const logViews = Math.log10(Math.max(avgDaily, 1))
    const baseScore = Math.min(100, (logViews / 5) * 60)
    const trendBonus = Math.min(20, Math.max(-20, (trendRatio - 1) * 40))
    const score = Math.min(100, Math.max(0, baseScore + trendBonus))

    return {
      score: Math.round(score),
      trend,
      rawValue: avgDaily,
      metadata: {
        totalViews30d: totalViews,
        avgDailyViews: Math.round(avgDaily),
        recent7dAvg: Math.round(recent7dAvg),
        trendRatio: Number(trendRatio.toFixed(2)),
      },
    }
  } catch (err) {
    console.error(`Wikipedia fetch failed for ${config.name}:`, err)
    return null
  }
}

// Google News RSS
async function fetchGoogleNews(config: StartupConfig): Promise<SourceResult | null> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(config.searchQuery)}&hl=en-US&gl=US&ceid=US:en`

  try {
    const res = await fetch(url)
    if (!res.ok) return null

    const xml = await res.text()

    // Parse RSS items
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
    const items = itemMatches.map(itemXml => {
      const title = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() || ''
      const pubDateStr = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || ''
      return { title, pubDate: new Date(pubDateStr) }
    }).filter(i => i.title)

    if (items.length === 0) return null

    // Filter to last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentItems = items.filter(i => i.pubDate >= weekAgo)
    const headlines = recentItems.map(i => i.title)

    // Simple sentiment analysis
    const positiveWords = ['surge', 'soar', 'gain', 'rise', 'growth', 'success', 'launch', 'breakthrough', 'record', 'profit', 'expand', 'win', 'milestone', 'innovation', 'funding', 'raise', 'partnership']
    const negativeWords = ['fall', 'drop', 'crash', 'fail', 'loss', 'cut', 'layoff', 'lawsuit', 'investigation', 'concern', 'risk', 'delay', 'struggle', 'decline', 'trouble', 'crisis']

    let positive = 0, negative = 0, neutral = 0
    for (const headline of headlines) {
      const lower = headline.toLowerCase()
      const hasPositive = positiveWords.some(w => lower.includes(w))
      const hasNegative = negativeWords.some(w => lower.includes(w))
      if (hasPositive && !hasNegative) positive++
      else if (hasNegative && !hasPositive) negative++
      else neutral++
    }

    const volumeScore = Math.min(50, Math.log10(Math.max(recentItems.length, 1) + 1) * 25)
    const sentimentTotal = positive + negative + neutral
    const sentimentRatio = sentimentTotal > 0 ? (positive - negative) / sentimentTotal : 0
    const sentimentScore = 25 + (sentimentRatio * 25)
    const score = Math.min(100, Math.max(0, volumeScore + sentimentScore))

    const trend = positive > negative * 1.5 ? 'up' : negative > positive * 1.5 ? 'down' : 'stable'

    return {
      score: Math.round(score),
      trend,
      rawValue: recentItems.length,
      metadata: {
        totalArticles: items.length,
        recentArticles: recentItems.length,
        sentiment: { positive, negative, neutral },
        recentHeadlines: headlines.slice(0, 5),
      },
    }
  } catch (err) {
    console.error(`Google News fetch failed for ${config.name}:`, err)
    return null
  }
}

// Hacker News (via Algolia API)
async function fetchHackerNews(config: StartupConfig): Promise<SourceResult | null> {
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(config.name)}&tags=story&hitsPerPage=100`

  try {
    const res = await fetch(url)
    if (!res.ok) return null

    const data = await res.json()
    const hits = data.hits || []

    if (hits.length === 0) return null

    // Filter to last 30 days
    const monthAgo = Date.now() / 1000 - 30 * 24 * 60 * 60
    const recentHits = hits.filter((h: { created_at_i: number }) => h.created_at_i >= monthAgo)

    // Calculate engagement
    const totalPoints = recentHits.reduce((sum: number, h: { points: number }) => sum + (h.points || 0), 0)
    const totalComments = recentHits.reduce((sum: number, h: { num_comments: number }) => sum + (h.num_comments || 0), 0)
    const avgPoints = recentHits.length > 0 ? totalPoints / recentHits.length : 0

    // Score based on volume and engagement
    const volumeScore = Math.min(40, Math.log10(Math.max(recentHits.length, 1) + 1) * 20)
    const engagementScore = Math.min(40, Math.log10(Math.max(avgPoints, 1) + 1) * 15)
    const commentScore = Math.min(20, Math.log10(Math.max(totalComments, 1) + 1) * 10)
    const score = Math.min(100, Math.max(0, volumeScore + engagementScore + commentScore))

    // Trend based on points distribution
    const recent7d = recentHits.filter((h: { created_at_i: number }) => h.created_at_i >= Date.now() / 1000 - 7 * 24 * 60 * 60)
    const older = recentHits.filter((h: { created_at_i: number }) => h.created_at_i < Date.now() / 1000 - 7 * 24 * 60 * 60)
    const recentAvg = recent7d.length > 0 ? recent7d.reduce((s: number, h: { points: number }) => s + h.points, 0) / recent7d.length : 0
    const olderAvg = older.length > 0 ? older.reduce((s: number, h: { points: number }) => s + h.points, 0) / older.length : recentAvg
    const trend = recentAvg > olderAvg * 1.2 ? 'up' : recentAvg < olderAvg * 0.8 ? 'down' : 'stable'

    return {
      score: Math.round(score),
      trend,
      rawValue: recentHits.length,
      metadata: {
        totalStories: recentHits.length,
        totalPoints,
        totalComments,
        avgPoints: Math.round(avgPoints),
        topStories: recentHits.slice(0, 5).map((h: { title: string; points: number }) => ({ title: h.title, points: h.points })),
      },
    }
  } catch (err) {
    console.error(`HackerNews fetch failed for ${config.name}:`, err)
    return null
  }
}

// Reddit (JSON API)
async function fetchReddit(config: StartupConfig): Promise<SourceResult | null> {
  try {
    let totalPosts = 0
    let totalScore = 0
    let totalComments = 0
    const allPosts: { title: string; score: number; subreddit: string }[] = []

    for (const subreddit of config.subreddits) {
      const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(config.name)}&restrict_sr=1&sort=new&limit=25`

      const res = await fetch(url, {
        headers: { 'User-Agent': 'VeltoSentimentBot/1.0' }
      })

      if (!res.ok) continue

      const data = await res.json()
      const posts = data.data?.children || []

      for (const post of posts) {
        const d = post.data
        const age = Date.now() / 1000 - d.created_utc
        if (age > 30 * 24 * 60 * 60) continue // Skip older than 30 days

        totalPosts++
        totalScore += d.score || 0
        totalComments += d.num_comments || 0
        allPosts.push({ title: d.title, score: d.score, subreddit })
      }
    }

    if (totalPosts === 0) return null

    const avgScore = totalScore / totalPosts
    const volumeScore = Math.min(40, Math.log10(Math.max(totalPosts, 1) + 1) * 20)
    const engagementScore = Math.min(40, Math.log10(Math.max(avgScore, 1) + 1) * 15)
    const commentScore = Math.min(20, Math.log10(Math.max(totalComments, 1) + 1) * 10)
    const score = Math.min(100, Math.max(0, volumeScore + engagementScore + commentScore))

    // Simple trend (can't easily determine without historical data)
    const trend = avgScore > 50 ? 'up' : avgScore < 10 ? 'down' : 'stable'

    return {
      score: Math.round(score),
      trend,
      rawValue: totalPosts,
      metadata: {
        totalPosts,
        totalScore,
        totalComments,
        avgScore: Math.round(avgScore),
        subreddits: config.subreddits,
        topPosts: allPosts.sort((a, b) => b.score - a.score).slice(0, 5),
      },
    }
  } catch (err) {
    console.error(`Reddit fetch failed for ${config.name}:`, err)
    return null
  }
}

// TechCrunch RSS
async function fetchTechCrunch(config: StartupConfig): Promise<SourceResult | null> {
  const url = `https://techcrunch.com/feed/`

  try {
    const res = await fetch(url)
    if (!res.ok) return null

    const xml = await res.text()

    // Parse RSS and filter for startup mentions
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
    const searchTerms = config.name.toLowerCase().split(' ')

    const relevantItems = itemMatches.filter(itemXml => {
      const title = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.toLowerCase() || ''
      const desc = itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.toLowerCase() || ''
      return searchTerms.some(term => title.includes(term) || desc.includes(term))
    }).map(itemXml => {
      const title = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() || ''
      const pubDateStr = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || ''
      return { title, pubDate: new Date(pubDateStr) }
    })

    // TechCrunch coverage is relatively rare, so any mention is significant
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentItems = relevantItems.filter(i => i.pubDate >= weekAgo)

    // Score heavily weighted by presence
    const score = Math.min(100, recentItems.length * 30 + relevantItems.length * 10)
    const trend = recentItems.length > 0 ? 'up' : 'stable'

    return {
      score: Math.round(score),
      trend,
      rawValue: relevantItems.length,
      metadata: {
        totalMentions: relevantItems.length,
        recentMentions: recentItems.length,
        articles: relevantItems.slice(0, 5).map(i => i.title),
      },
    }
  } catch (err) {
    console.error(`TechCrunch fetch failed for ${config.name}:`, err)
    return null
  }
}

// FRED Economic Indicators
async function fetchFredIndicator(indicator: typeof FRED_INDICATORS[0]): Promise<{
  value: number
  change1m: number | null
  change1y: number | null
  trend: 'up' | 'down' | 'stable'
  observationDate: string
} | null> {
  if (!FRED_API_KEY) {
    console.warn('FRED_API_KEY not set, skipping economic indicators')
    return null
  }

  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${indicator.code}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=365`

  try {
    const res = await fetch(url)
    if (!res.ok) return null

    const data = await res.json()
    const observations = data.observations || []

    if (observations.length === 0) return null

    // Get latest value
    const latest = observations[0]
    const latestValue = parseFloat(latest.value)
    if (isNaN(latestValue)) return null

    // Get 1 month ago and 1 year ago values
    const monthAgo = observations.find((o: { date: string }) => {
      const diff = Date.now() - new Date(o.date).getTime()
      return diff >= 25 * 24 * 60 * 60 * 1000 && diff <= 35 * 24 * 60 * 60 * 1000
    })
    const yearAgo = observations.find((o: { date: string }) => {
      const diff = Date.now() - new Date(o.date).getTime()
      return diff >= 360 * 24 * 60 * 60 * 1000 && diff <= 370 * 24 * 60 * 60 * 1000
    })

    const monthAgoValue = monthAgo ? parseFloat(monthAgo.value) : null
    const yearAgoValue = yearAgo ? parseFloat(yearAgo.value) : null

    const change1m = monthAgoValue ? latestValue - monthAgoValue : null
    const change1y = yearAgoValue ? latestValue - yearAgoValue : null

    // Determine trend
    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (change1m !== null) {
      if (change1m > 0.1) trend = 'up'
      else if (change1m < -0.1) trend = 'down'
    }

    return {
      value: latestValue,
      change1m,
      change1y,
      trend,
      observationDate: latest.date,
    }
  } catch (err) {
    console.error(`FRED fetch failed for ${indicator.code}:`, err)
    return null
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  const startTime = Date.now()

  try {
    console.log('Starting sentiment fetch...')

    const results: {
      startups: Record<string, Record<string, SourceResult | null>>
      economic: Record<string, unknown>
      timing: Record<string, number>
    } = {
      startups: {},
      economic: {},
      timing: {},
    }

    // Fetch sentiment for each startup
    for (const config of STARTUPS) {
      console.log(`Fetching sentiment for ${config.name}...`)
      const startupStart = Date.now()

      const sources: Record<string, SourceResult | null> = {}

      // Fetch from all sources in parallel
      const [wikipedia, googleNews, hackerNews, reddit, techCrunch] = await Promise.all([
        fetchWikipedia(config),
        fetchGoogleNews(config),
        fetchHackerNews(config),
        fetchReddit(config),
        fetchTechCrunch(config),
      ])

      sources.wikipedia = wikipedia
      sources['google-news'] = googleNews
      sources.hackernews = hackerNews
      sources.reddit = reddit
      sources.techcrunch = techCrunch

      results.startups[config.slug] = sources
      results.timing[config.slug] = Date.now() - startupStart

      // Upsert to database
      for (const [sourceName, result] of Object.entries(sources)) {
        if (!result) continue

        const { error } = await supabase
          .from('sentiment_data')
          .upsert({
            startup_slug: config.slug,
            startup_name: config.name,
            source: sourceName,
            score: result.score,
            trend: result.trend,
            raw_value: result.rawValue,
            metadata: result.metadata,
            fetched_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          }, {
            onConflict: 'startup_slug,source',
          })

        if (error) {
          console.error(`Failed to upsert ${config.slug}/${sourceName}:`, error)
        }
      }
    }

    // Fetch economic indicators
    console.log('Fetching economic indicators...')
    const econStart = Date.now()

    for (const indicator of FRED_INDICATORS) {
      const result = await fetchFredIndicator(indicator)
      if (!result) continue

      results.economic[indicator.code] = result

      const { error } = await supabase
        .from('economic_indicators')
        .upsert({
          indicator_code: indicator.code,
          indicator_name: indicator.name,
          category: indicator.category,
          value: result.value,
          unit: indicator.unit,
          change_1m: result.change1m,
          change_1y: result.change1y,
          trend: result.trend,
          observation_date: result.observationDate,
          fetched_at: new Date().toISOString(),
        }, {
          onConflict: 'indicator_code',
        })

      if (error) {
        console.error(`Failed to upsert ${indicator.code}:`, error)
      }
    }

    results.timing.economic = Date.now() - econStart
    results.timing.total = Date.now() - startTime

    console.log(`Sentiment fetch complete in ${results.timing.total}ms`)

    return new Response(JSON.stringify({
      status: 'success',
      results,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Sentiment fetch failed:', err)
    return new Response(JSON.stringify({
      status: 'error',
      error: String(err),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
