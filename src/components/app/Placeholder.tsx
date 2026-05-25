import Link from 'next/link'
import { Newspaper, type LucideIcon } from 'lucide-react'

export function Placeholder({
  title,
  sub,
  icon: Icon = Newspaper,
  deepLink,
}: {
  title: string
  sub: string
  icon?: LucideIcon
  deepLink?: { href: string; label: string }
}) {
  return (
    <div className="p-10 max-w-[1400px]">
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-white">{title}</h1>
        <p className="text-[var(--color-ink-muted)] text-[15px] mt-1">{sub}</p>
      </header>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] py-24 px-10 flex flex-col items-center text-center">
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-ink-muted)] mb-5">
          <Icon className="w-6 h-6" />
        </span>
        <h2 className="text-[18px] font-semibold text-white">Coming soon</h2>
        <p className="text-[var(--color-ink-muted)] text-[14px] mt-2 max-w-md">
          This module is part of LegalOS but is not yet implemented in this artifact.
        </p>
        {deepLink ? (
          <p className="mt-5">
            <Link href={deepLink.href} className="text-[var(--color-info)] text-[14px] hover:underline">
              {deepLink.label} →
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  )
}
