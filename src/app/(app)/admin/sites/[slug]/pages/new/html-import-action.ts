'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'
import { invokeLLM } from '@/lib/ai/invoke'
import { BlockSchema } from '@/lib/builder/block-schemas'

// Import a Page from raw HTML (and optional CSS) the user has on disk.
// Unlike the URL clone path this works for SPAs, paywalled / authenticated
// pages, and brand-archive HTML that doesn't live on a public URL.
//
// Two modes:
//   - 'parse'  → AI maps visible sections to editable body_blocks and we
//                stash the CSS in a custom_html <style> block so the page
//                still looks right.
//   - 'raw'    → entire HTML + CSS goes into one custom_html block. Pixel-
//                perfect, but only editable as raw HTML.

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

// Extract every <style>…</style> block from an HTML string and return both
// the styles concatenated and the HTML with those <style> tags removed.
const extractStyles = (html: string): { styles: string; body: string } => {
  const styles: string[] = []
  const body = html.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_, css) => {
    styles.push(String(css).trim())
    return ''
  })
  return { styles: styles.join('\n\n'), body }
}

// 30 KB is plenty of structure for the model to map sections from — and
// keeps round-trip well under Plesk's 60 s proxy timeout on Haiku. Larger
// pages get trimmed at end-of-content rather than mid-tag for slightly
// cleaner truncation.
const stripForLLM = (html: string, maxChars = 30_000): string => {
  let s = html
  s = s.replace(/<script[\s\S]*?<\/script>/gi, '')
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
  s = s.replace(/<!--[\s\S]*?-->/g, '')
  s = s.replace(/<svg[\s\S]*?<\/svg>/gi, '')
  s = s.replace(/\s+/g, ' ').trim()
  if (s.length > maxChars) {
    const cut = s.lastIndexOf('>', maxChars)
    s = s.slice(0, cut > 0 ? cut + 1 : maxChars) + ' …[truncated]'
  }
  return s
}

const IMPORT_SCHEMA = z.object({
  title: z.string().describe('Short page title suitable for a browser tab (e.g. "Home", "Services", "About").'),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  body_blocks: z.array(BlockSchema).describe('Page sections, top to bottom, mapped to the closest matching block type.'),
})

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
  mode: 'parse' | 'raw'
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

  const externalCss = decodeDataUrl(args.cssDataUrl).trim()
  const { styles: inlineCss, body: htmlWithoutStyles } = extractStyles(html)
  // Anything from the uploaded .css file gets prepended to the inline rules
  // so per-element <style> still wins via the cascade.
  const allCss = [externalCss, inlineCss].filter(Boolean).join('\n\n')

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
  let metaTitle: string | null = null
  let metaDescription: string | null = null
  let bodyBlocks: Array<Record<string, unknown>> = []

  if (args.mode === 'raw') {
    // Whole document goes in one block. We wrap the CSS in a style tag so the
    // public BlockRenderer's custom_html sanitiser leaves it intact (the
    // sanitiser strips <script> and on*= handlers but leaves style/CSS).
    const combined = `${allCss ? `<style>${allCss}</style>` : ''}${htmlWithoutStyles}`
    // Try to lift a title out of the head as a courtesy.
    const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(html)
    if (titleMatch) title = String(titleMatch[1]).trim().slice(0, 120) || title
    const descMatch =
      /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i.exec(html) ||
      /<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i.exec(html)
    if (descMatch) metaDescription = String(descMatch[1]).trim().slice(0, 200) || null
    bodyBlocks = [{ blockType: 'custom_html', html: combined }]
  } else {
    // mode === 'parse'
    const cleaned = stripForLLM(htmlWithoutStyles)
    try {
      // Haiku is 5-10x faster than Sonnet for structured-extraction work
      // like this and keeps us well under Plesk's 60s proxy timeout. The
      // schema constraint does all the heavy lifting — the model only
      // picks block types and copies text, no creative writing.
      const cloned = await invokeLLM({
        schema: IMPORT_SCHEMA,
        schemaName: 'imported_page',
        model: 'claude-haiku-4-5-20251001',
        system: [
          `Convert an uploaded HTML page into a list of body_blocks for a LegalOS Page.`,
          `Identify each visible section top-to-bottom, emit ONE block per section using the closest matching blockType.`,
          ``,
          `Mapping cheat-sheet:`,
          `nav bar -> nav_header. hero / above-the-fold -> hero. trust badges row -> trust_strip.`,
          `3-4 up services -> services_grid. numbered steps -> how_it_works. testimonials -> testimonials.`,
          `settlement amounts -> recent_wins. FAQ -> faq. closing CTA -> final_cta. generic cards -> cards.`,
          `long-form copy -> prose. bulleted lists -> bullet_list. footer -> site_footer.`,
          ``,
          `Preserve source copy verbatim. Do not invent stats / amounts / testimonials. No em-dashes, no apology blocks, no marketing fluff.`,
        ].join('\n'),
        user: `Uploaded HTML (stripped):\n${cleaned}`,
        maxTokens: 4096,
        enforceNoBannedVocab: true,
      })
      title = cloned.title || title
      metaTitle = cloned.meta_title || null
      metaDescription = cloned.meta_description || null
      bodyBlocks = cloned.body_blocks
      // Prepend a custom_html style block so the page still LOOKS like the
      // import. Public custom_html renderer keeps <style>; sanitises <script>.
      if (allCss) {
        bodyBlocks = [{ blockType: 'custom_html', html: `<style>${allCss}</style>` }, ...bodyBlocks]
      }
    } catch (err) {
      return { ok: false, error: `AI parse failed: ${err instanceof Error ? err.message : 'unknown error'}` }
    }
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
        meta_title: metaTitle,
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
