'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Link2 } from 'lucide-react'
import { attachDomainToSite } from '@/app/(app)/admin/(top)/brands/domains/actions'

type PoolDomain = { id: number; host: string }

export function AttachFromPool({
  pool,
  siteId,
  siteSlug,
}: {
  pool: PoolDomain[]
  siteId: number
  siteSlug: string
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const onAttach = (): void => {
    if (!selected) return
    setError(null)
    startTransition(async () => {
      const result = await attachDomainToSite({ domainId: Number(selected), siteId, siteSlug })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setSelected('')
      router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
      <div className="flex items-center justify-between gap-6 mb-3">
        <div>
          <h3 className="text-[14px] font-semibold text-white">Attach a domain to this brand</h3>
          <p className="text-[12px] text-[var(--color-ink-muted)] mt-0.5">
            Pick from the unassigned pool, or connect a brand-new domain first.
          </p>
        </div>
        <Link
          href="/admin/brands/domains"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-info)] hover:underline"
        >
          <Link2 className="w-3.5 h-3.5" />
          Connect new domain
        </Link>
      </div>

      <div className="flex gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={pool.length === 0}
          className="flex-1 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[14px] text-white disabled:opacity-50 focus:outline-none focus:border-[var(--color-brand-from)]"
        >
          <option value="">
            {pool.length === 0 ? 'No unassigned domains in the pool' : 'Select a domain to attach…'}
          </option>
          {pool.map((d) => (
            <option key={d.id} value={d.id}>
              {d.host}
            </option>
          ))}
        </select>
        <button
          onClick={onAttach}
          disabled={!selected || pending}
          className="brand-gradient text-white text-[13px] font-semibold px-4 py-2 rounded-md inline-flex items-center gap-1.5 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          <Plus className="w-4 h-4" />
          {pending ? 'Attaching…' : 'Attach'}
        </button>
      </div>

      {error ? <p className="text-[12px] text-[var(--color-neg)] mt-2">{error}</p> : null}
    </div>
  )
}
