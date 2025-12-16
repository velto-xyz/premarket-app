import { useCallback, useEffect, useRef } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export function useSync(options?: { autoSync?: boolean }) {
  const { autoSync = true } = options || {}
  const hasSynced = useRef(false)

  const triggerSync = useCallback(async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/sync-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      console.log('[useSync] Sync result:', data)
      return data
    } catch (err) {
      console.error('[useSync] Sync error:', err)
      return { status: 'error', error: String(err) }
    }
  }, [])

  // Auto-sync on mount
  useEffect(() => {
    if (autoSync && !hasSynced.current) {
      hasSynced.current = true
      triggerSync()
    }
  }, [autoSync, triggerSync])

  return { triggerSync }
}
