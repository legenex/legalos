'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { recheckDomainDns } from './actions'

type PendingDomain = { id: number; host: string; status: string }

const POLL_INTERVAL_MS = 30_000
const MAX_ATTEMPTS = 40 // ~20 minutes at 30s

export function DomainsAutoVerify({
  pendingDomains,
  siteSlug,
}: {
  pendingDomains: PendingDomain[]
  siteSlug: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [attempts, setAttempts] = useState(0)
  const [isChecking, setIsChecking] = useState(false)
  const [stopped, setStopped] = useState(false)
  // Track which domain IDs are still considered pending in-memory so that
  // once one resolves we stop hitting the action for it before the router
  // refresh completes.
  const liveIdsRef = useRef<Set<number>>(new Set(pendingDomains.map((d) => d.id)))

  useEffect(() => {
    liveIdsRef.current = new Set(pendingDomains.map((d) => d.id))
    if (pendingDomains.length === 0) {
      setStopped(true)
      return
    }
    setStopped(false)
    setAttempts(0)
  }, [pendingDomains])

  useEffect(() => {
    if (stopped) return
    if (pendingDomains.length === 0) return

    let cancelled = false

    const tick = async () => {
      if (cancelled) return
      if (liveIdsRef.current.size === 0) {
        setStopped(true)
        return
      }
      setIsChecking(true)
      const ids = Array.from(liveIdsRef.current)
      const results = await Promise.allSettled(
        ids.map((domainId) => recheckDomainDns({ domainId, siteSlug })),
      )
      if (cancelled) return
      let anyChanged = false
      results.forEach((r, idx) => {
        if (r.status !== 'fulfilled') return
        const res = r.value
        if (!res.ok) return
        if (res.status === 'verified' || res.status === 'active' || res.status === 'provisioning') {
          liveIdsRef.current.delete(ids[idx])
          anyChanged = true
        }
      })
      setIsChecking(false)
      setAttempts((a) => a + 1)
      if (anyChanged) {
        startTransition(() => router.refresh())
      }
      if (liveIdsRef.current.size === 0) {
        setStopped(true)
      }
    }

    // Run an immediate tick on mount so the user sees a fresh check, then
    // continue at the configured interval.
    void tick()
    const handle = setInterval(() => {
      if (attempts + 1 >= MAX_ATTEMPTS) {
        setStopped(true)
        clearInterval(handle)
        return
      }
      void tick()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(handle)
    }
    // We intentionally only want this effect to re-run when the set of pending
    // domain ids changes — not on every attempt count update. We capture the
    // id set via pendingDomains and use the attempts state for the cap check
    // inside the interval handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingDomains.map((d) => d.id).join(','), siteSlug, stopped])

  if (pendingDomains.length === 0) return null

  return (
    <div className="mt-3 text-[12px] text-[var(--color-ink-dim)] flex items-center gap-2">
      <span
        aria-hidden
        className={`inline-block w-1.5 h-1.5 rounded-full ${isChecking ? 'bg-[var(--color-info)] animate-pulse' : 'bg-[var(--color-ink-dim)]'}`}
      />
      {stopped ? (
        <span>Auto-check paused. Use the menu to re-check manually.</span>
      ) : isChecking ? (
        <span>Checking DNS for {pendingDomains.length} pending domain{pendingDomains.length === 1 ? '' : 's'}…</span>
      ) : (
        <span>Auto-checking pending domains every 30s (attempt {attempts}/{MAX_ATTEMPTS})</span>
      )}
    </div>
  )
}
