import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { SignInForm } from './SignInForm'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ redirect?: string }> }

export default async function SignInPage({ searchParams }: Props) {
  const { redirect: redirectParam } = await searchParams
  const safeRedirect = redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
    ? redirectParam
    : '/admin/overview'

  // If you're already signed in, skip the form.
  const user = await getCurrentUser()
  if (user) redirect(safeRedirect)

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-[var(--color-canvas)] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-gradient-to-b from-[var(--color-brand-from)]/12 via-[var(--color-brand-to)]/6 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[var(--color-info)]/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px]">
        <header className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2.5">
            <span className="text-[22px] font-bold tracking-tight">
              <span className="text-[var(--color-brand-strong)]">Legal</span>
              <span className="text-white">OS</span>
            </span>
            <span className="text-[11px] text-[var(--color-ink-muted)] border border-[var(--color-border-strong)] rounded-full px-2 py-0.5">
              by Legenex
            </span>
          </a>
          <h1 className="mt-6 text-[26px] font-bold tracking-tight text-white">Sign in to LegalOS</h1>
          <p className="mt-2 text-[14px] text-[var(--color-ink-muted)]">
            Manage every brand site, funnel, and lead from one admin.
          </p>
        </header>

        <div className="rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-surface-1)] p-6 sm:p-8 shadow-2xl shadow-black/40">
          <SignInForm redirectTo={safeRedirect} />
        </div>

        <footer className="mt-6 flex items-center justify-between text-[12px] text-[var(--color-ink-dim)]">
          <span>© {new Date().getFullYear()} Legenex</span>
        </footer>
      </div>
    </main>
  )
}
