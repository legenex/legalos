'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { SignOutButton } from './SignOutButton'
import {
  LayoutGrid,
  Globe,
  Layers,
  HelpCircle,
  Rocket,
  Megaphone,
  Inbox,
  BarChart3,
  Users,
  Settings,
  Activity,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: typeof LayoutGrid
  badge?: string
  disabled?: boolean
}

const TOP_NAV: NavItem[] = [
  { href: '/admin/overview', label: 'Overview', icon: LayoutGrid },
  { href: '/admin/sites', label: 'Sites', icon: Globe },
]

const FUNNELS_NAV: NavItem[] = [
  { href: '/admin/quizzes', label: 'Quizzes', icon: HelpCircle },
  { href: '/admin/landing-pages', label: 'Landing Pages', icon: Rocket },
  { href: '/admin/advertorials', label: 'Advertorials', icon: Megaphone, disabled: true },
]

const BOTTOM_NAV: NavItem[] = [
  { href: '/admin/leads', label: 'Leads', icon: Inbox },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, badge: 'soon' },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/system', label: 'System', icon: Activity },
]

export function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const [funnelsOpen, setFunnelsOpen] = useState(true)

  return (
    <aside className="w-[250px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface-1)] flex flex-col">
      <Link href="/admin/overview" className="px-6 py-6 border-b border-[var(--color-border)] block hover:opacity-80 transition-opacity">
        <div className="flex items-baseline gap-1.5">
          <span className="brand-text-gradient text-[18px] font-bold tracking-tight">Legenex</span>
          <span className="text-[18px] font-bold tracking-tight text-white">LegalOS</span>
        </div>
        <p className="text-[12px] text-[var(--color-ink-dim)] mt-1">The smart legal brand website builder.</p>
      </Link>

      <nav className="flex-1 py-3 overflow-y-auto">
        <NavSection items={TOP_NAV} pathname={pathname} />

        <FunnelsSection
          open={funnelsOpen}
          onToggle={() => setFunnelsOpen((v) => !v)}
          items={FUNNELS_NAV}
          pathname={pathname}
        />

        <NavSection items={BOTTOM_NAV} pathname={pathname} />
      </nav>

      <div className="border-t border-[var(--color-border)] px-4 py-2">
        <Link href="/cms" className="block text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink-muted)] py-1">
          Open raw Payload admin →
        </Link>
      </div>

      <SignOutButton userEmail={userEmail} />
    </aside>
  )
}

function NavSection({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <div className="px-3 space-y-0.5">
      {items.map((item) => (
        <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
      ))}
    </div>
  )
}

function FunnelsSection({
  open,
  onToggle,
  items,
  pathname,
}: {
  open: boolean
  onToggle: () => void
  items: NavItem[]
  pathname: string
}) {
  return (
    <div className="px-3 mt-1">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[14px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-2)] transition-colors"
      >
        <Layers className="w-[18px] h-[18px]" />
        <span className="flex-1 text-left">Funnels</span>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {open ? (
        <div className="mt-0.5 ml-3 pl-3 border-l border-[var(--color-border)] space-y-0.5">
          {items.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  if (item.disabled) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 rounded-md text-[14px] text-[var(--color-ink-dim)] cursor-not-allowed select-none">
        <Icon className="w-[18px] h-[18px]" />
        <span className="flex-1">{item.label}</span>
        {item.badge ? <Badge>{item.badge}</Badge> : null}
      </div>
    )
  }
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-[14px] transition-colors relative ${
        active
          ? 'text-white bg-[var(--color-surface-2)]'
          : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]'
      }`}
    >
      {active ? (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full brand-gradient" aria-hidden />
      ) : null}
      <Icon className="w-[18px] h-[18px]" />
      <span className="flex-1">{item.label}</span>
      {item.badge ? <Badge>{item.badge}</Badge> : null}
    </Link>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border border-[var(--color-border-strong)] text-[var(--color-ink-dim)]">
      {children}
    </span>
  )
}

function isActive(pathname: string, href: string): boolean {
  if (href === pathname) return true
  if (pathname.startsWith(`${href}/`)) return true
  return false
}
