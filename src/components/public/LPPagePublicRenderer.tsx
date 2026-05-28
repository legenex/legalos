// @ts-nocheck
'use client'

// Public-side wrapper around LP's LivePreview. The LP builder's preview panel
// uses the same component in the admin canvas, so what the editor shows is
// what visitors see. onEditSection is omitted intentionally so the inline
// edit pencils don't render on the public site.

import { LivePreview } from '@/components/builder/lp/render'

type LPState = {
  templateId?: string
  angle?: string
  sections?: Array<Record<string, unknown>>
}

type Brand = Record<string, unknown> & { id: string }

type Props = {
  page: { title?: string; slug?: string }
  lpState: LPState
  brand: Brand
}

export function LPPagePublicRenderer({ page, lpState, brand }: Props) {
  const landingPage = {
    id: 'page',
    name: page.title || 'Page',
    slug: page.slug || '/',
    templateId: lpState.templateId || 'bold_modern',
    angle: lpState.angle || 'pain',
    isPublished: true,
    sections: Array.isArray(lpState.sections) ? lpState.sections : [],
  }
  return (
    <div style={{ minHeight: '100vh' }}>
      <LivePreview landingPage={landingPage} brand={brand} />
    </div>
  )
}
