'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'
import { normalizeAIBlocks } from '@/lib/builder/block-schemas'
import { extractBlocksFromHtml } from '@/lib/builder/html-to-blocks'
import { extractStructuredFromHtml } from '@/lib/builder/html-to-structured-blocks'

// Import a Page from raw HTML (and optional CSS) the user has on disk.
// Unlike the URL clone path this works for SPAs, paywalled / authenticated
// pages, and brand-archive HTML that doesn't live on a public URL.
//
// Two modes:
//   - 'structured-fields' → cheerio walks the DOM AND maps each section to
//                           a structured block type (hero, faq, etc.) for
//                           field-by-field editing on the right side.
//   - 'structured'        → cheerio walks the DOM, one raw custom_html
//                           block per top-level section. Pixel-perfect
//                           visual, editable via Quick edit + raw HTML.

const decodeDataUrl = (dataUrl: string | undefined): string => {
  if (!dataUrl) return ''
  const m = /^data:[^;]+(?:;charset=[^;]+)?;base64,(.+)$/.exec(dataUrl)
  if (!m) return ''
  try {
    return Buffer.from(m[1], 'base64').toString('utf8')
  } catch {
    return ''
  }
}


type Result =
  | { ok: true; id: string | number }
  | { ok: false; error: string }

// Treat very short uploads as user error rather than silently failing —
// the AI parse pipeline isn't useful on a stub. Same threshold logic as
// the URL clone SPA guard.
const guardEmpty = (text: string, label: string): string | null => {
  const visible = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (text.length < 500 || visible.length < 200) {
    return `${label} contains only ${visible.length} chars of visible text. Did you upload the right file?`
  }
  return null
}

export async function createPageFromHtml(args: {
  siteId: number | string
  siteSlug: string
  slug: string
  status: string
  mode: 'structured-fields' | 'structured'
  htmlDataUrl: string
  cssDataUrl?: string
  htmlFilename?: string
}): Promise<Result> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  const html = decodeDataUrl(args.htmlDataUrl).trim()
  if (!html) return { ok: false, error: 'No HTML file was provided.' }
  const guardMsg = guardEmpty(html, 'HTML file')
  if (guardMsg) return { ok: false, error: guardMsg }

  let slug = (args.slug || '').trim()
  if (!slug) return { ok: false, error: 'Slug is required' }
  if (slug !== '/' && !slug.startsWith('/')) slug = '/' + slug

  // Uploaded CSS goes into the extractor unchanged. The extractor lifts
  // every inline <style> tag out of the HTML and ships them as a single
  // 'Page styles' custom_html block, so passing the external CSS lets it
  // merge them into the same style block.
  const externalCss = decodeDataUrl(args.cssDataUrl).trim()

  const payload = await getPayload({ config })

  // Slug uniqueness inside the site.
  const dup = await payload.find({
    collection: 'pages',
    where: { and: [{ site: { equals: args.siteId } }, { slug: { equals: slug } }] },
    limit: 1,
    overrideAccess: true,
  })
  if (dup.docs.length > 0) {
    return { ok: false, error: `A page with slug "${slug}" already exists on this site.` }
  }

  let title = 'Imported page'
  let metaDescription: string | null = null
  let bodyBlocks: Array<Record<string, unknown>> = []

  if (args.mode === 'structured-fields') {
    // DOM walks via cheerio AND maps each section to a structured block type
    // (hero, faq, services_grid, etc.) so the right-side editor shows
    // field-by-field inputs instead of raw HTML. Falls back to custom_html
    // for sections that don't match any detector. No AI calls.
    try {
      const out = extractStructuredFromHtml(html, externalCss || undefined)
      title = out.title || title
      metaDescription = out.meta_description ?? null
      // Same post-process as the AI pipeline: drops empty array items,
      // synthesises footer column headings from their first link, etc. —
      // belt-and-braces against Payload's per-field required validation
      // tripping on detector edge cases.
      bodyBlocks = normalizeAIBlocks(out.blocks)
    } catch (err) {
      return { ok: false, error: `Structured-fields import failed: ${err instanceof Error ? err.message : 'unknown error'}` }
    }
  } else if (args.mode === 'structured') {
    // DOM walks via cheerio, one custom_html block per top-level section.
    // No AI call, no schema validation surprises, pixel-perfect output.
    try {
      const out = extractBlocksFromHtml(html, externalCss || undefined)
      title = out.title || title
      metaDescription = out.meta_description ?? null
      bodyBlocks = out.blocks as Array<Record<string, unknown>>
    } catch (err) {
      return { ok: false, error: `Structured import failed: ${err instanceof Error ? err.message : 'unknown error'}` }
    }
  } else {
    return { ok: false, error: `Unknown import mode: ${String(args.mode)}` }
  }

  try {
    const created = await payload.create({
      collection: 'pages',
      data: {
        site: args.siteId,
        title,
        slug,
        status: args.status || 'draft',
        template_key: 'custom',
        uses_shared_template: false,
        meta_title: null,
        meta_description: metaDescription,
        body_blocks: bodyBlocks,
      } as never,
      user: user as never,
      overrideAccess: false,
    })
    revalidatePath(`/admin/sites/${args.siteSlug}/pages`)
    return { ok: true, id: created.id as string | number }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'create failed' }
  }
}
