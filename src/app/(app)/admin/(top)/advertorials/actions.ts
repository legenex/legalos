// @ts-nocheck -- new funnel-* collection slugs are not in committed payload-types
// yet; run `pnpm generate:types` on the server to restore typing.
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'
import { invokeLLM } from '@/lib/ai/invoke'

const PATH = '/admin/advertorials'

const numFromBrandId = (brandId) => {
  if (typeof brandId !== 'string') return null
  const n = Number(brandId.replace('site_', ''))
  return Number.isFinite(n) ? n : null
}

const advData = (a) => ({
  title: a.title || 'Untitled Advertorial',
  slug: a.slug || `advertorial-${Date.now().toString(36)}`,
  template_id: a.templateId || 'personal_story',
  default_brand_id: a.defaultBrandId || '',
  status: a.status || 'draft',
  sections: Array.isArray(a.sections) ? a.sections : [],
})

// ---------------------------------------------------------------------------
// Advertorials (brandless)
// ---------------------------------------------------------------------------
export async function createAdvertorial(args: { advertorial: Record<string, unknown> }) {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const payload = await getPayload({ config })
  try {
    const created = await payload.create({ collection: 'funnel-advertorials', data: advData(args.advertorial || {}), user, overrideAccess: false })
    revalidatePath(PATH)
    return { ok: true, id: String(created.id) }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'create failed' }
  }
}

export async function saveAdvertorial(args: { id: string; advertorial: Record<string, unknown> }) {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const payload = await getPayload({ config })
  try {
    await payload.update({ collection: 'funnel-advertorials', id: args.id, data: advData(args.advertorial || {}), user, overrideAccess: false })
    revalidatePath(PATH)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'save failed' }
  }
}

export async function deleteAdvertorial(args: { id: string }) {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const payload = await getPayload({ config })
  try {
    const deps = await payload.find({ collection: 'funnel-advertorial-deployments', where: { advertorial: { equals: args.id } }, limit: 500, overrideAccess: true })
    for (const d of deps.docs) await payload.delete({ collection: 'funnel-advertorial-deployments', id: d.id, user, overrideAccess: false })
    await payload.delete({ collection: 'funnel-advertorials', id: args.id, user, overrideAccess: false })
    revalidatePath(PATH)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'delete failed' }
  }
}

// ---------------------------------------------------------------------------
// Advertorial deployments
// ---------------------------------------------------------------------------
export async function saveAdvertorialDeployment(args: { deployment: Record<string, unknown> }) {
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
    advertorial: dep.advertorialId && /^\d+$/.test(String(dep.advertorialId)) ? Number(dep.advertorialId) : null,
    site: numFromBrandId(dep.brandId),
    domain: domainId,
    path: dep.path || '',
    quiz_deployment_id: dep.quizDeploymentId || '',
    cta_mode: dep.ctaMode || 'button',
    status: dep.status || 'draft',
    utm: dep.utm ?? {},
    pixels: dep.pixels ?? {},
  }

  const isExisting = typeof dep.id === 'string' && /^\d+$/.test(dep.id)
  try {
    let id
    if (isExisting) {
      await payload.update({ collection: 'funnel-advertorial-deployments', id: dep.id, data, user, overrideAccess: false })
      id = dep.id
    } else {
      const created = await payload.create({ collection: 'funnel-advertorial-deployments', data, user, overrideAccess: false })
      id = String(created.id)
    }
    revalidatePath(PATH)
    return { ok: true, id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'save failed' }
  }
}

export async function deleteAdvertorialDeployment(args: { id: string }) {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const payload = await getPayload({ config })
  try {
    await payload.delete({ collection: 'funnel-advertorial-deployments', id: args.id, user, overrideAccess: false })
    revalidatePath(PATH)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'delete failed' }
  }
}

// ---------------------------------------------------------------------------
// AI: section rewrite + full-advertorial generation (advCallClaude wrapper).
// Returns a plain string, or a parsed object when json is requested.
// ---------------------------------------------------------------------------
const stripFences = (s: string) => s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

export async function aiAdvertorial(args: { system: string; user: string; json?: boolean }) {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  try {
    // invokeLLM returns a single `result` string. When the caller wants JSON,
    // tell the model to place the whole JSON payload (as text) into `result`.
    const system = args.json
      ? `${args.system}\n\nIMPORTANT: put the complete JSON described above, as a single raw JSON string (no markdown fences), into the "result" field.`
      : args.system
    const out = await invokeLLM({
      system,
      user: args.user,
      schema: z.object({ result: z.string() }),
      schemaName: 'advertorial_ai',
      model: 'claude-sonnet-4-6',
      maxTokens: 4096,
      enforceNoBannedVocab: true,
    })
    const raw = out.result
    if (args.json) {
      try {
        return { ok: true, result: JSON.parse(stripFences(raw)) }
      } catch {
        return { ok: false, error: 'AI returned malformed JSON. Try again.' }
      }
    }
    return { ok: true, result: raw }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'AI failed' }
  }
}

// Bulk simplify: rewrite an array of body paragraphs to a lower reading level,
// returning a same-length array in the same order.
export async function aiBulkSimplify(args: { texts: string[] }) {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const texts = Array.isArray(args.texts) ? args.texts : []
  if (!texts.length) return { ok: true, texts: [] }
  try {
    const out = await invokeLLM({
      system:
        'You are a direct-response editor simplifying MVA legal advertorial paragraphs. Lower the reading level and tighten the language while keeping the meaning, the same approximate length or shorter, and any {{brand.*}} tokens intact. Plain conversational US English. No em dashes. Return a JSON array of the rewritten paragraphs in the SAME order and SAME count as the input via the "texts" field.',
      user: `Rewrite each of these ${texts.length} paragraphs:\n\n${JSON.stringify(texts)}`,
      schema: z.object({ texts: z.array(z.string()) }),
      schemaName: 'bulk_simplify',
      model: 'claude-sonnet-4-6',
      maxTokens: 4096,
      enforceNoBannedVocab: true,
    })
    const result = Array.isArray(out.texts) && out.texts.length === texts.length ? out.texts : texts
    return { ok: true, texts: result }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'AI failed' }
  }
}
