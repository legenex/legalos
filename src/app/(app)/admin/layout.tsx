import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import '../../globals.css'
import { getCurrentUser } from '@/lib/auth'
import { VersionFooter } from '@/components/app/VersionFooter'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Legenex LegalOS',
  description: 'The smart legal brand website builder.',
}

// Root admin layout: html shell + auth gate only. Child layouts own the sidebar:
//   (top)/layout.tsx       — TopSidebar for LegalOS-wide views
//   sites/[slug]/layout.tsx — SiteSidebar for per-Site context
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in?redirect=/admin/overview')
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">{children}</div>
        <VersionFooter />
      </body>
    </html>
  )
}
