'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2 } from 'lucide-react'
import { signOut } from '@/app/(auth)/sign-in/actions'

export function SignOutButton({ userEmail }: { userEmail: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  const onSignOut = () => {
    start(async () => {
      await signOut()
      router.replace('/sign-in')
      router.refresh()
    })
  }

  return (
    <div className="px-3 py-3 border-t border-[var(--color-border)]">
      <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1.5 min-w-0">
        <span className="w-7 h-7 rounded-full brand-gradient flex items-center justify-center text-white text-[12px] font-bold shrink-0">
          {userEmail.charAt(0).toUpperCase()}
        </span>
        <span className="text-[12px] text-[var(--color-ink-muted)] truncate flex-1">{userEmail}</span>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        disabled={pending}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-[var(--color-ink-muted)] hover:text-white hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-50"
      >
        {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
        <span>{pending ? 'Signing out…' : 'Sign out'}</span>
      </button>
    </div>
  )
}
