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
        is_archived: false,
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
        // A clone starts active even when cloned from an archived quiz: the
        // point of cloning an archive is to bring the work back into use.
        is_archived: false,
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

/**
 * Archive or restore a quiz.
 *
 * Archiving always forces `is_published: false` in the same write. Archive means
 * retired, and a retired quiz that is still published would keep serving traffic
 * from its deployments - so the two flags are set together rather than trusting
 * the caller to remember. Restoring deliberately does NOT re-publish: it comes
 * back as a draft so republishing is an explicit decision.
 */
export async function setQuizArchived(args: { id: string; archived: boolean }) {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const payload = await getPayload({ config })
  try {
    const archived = Boolean(args.archived)
    await payload.update({
      collection: 'funnel-quizzes',
      id: args.id,
      data: archived
        ? { is_archived: true, archived_at: new Date().toISOString(), is_published: false }
        : { is_archived: false, archived_at: null },
      user,
      overrideAccess: false,
    })
    revalidatePath(PATH)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'archive failed' }
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
    theme_overrides: dep.themeOverrides ?? null,
    destination_overrides: dep.destinationOverrides ?? null,
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
// AI theming for a deployment
// ---------------------------------------------------------------------------

const ThemeResult = z.object({
  templateId: z.enum(['default', 'minimal', 'editorial', 'gradient', 'glass', 'compact']),
  primary: z.string(),
  accent: z.string(),
  background: z.string(),
  cardBg: z.string(),
  headlineFont: z.string(),
  bodyFont: z.string(),
  rationale: z.string(),
})

const THEME_SYSTEM = `You design colour themes for legal-intake quiz funnels.

Return one theme. Rules you must follow:
- Every colour is a 6-digit hex string starting with #.
- "background" is the page behind the quiz card. "cardBg" is the card surface.
- background and cardBg must differ enough to read as separate surfaces.
- "primary" is the action colour used on buttons. It must have strong contrast
  against BOTH background and cardBg, because answer buttons appear on both.
- Fonts are common web or system family names only, no CSS stacks, no quotes.
- Pick the templateId whose character fits the material:
  default = familiar outlined boxes; minimal = dark and conservative, good for
  legal and medical; editorial = serif, classical, trustworthy; gradient = bold
  and high impact; glass = frosted and modern, tech feel; compact = dense and
  mobile first.
- rationale is one plain sentence. No em dashes.`

/**
 * Generate a per-deployment theme from a URL, a written prompt, or an image.
 *
 * The three sources converge on one validated shape, and the caller stores it
 * on the deployment rather than on the Site, so theming one deployment never
 * repaints the brand or the other deployments that share it.
 *
 * For a URL the palette is EXTRACTED, not imagined: the existing brand-token
 * pipeline reads the real stylesheet, and the model is only asked to choose a
 * template and fill what the extractor could not find. Deterministic where we
 * can be, generative only where we must be.
 */
export async function generateDeploymentTheme(args: {
  source: 'url' | 'prompt' | 'image'
  value?: string
  imageBase64?: string
  imageMediaType?: string
}) {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  const source = args.source
  const value = (args.value || '').trim()

  try {
    let extracted: Record<string, string | undefined> = {}
    let userPrompt = ''
    let images: Array<{ mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'; dataBase64: string }> = []

    if (source === 'url') {
      if (!value) return { ok: false, error: 'Enter a URL to pull the look from.' }
      const { fetchUrlBundle } = await import('@/lib/builder/extract/fetch-bundle')
      const { extractColors } = await import('@/lib/builder/extract/extract-colors')
      const bundle = await fetchUrlBundle(value)
      if (!bundle) return { ok: false, error: 'Could not load that URL. Check it is reachable and public.' }
      const c = extractColors({ css: bundle.css, html: bundle.html, googleFontFamilies: bundle.googleFontFamilies })
      extracted = {
        primary: c.primary,
        accent: c.accent,
        background: c.darkBackdrop || c.ink,
        cardBg: c.surface,
        headlineFont: c.fontHeading,
        bodyFont: c.fontBody,
      }
      const found = Object.entries(extracted).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join(', ')
      userPrompt = `A quiz funnel should visually match ${bundle.host}.\n\nColours and fonts read from that site's stylesheet: ${found || 'none found'}.\n\nUse the extracted values where they exist. Fill in anything missing so the result is a complete, readable theme, and pick the template that suits the site's character.`
    } else if (source === 'prompt') {
      if (!value) return { ok: false, error: 'Describe the look you want.' }
      userPrompt = `Design a quiz theme for this brief:\n\n${value.slice(0, 1200)}`
    } else {
      const b64 = (args.imageBase64 || '').replace(/^data:[^,]+,/, '')
      const mt = args.imageMediaType || ''
      if (!b64) return { ok: false, error: 'Upload an image to pull the look from.' }
      // ~4MB of base64 is roughly a 3MB image, comfortably inside the request
      // limit and well past what a screenshot needs.
      if (b64.length > 5_600_000) return { ok: false, error: 'That image is too large. Use one under 3MB.' }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mt)) {
        return { ok: false, error: 'Use a JPEG, PNG, GIF or WebP image.' }
      }
      images = [{ mediaType: mt as 'image/jpeg', dataBase64: b64 }]
      userPrompt = 'Derive a quiz theme from this image. Take the palette from the image itself, then make it work as an interface: the page and card surfaces must separate, and the action colour must stay readable on both.'
    }

    const out = await invokeLLM({
      system: THEME_SYSTEM,
      user: userPrompt,
      schema: ThemeResult,
      schemaName: 'quiz_theme',
      model: 'claude-sonnet-4-6',
      maxTokens: 1200,
      enforceNoBannedVocab: true,
      ...(images.length ? { images } : {}),
    })

    // Extraction beats generation for a URL: if the real stylesheet gave us a
    // colour, that colour wins over the model's version of it.
    const merged = {
      templateId: out.templateId,
      colors: {
        primary: extracted.primary || out.primary,
        accent: extracted.accent || out.accent,
        background: extracted.background || out.background,
        cardBg: extracted.cardBg || out.cardBg,
      },
      typography: {
        headlineFont: extracted.headlineFont || out.headlineFont,
        bodyFont: extracted.bodyFont || out.bodyFont,
      },
      rationale: out.rationale,
      source: {
        kind: source,
        value: source === 'image' ? 'uploaded image' : value.slice(0, 300),
        generatedAt: new Date().toISOString(),
      },
    }

    // normalizeQuizTheme is the same validator the renderer runs, so anything
    // it drops here would have been dropped at render time anyway. Validating
    // now means the editor shows exactly what will ship.
    const { normalizeQuizTheme } = await import('@/lib/quiz-theme')
    const theme = normalizeQuizTheme(merged)
    if (!theme) return { ok: false, error: 'The generated theme was not usable. Try again with more detail.' }

    return { ok: true, theme }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Theme generation failed' }
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
