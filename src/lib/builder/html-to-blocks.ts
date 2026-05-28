// Structural-first HTML -> body_blocks extractor. Walks the document DOM with
// cheerio and emits one body_blocks entry per top-level structural section
// (<nav>, every <section>, <footer>, plus any large content <div> that looks
// like a section). Each emitted block is a `custom_html` block whose `html`
// field is the EXACT source markup for that section — so the imported page
// is pixel-perfect, and each section is individually editable in the builder.
//
// No AI calls. No schema validation surprises. Reliability is the point.

import { load, type CheerioAPI, type Cheerio } from 'cheerio'
import type { Element } from 'domhandler'

export type ImportedBlock = {
  blockType: 'custom_html'
  html: string
  // Human-readable section label persisted on the existing custom_html
  // `note` field ("For admin reference; not rendered."). The builder's
  // section list reads `note` as a summary fallback so the row shows
  // 'Navigation' / 'Hero' / 'FAQ' instead of every row reading 'Custom HTML'.
  note?: string
}

export type ImportResult = {
  title: string
  meta_description?: string | null
  blocks: ImportedBlock[]
}

// Pick the most descriptive label for a section so the builder's section
// list shows something useful instead of '<custom_html>'.
function labelFor($: CheerioAPI, node: Cheerio<Element>, tag: string): string {
  const id = node.attr('id')
  const heading = node
    .find('h1, h2, h3')
    .first()
    .text()
    .replace(/\s+/g, ' ')
    .trim()
  if (heading) return heading.slice(0, 80)
  if (tag === 'nav') return 'Navigation'
  if (tag === 'footer') return 'Footer'
  if (id) {
    // Convert kebab/snake/camel id -> Title Case
    const pretty = id
      .replace(/[-_]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase())
    if (pretty) return pretty
  }
  return tag.charAt(0).toUpperCase() + tag.slice(1)
}

// Anything with significant text or major DOM children counts as 'content-ish'
// — used for the fallback <div> sweep.
function isContentyDiv($: CheerioAPI, el: Element): boolean {
  const $el = $(el)
  const text = $el.text().replace(/\s+/g, ' ').trim()
  if (text.length < 80) return false
  // Avoid nested wrapper divs picked up multiple times.
  const parent = $el.parent()
  const parentTag = parent.get(0)?.type === 'tag' ? (parent.get(0) as Element).tagName : ''
  if (parentTag !== 'body') return false
  return true
}

export function extractBlocksFromHtml(
  html: string,
  externalCss?: string,
): ImportResult {
  const $ = load(html, { decodeEntities: false })

  const title =
    $('title').first().text().trim().slice(0, 120) ||
    $('h1').first().text().trim().slice(0, 120) ||
    'Imported page'

  const meta_description =
    $('meta[name="description"]').attr('content')?.trim().slice(0, 200) || null

  // Lift every <style> tag out of the head/body so we can ship it as a single
  // first block. Removing them from the per-section markup keeps the section
  // editor clean.
  const inlineStyles: string[] = []
  $('style').each((_, el) => {
    const css = $(el).html() ?? ''
    if (css.trim()) inlineStyles.push(css)
    $(el).remove()
  })

  // Strip scripts entirely — the public custom_html sanitiser would drop them
  // anyway, and they're full of brittle dom-id wiring like FAQ accordions
  // that we replace with no-op markup at editor level.
  $('script').remove()

  const css = [externalCss?.trim(), inlineStyles.join('\n\n').trim()]
    .filter(Boolean)
    .join('\n\n')

  const blocks: ImportedBlock[] = []

  // First block: shared stylesheet. Custom_html renderer keeps <style> tags.
  if (css) {
    blocks.push({
      blockType: 'custom_html',
      note: 'Page styles (CSS)',
      html: `<style>${css}</style>`,
    })
  }

  // Pull top-level structural sections in document order. Selector chosen
  // so we don't double-extract nested sections inside their parents.
  const seen = new Set<Element>()
  $('body > nav, body > section, body > footer, body > header, body > main > nav, body > main > section, body > main > footer, body > main > header').each((_, el) => {
    if (seen.has(el)) return
    seen.add(el)
    const $el = $(el)
    const tag = (el as Element).tagName
    const label = labelFor($, $el, tag)
    blocks.push({
      blockType: 'custom_html',
      note: label,
      html: ($.html($el) ?? '').trim(),
    })
  })

  // Fallback sweep: large content <div>s directly under <body> that weren't
  // covered. Catches HTML where the author used <div class="section"> instead
  // of semantic <section>.
  $('body > div').each((_, el) => {
    if (seen.has(el)) return
    if (!isContentyDiv($, el)) return
    seen.add(el)
    const $el = $(el)
    const label = labelFor($, $el, 'div')
    blocks.push({
      blockType: 'custom_html',
      note: label,
      html: ($.html($el) ?? '').trim(),
    })
  })

  // No structural matches at all → drop the entire body as one block so the
  // user at least gets the visual rendered.
  if (blocks.length === (css ? 1 : 0)) {
    const bodyHtml = $('body').html()?.trim()
    if (bodyHtml) {
      blocks.push({
        blockType: 'custom_html',
        note: 'Imported content',
        html: bodyHtml,
      })
    }
  }

  return { title, meta_description, blocks }
}
