'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'

const VERTICALS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All verticals' },
  { value: 'mass-tort', label: 'Mass Tort' },
  { value: 'mva', label: 'MVA' },
  { value: 'workers-comp', label: "Workers' Comp" },
  { value: 'personal-injury', label: 'Personal Injury' },
  { value: 'medical-malpractice', label: 'Medical Malpractice' },
  { value: 'class-action', label: 'Class Action' },
  { value: 'multi', label: 'Multi-vertical' },
]

export function SitesFilters({ status, vertical, q }: { status: string; vertical: string; q: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const [query, setQuery] = useState(q)

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(params.toString())
      if (query) next.set('q', query)
      else next.delete('q')
      router.replace(`/admin/sites?${next.toString()}`)
    }, 250)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const onVerticalChange = (value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set('vertical', value)
    else next.delete('vertical')
    router.replace(`/admin/sites?${next.toString()}`)
  }

  return (
    <div className="flex gap-3 items-stretch mb-5">
      <div className="flex-1 max-w-[420px] relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
        <input
          type="text"
          placeholder="Search sites or domains..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-lg pl-10 pr-3 py-2.5 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-dim)] focus:outline-none focus:border-[var(--color-border-strong)] focus:ring-2 focus:ring-[var(--color-brand-strong)]/20"
        />
      </div>
      <div className="relative">
        <select
          value={vertical}
          onChange={(e) => onVerticalChange(e.target.value)}
          className="appearance-none bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-lg pl-3.5 pr-9 py-2.5 text-[14px] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-border-strong)]"
        >
          {VERTICALS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] pointer-events-none" />
      </div>
      {/* preserve status in the URL state via hidden field — handled by parent */}
      <input type="hidden" value={status} />
    </div>
  )
}
