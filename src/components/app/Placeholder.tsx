import Link from 'next/link'

export function Placeholder({ title, sub, deepLink }: { title: string; sub: string; deepLink?: { href: string; label: string } }) {
  return (
    <div className="p-10 max-w-[1400px]">
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
        <p className="text-[var(--color-ink-muted)] text-[15px] mt-1">{sub}</p>
      </header>
      <div className="rounded-xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-1)] p-10 text-center">
        <p className="text-[var(--color-ink-muted)] text-[15px]">This view is a follow-up build.</p>
        {deepLink ? (
          <p className="mt-4">
            <Link href={deepLink.href} className="text-[var(--color-info)] text-[14px] hover:underline">
              {deepLink.label} →
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  )
}
