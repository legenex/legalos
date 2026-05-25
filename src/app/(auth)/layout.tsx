import type { ReactNode } from 'react'
import '../globals.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sign in — Legenex LegalOS',
  description: 'Sign in to the LegalOS admin.',
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
