import { useEffect, useState } from 'react'
import { isLocalOrPrivateBrowserEnv } from '../utils/networkEnv'

export function useDashboardSyncDiff(isDev) {
  const [isLocalEnv, setIsLocalEnv] = useState(false)
  const [syncDiff, setSyncDiff] = useState(null)
  const [diffLoading, setDiffLoading] = useState(false)

  useEffect(() => {
    setIsLocalEnv(isLocalOrPrivateBrowserEnv())
  }, [])

  const loadSyncDiff = () => {
    if (!isDev || !isLocalEnv) {
      setSyncDiff(null)
      setDiffLoading(false)
      return
    }
    setDiffLoading(true)
    fetch('/api/sync-diff')
      .then((r) => r.json())
      .then((data) => setSyncDiff(data))
      .catch(() => setSyncDiff(null))
      .finally(() => setDiffLoading(false))
  }

  useEffect(() => {
    if (!isDev || !isLocalEnv) return
    loadSyncDiff()
    const id = setInterval(() => loadSyncDiff(), 30000)
    return () => clearInterval(id)
  }, [isDev, isLocalEnv])

  return {
    isLocalEnv,
    syncDiff,
    diffLoading,
    setSyncDiff,
    setDiffLoading,
    loadSyncDiff,
  }
}

