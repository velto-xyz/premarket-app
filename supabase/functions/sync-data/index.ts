import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DEBOUNCE_MS = 500
const MAX_WAIT_MS = 3000

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const INDEXER_URL = Deno.env.get('INDEXER_URL')!

interface IndexerTrade {
  id: string
  engine: string
  user: string
  positionId: string
  eventType: string
  price: string
  baseSize: string
  margin: string
  notional: string
  pnl: string | null
  isLong: boolean
  timestamp: string  // ISO timestamptz from indexer
}

async function fetchTradesFromIndexer(sinceTimestamp: string): Promise<IndexerTrade[]> {
  // Use timestamp for incremental sync
  const query = `
    {
      Trade(where: {timestamp: {_gt: "${sinceTimestamp}"}}, order_by: {timestamp: asc}, limit: 1000) {
        id
        engine
        user
        positionId
        eventType
        price
        baseSize
        margin
        notional
        pnl
        isLong
        timestamp
      }
    }
  `

  const res = await fetch(INDEXER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  })

  if (!res.ok) {
    throw new Error(`Indexer query failed: ${res.status}`)
  }

  const json = await res.json()
  return json.data?.Trade || []
}

function formatBigInt(value: string): string {
  // Convert from raw bigint (18 decimals) to decimal string
  const bn = BigInt(value)
  const isNegative = bn < 0n
  const absBn = isNegative ? -bn : bn
  const divisor = BigInt(10 ** 18)
  const intPart = absBn / divisor
  const fracPart = absBn % divisor
  const fracStr = fracPart.toString().padStart(18, '0')
  const sign = isNegative ? '-' : ''
  return `${sign}${intPart}.${fracStr}`
}

Deno.serve(async (_req) => {
  try {
    // Acquire lock
    const { data: state, error: selectError } = await supabase
      .rpc('get_sync_state_with_lock')

    if (selectError) {
      console.error('Failed to get state:', selectError)
      return new Response(JSON.stringify({ error: selectError.message }), { status: 500 })
    }

    if (!state || state.length === 0) {
      return new Response(JSON.stringify({ status: 'skipped', reason: 'locked' }), { status: 200 })
    }

    const row = state[0]
    const now = Date.now()

    // Check debounce (only if dirty)
    if (row.dirty && row.first_dirty_at && row.last_dirty_at) {
      const firstDirty = new Date(row.first_dirty_at).getTime()
      const lastDirty = new Date(row.last_dirty_at).getTime()
      const timeSinceFirst = now - firstDirty
      const timeSinceLast = now - lastDirty

      if (timeSinceLast < DEBOUNCE_MS && timeSinceFirst < MAX_WAIT_MS) {
        return new Response(JSON.stringify({
          status: 'skipped',
          reason: 'debouncing',
          timeSinceLast,
          timeSinceFirst
        }), { status: 200 })
      }
    }

    // Mark dirty for debounce tracking
    await supabase
      .from('sync_state')
      .update({
        dirty: true,
        first_dirty_at: row.first_dirty_at || new Date().toISOString(),
        last_dirty_at: new Date().toISOString()
      })
      .eq('id', 1)

    // Fetch trades from indexer
    const lastSyncedAt = row.last_synced_at || '1970-01-01T00:00:00Z'
    console.log('Fetching trades since:', lastSyncedAt)
    const trades = await fetchTradesFromIndexer(lastSyncedAt)
    console.log('Fetched trades:', trades.length)

    if (trades.length === 0) {
      // Clear dirty, nothing to sync
      await supabase
        .from('sync_state')
        .update({ dirty: false, first_dirty_at: null, last_dirty_at: null })
        .eq('id', 1)

      return new Response(JSON.stringify({ status: 'skipped', reason: 'no_new_trades' }), { status: 200 })
    }

    // Process trades
    let maxTimestamp = lastSyncedAt

    for (const trade of trades) {
      const timestamp = trade.timestamp
      if (timestamp > maxTimestamp) maxTimestamp = timestamp

      // Upsert trade
      const { error: tradeError } = await supabase
        .from('trades')
        .upsert({
          id: trade.id,
          engine: trade.engine,
          user_address: trade.user,
          position_id: trade.positionId,
          event_type: trade.eventType,
          is_long: trade.isLong,
          price: formatBigInt(trade.price),
          base_size: formatBigInt(trade.baseSize),
          margin: formatBigInt(trade.margin),
          notional: formatBigInt(trade.notional),
          pnl: trade.pnl ? formatBigInt(trade.pnl) : null,
          timestamp
        })

      if (tradeError) {
        console.error('Trade upsert error:', tradeError)
      }

      // Handle position based on event type
      if (trade.eventType === 'open') {
        // Upsert position
        const leverage = BigInt(trade.notional) / BigInt(trade.margin || '1')
        const { error: posError } = await supabase
          .from('positions')
          .upsert({
            id: trade.positionId,
            engine: trade.engine,
            user_address: trade.user,
            is_long: trade.isLong,
            entry_price: formatBigInt(trade.price),
            base_size: formatBigInt(trade.baseSize),
            margin: formatBigInt(trade.margin),
            leverage: leverage.toString(),
            status: 'open',
            opened_at: timestamp,
            closed_at: null
          })

        if (posError) console.error('Position upsert error:', posError)

        // Upsert wallet
        const { error: walletError } = await supabase
          .from('wallets')
          .upsert({ address: trade.user }, { onConflict: 'address' })

        if (walletError) console.error('Wallet upsert error:', walletError)

      } else if (trade.eventType === 'close' || trade.eventType === 'liquidate') {
        // Update position status
        const { error: posError } = await supabase
          .from('positions')
          .update({
            status: trade.eventType === 'liquidate' ? 'liquidated' : 'closed',
            closed_at: timestamp
          })
          .eq('id', trade.positionId)

        if (posError) console.error('Position update error:', posError)
      }

      // Update user holdings (for all event types)
      const { error: holdingError } = await supabase.rpc('upsert_user_holding', {
        p_user_address: trade.user,
        p_engine: trade.engine,
        p_event_type: trade.eventType,
        p_margin: formatBigInt(trade.margin),
        p_volume: formatBigInt(trade.notional),
        p_pnl: trade.pnl ? formatBigInt(trade.pnl) : '0',
        p_timestamp: timestamp
      })

      if (holdingError) console.error('User holding upsert error:', holdingError)
    }

    // Refresh materialized views
    console.log('Refreshing materialized views...')
    const { error: refreshError } = await supabase.rpc('refresh_ohlcv_views')
    if (refreshError) {
      console.error('Refresh failed:', refreshError)
    }

    // Update state
    const { error: updateError } = await supabase
      .from('sync_state')
      .update({
        dirty: false,
        first_dirty_at: null,
        last_dirty_at: null,
        last_synced_at: maxTimestamp
      })
      .eq('id', 1)

    if (updateError) {
      console.error('Failed to update state:', updateError)
    }

    console.log('Sync complete. Synced', trades.length, 'trades. Last timestamp:', maxTimestamp)
    return new Response(JSON.stringify({
      status: 'synced',
      trades: trades.length,
      lastTimestamp: maxTimestamp
    }), { status: 200 })

  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
