// @ts-nocheck -- new funnel-* collection slugs are not in committed payload-types
// yet; run `pnpm generate:types` on the server to restore typing.
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'
import { invokeLLM } from '@/lib/ai/invoke'

const PATH = '/admin/quizzes'

const numFromBrandId = (brandId) => {
  if (typeof brandId !== 'string') return null
  const n = Number(brandId.replace('site_', ''))
  return Number.isFinite(n) ? n : null
}

// ---------------------------------------------------------------------------
// Quizzes (brandless)
// ---------------------------------------------------------------------------
export async function createQuiz(args: { quiz: Record<string, unknown> }) {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const q = args.quiz || {}
  const payload = await getPayload({ config })
  try {
    const created = await payload.create({
      collection: 'funnel-quizzes',
      data: {
        name: q.name || 'New Quiz',
        slug: q.slug || `quiz-${Date.now().toString(36)}`,
        is_published: Boolean(q.isPublished),
        tiers: q.tiers ?? [],
        steps: q.steps ?? [],
        nodes: q.nodes ?? [],
        custom_fields: q.customFields ?? [],
      },
      user,
      overrideAccess: false,
    })
    revalidatePath(PATH)
    return { ok: true, id: String(created.id) }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'create failed' }
  }
}

export async function saveQuiz(args: { id: string; patch: Record<string, unknown> }) {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const payload = await getPayload({ config })
  try {
    await payload.update({ collection: 'funnel-quizzes', id: args.id, data: args.patch, user, overrideAccess: false })
    revalidatePath(PATH)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'save failed' }
  }
}

export async function cloneQuiz(args: { id: string }) {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const payload = await getPayload({ config })
  try {
    const src = await payload.findByID({ collection: 'funnel-quizzes', id: args.id, overrideAccess: true })
    if (!src) return { ok: false, error: 'not found' }
    const created = await payload.create({
      collection: 'funnel-quizzes',
      data: {
        name: `${src.name} (copy)`,
        slug: `${src.slug}-copy-${Date.now().toString(36).slice(-4)}`,
        is_published: false,
        tiers: src.tiers ?? [],
        steps: src.steps ?? [],
        nodes: src.nodes ?? [],
        custom_fields: src.custom_fields ?? [],
      },
      user,
      overrideAccess: false,
    })
    revalidatePath(PATH)
    return { ok: true, id: String(created.id) }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'clone failed' }
  }
}

export async function deleteQuiz(args: { id: string }) {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const payload = await getPayload({ config })
  try {
    const deps = await payload.find({ collection: 'funnel-quiz-deployments', where: { quiz: { equals: args.id } }, limit: 500, overrideAccess: true })
    for (const d of deps.docs) await payload.delete({ collection: 'funnel-quiz-deployments', id: d.id, user, overrideAccess: false })
    await payload.delete({ collection: 'funnel-quizzes', id: args.id, user, overrideAccess: false })
    revalidatePath(PATH)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'delete failed' }
  }
}

// ---------------------------------------------------------------------------
// Quiz deployments
// ---------------------------------------------------------------------------
export async function saveQuizDeployment(args: { deployment: Record<string, unknown> }) {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const dep = args.deployment || {}
  const payload = await getPayload({ config })

  let domainId = null
  if (typeof dep.domain === 'string' && dep.domain) {
    const dr = await payload.find({ collection: 'domains', where: { host: { equals: dep.domain } }, limit: 1, overrideAccess: true })
    domainId = dr.docs[0] ? Number(dr.docs[0].id) : null
  }

  const data = {
    name: dep.name || '',
    quiz: dep.quizId ? Number(dep.quizId) : null,
    site: numFromBrandId(dep.brandId),
    domain: domainId,
    path: dep.path || '',
    render_mode: dep.renderMode || 'standalone',
    template_id: dep.templateId || 'default',
    status: dep.status || 'draft',
    embed_preview_bg: dep.embedPreviewBg || '',
    header_config: dep.headerConfig ?? {},
    footer_config: dep.footerConfig ?? {},
    body_section_overrides: dep.bodySectionOverrides ?? null,
    utm: dep.utm ?? {},
    pixels: dep.pixels ?? {},
  }

  const isExisting = typeof dep.id === 'string' && /^\d+$/.test(dep.id)
  try {
    let id
    if (isExisting) {
      await payload.update({ collection: 'funnel-quiz-deployments', id: dep.id, data, user, overrideAccess: false })
      id = dep.id
    } else {
      const created = await payload.create({ collection: 'funnel-quiz-deployments', data, user, overrideAccess: false })
      id = String(created.id)
    }
    revalidatePath(PATH)
    return { ok: true, id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'save failed' }
  }
}

export async function deleteQuizDeployment(args: { id: string }) {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const payload = await getPayload({ config })
  try {
    await payload.delete({ collection: 'funnel-quiz-deployments', id: args.id, user, overrideAccess: false })
    revalidatePath(PATH)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'delete failed' }
  }
}

// ---------------------------------------------------------------------------
// Per-node AI test (AIEditor + preview runtime). Plain-text result via invokeLLM.
// ---------------------------------------------------------------------------
export async function aiTestPrompt(args: { prompt: string; model?: string }) {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  try {
    const out = await invokeLLM({
      system: 'You process quiz answer data. Follow the user instruction exactly and return only the result string. Do not use em dashes.',
      user: args.prompt,
      schema: z.object({ result: z.string() }),
      schemaName: 'ai_result',
      model: 'claude-sonnet-4-6',
      maxTokens: 1000,
      enforceNoBannedVocab: true,
    })
    return { ok: true, text: out.result }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'AI failed' }
  }
}
