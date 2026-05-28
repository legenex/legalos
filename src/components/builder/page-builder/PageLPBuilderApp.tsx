// @ts-nocheck
/* eslint-disable */
'use client'

// Thin orchestrator that hosts LandingPageBuilder for editing a single Site
// Page. It debounces state updates into a server action that writes the
// LP-shape state into pages.shared_template_overrides.lp_state, mirroring
// name/slug/status fields onto the row itself so the public router still
// works. The user explicitly requested the Pages backend builder to be the
// same as the Landing Pages backend builder, so this just renders that
// component instead of forking it.

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LandingPageBuilder } from '@/components/builder/lp/LandingPagesApp'
import { Toast } from '@/components/builder/ui'
import { savePageLPState } from '@/app/(app)/admin/sites/[slug]/pages/[id]/lp-page-actions'

type Brand = Record<string, unknown> & { id: string; displayName: string }
type QuizDeployment = { id: string; quizId: string; brandId: string; domain: string; path: string }
type Quiz = { id: string; name: string }

type InitialLP = {
  id: string
  name: string
  slug: string
  templateId: string
  angle: string
  isPublished: boolean
  sections: Array<Record<string, unknown>>
}

type Props = {
  pageId: number | string
  siteSlug: string
  primaryHost: string
  brands: Brand[]
  quizzes: Quiz[]
  quizDeployments: QuizDeployment[]
  initial: InitialLP
}

export function PageLPBuilderApp({
  pageId,
  siteSlug,
  primaryHost,
  brands,
  quizzes,
  quizDeployments,
  initial,
}: Props) {
  const router = useRouter()
  const [lp, setLp] = useState<InitialLP>(initial)
  const [toast, setToast] = useState<{ message: string; type?: string } | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = (next: InitialLP) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const res = await savePageLPState({ pageId, siteSlug, lp: next })
      if (!res.ok) setToast({ message: res.error || 'Save failed', type: 'error' })
    }, 450)
  }

  const handleUpdate = (patch: InitialLP) => {
    const next = { ...lp, ...patch }
    setLp(next)
    persist(next)
  }

  const handleTogglePublish = () => {
    const next = { ...lp, isPublished: !lp.isPublished }
    setLp(next)
    persist(next)
  }

  const handleSetTemplate = (_id: string, templateId: string) => {
    const next = { ...lp, templateId }
    setLp(next)
    persist(next)
  }

  const handleBack = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    router.push(`/admin/sites/${siteSlug}/pages`)
  }

  const handlePreview = () => {
    const path = lp.slug.startsWith('/') ? lp.slug : `/${lp.slug}`
    const url = `https://${primaryHost}${path}?preview=1&ts=${Date.now()}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <LandingPageBuilder
        landingPage={lp}
        brands={brands}
        quizDeployments={quizDeployments}
        quizzes={quizzes}
        onBack={handleBack}
        onUpdate={handleUpdate}
        onTogglePublish={handleTogglePublish}
        onSetTemplate={handleSetTemplate}
        onPreview={handlePreview}
      />
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </>
  )
}
