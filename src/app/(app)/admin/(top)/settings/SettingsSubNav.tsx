'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plug, Users, Activity } from 'lucide-react'

const TABS = [
  { href: '/admin/settings/integrations', label: 'Integrations', icon: Plug },
  { href: '/admin/settings/users', label: 'Users', icon: Users },
  { href: '/admin/settings/system', label: 'System', icon: Activity },
] as const

export function SettingsSubNav() {
  const pathname = usePathname()
  return (
    <nav className="border-b border-[var(--color-border)] bg-[var(--color-surface-1)] px-10">
      <ul className="flex gap-1 -mb-px">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`)
          const Icon = tab.icon
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`inline-flex items-center gap-2 px-4 py-3.5 text-[13px] font-medium border-b-2 transition-colors ${
                  active
                    ? 'text-white border-white'
                    : 'text-[var(--color-ink-muted)] border-transparent hover:text-[var(--color-ink)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
