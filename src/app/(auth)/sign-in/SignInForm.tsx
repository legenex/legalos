'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react'
import { signIn } from './actions'

export function SignInForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const onSubmit = (formData: FormData) => {
    setError(null)
    start(async () => {
      const result = await signIn(formData)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.replace(result.redirect)
      router.refresh()
    })
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="redirect" value={redirectTo} />

      <label className="block">
        <span className="block text-[12px] font-semibold text-[var(--color-ink-muted)] mb-1.5">Email</span>
        <div className="relative">
          <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] pointer-events-none" />
          <input
            type="email"
            name="email"
            autoComplete="email"
            autoFocus
            required
            placeholder="team@legenex.com"
            className="w-full bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-lg pl-10 pr-3 py-3 text-[15px] text-white placeholder:text-[var(--color-ink-dim)] focus:outline-none focus:border-[var(--color-border-strong)] focus:ring-2 focus:ring-[var(--color-brand-strong)]/20"
          />
        </div>
      </label>

      <label className="block">
        <span className="block text-[12px] font-semibold text-[var(--color-ink-muted)] mb-1.5">Password</span>
        <div className="relative">
          <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] pointer-events-none" />
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="••••••••••"
            className="w-full bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-lg pl-10 pr-3 py-3 text-[15px] text-white placeholder:text-[var(--color-ink-dim)] focus:outline-none focus:border-[var(--color-border-strong)] focus:ring-2 focus:ring-[var(--color-brand-strong)]/20"
          />
        </div>
      </label>

      {error ? (
        <div className="text-[13px] text-[var(--color-neg)] bg-[var(--color-neg)]/10 border border-[var(--color-neg)]/30 rounded-md px-3 py-2.5" role="alert">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="brand-gradient w-full text-white font-semibold text-[15px] px-5 py-3.5 rounded-lg disabled:opacity-60 hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {pending ? 'Signing in…' : 'Sign in'}
        {!pending ? <ArrowRight className="w-4 h-4" /> : null}
      </button>

      <div className="flex items-center justify-between pt-1">
        <Link href="/cms/forgot" className="text-[12px] text-[var(--color-ink-muted)] hover:text-white transition-colors">
          Forgot password?
        </Link>
        <Link href="/" className="text-[12px] text-[var(--color-ink-muted)] hover:text-white transition-colors">
          Back to site
        </Link>
      </div>
    </form>
  )
}
