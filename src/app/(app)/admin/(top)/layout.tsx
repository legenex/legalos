import type { ReactNode } from 'react'
import { Sidebar } from '@/components/app/Sidebar'
import { getCurrentUser } from '@/lib/auth'

export default async function TopAdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  return (
    <>
      <Sidebar userEmail={user?.email ?? ''} />
      <main className="flex-1 min-w-0 bg-[var(--color-canvas)]">{children}</main>
    </>
  )
}
