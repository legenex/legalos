import type { ReactNode } from 'react'
import { SettingsSubNav } from './SettingsSubNav'

export const dynamic = 'force-dynamic'

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <SettingsSubNav />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
