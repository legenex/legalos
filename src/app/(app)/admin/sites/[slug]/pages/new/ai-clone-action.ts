'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'
import { invokeLLM } from '@/lib/ai/invoke'
import { BlockSchema } from '@/lib/builder/block-schemas'

// Clone a public URL into a new Page. We fetch the source HTML, hand it to
// the model with the full Pages body_blocks schema, and the model returns
// a structured list of blocks that closely mirrors the source layout. The
// new page is created in draft so the user can review before publishing.

const CLONE_SCHEMA = z.object({
  title: z.string().describe('Short page title suitable for a browser tab (e.g. "Home", "Services", "About").'),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  body_blocks: z.array(BlockSchema).describe('Page sections, top to bottom, mapped to the closest matching block type.'),
})

// Strip everything that isn't visible page copy / structure so the model gets
// a concise input. We keep heading levels, paragraphs, lists, image alt text,
// and anchor labels — drop scripts, styles, comments, SVG paths.
const stripHtml = (html: string, maxChars = 60_000): string => {
  let s = html
  s = s.replace(/<script[\s\S]*?<\/script>/gi, '')
  s = s.replace(/<style[\s\S]*?<\/style>/gi, '')
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
  s = s.replace(/<!--[\s\S]*?-->/g, '')
  s = s.replace(/<svg[\s\S]*?<\/svg>/gi, '')
  s = s.replace(/\s+/g, ' ').trim()
  if (s.length > maxChars) s = s.slice(0, maxChars) + ' …[truncated]'
  return s
}

type CloneResult =
  | { ok: true; id: string | number }
  | { ok: false; error: string }

export async function createPageFromUrl(args: {
  siteId: number | string
  siteSlug: string
  slug: string
  status: string
  sourceUrl: string
}): Promise<CloneResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  let sourceUrl = (args.sourceUrl || '').trim()
  if (!sourceUrl) return { ok: false, error: 'Source URL is required' }
  if (!/^https?:\/\//i.test(sourceUrl)) sourceUrl = 'https://' + sourceUrl

  let slug = (args.slug || '').trim()
  if (!slug) return { ok: false, error: 'Slug is required' }
  if (slug !== '/' && !slug.startsWith('/')) slug = '/' + slug

  let html: string
  try {
    const res = await fetch(sourceUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; LegalOSPageCloner/1.0; +https://os.legenex.com)',
      },
      redirect: 'follow',
    })
    if (!res.ok) return { ok: false, error: `Source URL returned ${res.status} ${res.statusText}` }
    html = await res.text()
  } catch (err) {
    return { ok: false, error: `Could not fetch source URL: ${err instanceof Error ? err.message : 'network error'}` }
  }

  const cleaned = stripHtml(html)

  let cloned: z.infer<typeof CLONE_SCHEMA>
  try {
    cloned = await invokeLLM({
      schema: CLONE_SCHEMA,
      schemaName: 'cloned_page',
      system: [
        'You convert a public marketing/landing-page URL into a structured list of body_blocks for a LegalOS Page.',
        'Read the HTML body content, identify each visible section top-to-bottom, and emit ONE block per section using the closest matching blockType.',
        '',
        'Mapping rules:',
        '- Top navigation/header bar -> nav_header (links array, cta_label, cta_href).',
        '- Main above-the-fold hero -> hero. Put the full headline (including any accented second line) into `heading`. Set `image_url` only if the hero uses an image background or right-side photo.',
        '- A strip of small trust badges right under the hero -> trust_strip with one item per badge (value = the wordmark text).',
        '- "Our services / We specialize in" 3-4 up cards -> services_grid.',
        '- Numbered or stepped process explainer (1/2/3) -> how_it_works.',
        '- Customer testimonials/quotes -> testimonials.',
        '- Past results / settlement amounts -> recent_wins (amount string includes the $ and units).',
        '- Frequently Asked Questions accordions -> faq.',
        '- Final closing CTA section -> final_cta.',
        '- Generic 2-up / 3-up content cards -> cards.',
        '- Single image with caption -> image. Generic long-form copy -> prose with markdown.',
        '- Bulleted eligibility lists or "who we help" lists -> bullet_list.',
        '- Site footer with multiple link columns + legal text -> site_footer.',
        '',
        'Preserve the source copy verbatim where possible. If the source uses banned vocabulary (em-dashes, "vibes", "leverage", "synergy", "in today\'s world"), rewrite to remove them. Do NOT invent statistics, settlement amounts, or testimonials that are not in the source.',
        'If the source is paywalled, behind auth, or returns no meaningful content, emit a single prose block with markdown that says "Could not extract content from <url>" and nothing else.',
      ].join('\n'),
      user: [
        `Source URL: ${sourceUrl}`,
        '',
        'Stripped page HTML (scripts/styles/comments removed):',
        cleaned,
      ].join('\n'),
      maxTokens: 8192,
      enforceNoBannedVocab: true,
    })
  } catch (err) {
    return { ok: false, error: `AI clone failed: ${err instanceof Error ? err.message : 'unknown error'}` }
  }

  const payload = await getPayload({ config })
  try {
    const dup = await payload.find({
      collection: 'pages',
      where: { and: [{ site: { equals: args.siteId } }, { slug: { equals: slug } }] },
      limit: 1,
      overrideAccess: true,
    })
    if (dup.docs.length > 0) {
      return { ok: false, error: `A page with slug "${slug}" already exists on this site.` }
    }

    const created = await payload.create({
      collection: 'pages',
      data: {
        site: args.siteId,
        title: cloned.title || 'Cloned page',
        slug,
        status: args.status || 'draft',
        template_key: 'custom',
        uses_shared_template: false,
        meta_title: cloned.meta_title || null,
        meta_description: cloned.meta_description || null,
        body_blocks: cloned.body_blocks,
      } as never,
      user: user as never,
      overrideAccess: false,
    })
    revalidatePath(`/admin/sites/${args.siteSlug}/pages`)
    return { ok: true, id: created.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'create failed' }
  }
}
