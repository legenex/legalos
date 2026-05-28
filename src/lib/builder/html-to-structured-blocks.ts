// Deterministic HTML -> structured body_blocks extractor. Walks the DOM with
// cheerio (same as html-to-blocks.ts) but instead of dumping each section as
// raw custom_html, runs a chain of detectors that map known section shapes
// to proper body_blocks types (hero, faq, services_grid, etc.) — so the user
// can edit field-by-field on the right side of the builder instead of
// editing raw HTML.
//
// No AI calls. Each detector is a pure cheerio query that returns either a
// structured block or null. The first one that matches wins. Anything that
// matches nothing falls back to custom_html, preserving its raw markup.
//
// Two trade-offs vs the raw structured-copy mode worth knowing:
//   1. Visual fidelity may change. Structured blocks render via LegalOS's
//      own block components, which use their own class names — the user's
//      uploaded CSS may not style them. The user's CSS is still shipped as
//      a custom_html first-block so brand colors / fonts / generic
//      element styles still apply.
//   2. We can't always perfectly identify intent — a "card grid" might be
//      services, testimonials, or cards. We pick by structural cues (does
//      each card have a star icon? a numbered label? an icon-only heading?).

import { load, type Cheerio, type CheerioAPI } from 'cheerio'
import type { Element } from 'domhandler'

type Block = Record<string, unknown> & { blockType: string; note?: string }

type Detector = ($: CheerioAPI, $el: Cheerio<Element>, tag: string) => Block | null

const cleanText = (s: string | undefined | null): string =>
  (s ?? '')
    .replace(/\s+/g, ' ')
    .trim()

const hrefFor = (el: Element | undefined): string => {
  if (!el) return ''
  return (el as Element).attribs?.href ?? ''
}

// Strip wrapping <section>...</section> so the section's inner content is
// what we render via the structured block. Used by fallbacks that still
// want to keep the raw HTML.
const innerHtml = ($: CheerioAPI, $el: Cheerio<Element>): string =>
  ($el.html() ?? '').trim()

// Get the most useful summary label for the section list row, mirroring
// html-to-blocks.ts so labels stay consistent across modes.
const labelFor = ($: CheerioAPI, $el: Cheerio<Element>, tag: string): string => {
  const id = $el.attr('id')
  const heading = cleanText($el.find('h1, h2, h3').first().text())
  if (heading) return heading.slice(0, 80)
  if (tag === 'nav') return 'Navigation'
  if (tag === 'footer') return 'Footer'
  if (id) {
    const pretty = id
      .replace(/[-_]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase())
    if (pretty) return pretty
  }
  return tag.charAt(0).toUpperCase() + tag.slice(1)
}

// ----------------------------------------------------------------------------
// Detectors — order matters: most specific first.
// ----------------------------------------------------------------------------

const detectNavHeader: Detector = ($, $el, tag) => {
  // A <nav> element, OR any section with `nav` / `navbar` in its class.
  const isNav =
    tag === 'nav' ||
    /\b(navbar|nav|site-?nav|topbar|header-?nav)\b/i.test($el.attr('class') ?? '')
  if (!isNav) return null
  // Links: anchors that look like menu items (skip the CTA, skip raw icon-only).
  const links: Array<{ label: string; href: string }> = []
  let ctaLabel = ''
  let ctaHref = ''
  let logoUrl = ''
  $el.find('img').first().each((_, img) => {
    logoUrl = (img as Element).attribs?.src ?? ''
  })
  $el.find('a').each((_, a) => {
    const $a = $($el).find(a).first()
    const text = cleanText($a.text())
    const href = hrefFor(a as Element)
    if (!text || !href) return
    const cls = (a as Element).attribs?.class ?? ''
    const isCta = /\b(btn|button|cta|nav-cta|primary)\b/i.test(cls)
    if (isCta && !ctaLabel) {
      ctaLabel = text
      ctaHref = href
    } else {
      links.push({ label: text, href })
    }
  })
  if (links.length === 0 && !ctaLabel) return null
  return {
    blockType: 'nav_header',
    note: labelFor($, $el, tag),
    logo_url: logoUrl || undefined,
    links,
    cta_label: ctaLabel || undefined,
    cta_href: ctaHref || undefined,
    show_phone: false,
  }
}

const detectSiteFooter: Detector = ($, $el, tag) => {
  if (tag !== 'footer' && !/\bfooter\b/i.test($el.attr('class') ?? '')) return null
  // Column = any direct child div that contains a heading-ish text and a list
  // of links underneath. Keep this loose so it works on grid-style footers.
  const columns: Array<{ heading: string; links: Array<{ label: string; href: string }> }> = []
  $el
    .find('div, section')
    .filter((_, el) => {
      const cls = (el as Element).attribs?.class ?? ''
      return /\b(footer-?(col|column|links)|menu|column)\b/i.test(cls)
    })
    .each((_, col) => {
      const $col = $(col)
      const heading =
        cleanText($col.find('h1, h2, h3, h4, h5, .footer-col-title, .footer-heading').first().text()) || ''
      const links: Array<{ label: string; href: string }> = []
      $col.find('a').each((_, a) => {
        const label = cleanText($(a).text())
        const href = (a as Element).attribs?.href ?? ''
        if (label && href) links.push({ label, href })
      })
      if (heading || links.length > 0) columns.push({ heading, links })
    })
  // Legal disclaimer = anything in a .footer-bottom or last paragraph.
  const legalMd = cleanText(
    $el.find('.footer-bottom, .footer-legal, .footer-disclaimer').first().text() || '',
  )
  if (columns.length === 0 && !legalMd) return null
  return {
    blockType: 'site_footer',
    note: 'Footer',
    columns,
    legal_md: legalMd || undefined,
  }
}

const detectHero: Detector = ($, $el, tag) => {
  const cls = $el.attr('class') ?? ''
  const id = $el.attr('id') ?? ''
  const looksHero = /\bhero\b/i.test(cls) || /\b(home|hero|top|banner)\b/i.test(id)
  const h1 = $el.find('h1').first()
  if (!looksHero && h1.length === 0) return null
  const eyebrow =
    cleanText($el.find('.badge, .eyebrow, .pill, [class*="badge"]').first().text()) || undefined
  // Heading: full h1 text. If there's a gradient/accent span on a second line,
  // include it — the user can split later in the editor.
  const heading = cleanText(h1.text()) || cleanText($el.find('h1, h2').first().text())
  if (!heading) return null
  const sub =
    cleanText($el.find('p').first().text()) || undefined
  // CTAs: primary first, secondary second.
  let primaryLabel = ''
  let primaryHref = ''
  let secondaryLabel = ''
  let secondaryHref = ''
  $el.find('a.btn, a[class*="btn"], button.btn, a.cta, a[class*="cta"]').each((_, a) => {
    const $a = $(a)
    const text = cleanText($a.text())
    const href = (a as Element).attribs?.href ?? ''
    if (!text || !href) return
    if (!primaryLabel) {
      primaryLabel = text
      primaryHref = href
    } else if (!secondaryLabel) {
      secondaryLabel = text
      secondaryHref = href
    }
  })
  // Background image: the largest <img> in the section (usually .hero-img).
  let imageUrl = ''
  $el.find('img').each((_, img) => {
    const src = (img as Element).attribs?.src ?? ''
    if (src && !imageUrl) imageUrl = src
  })
  return {
    blockType: 'hero',
    note: 'Hero',
    eyebrow,
    heading,
    sub,
    primary_cta_label: primaryLabel || undefined,
    primary_cta_href: primaryHref || undefined,
    secondary_cta_label: secondaryLabel || undefined,
    secondary_cta_href: secondaryHref || undefined,
    image_url: imageUrl || undefined,
  }
}

const detectTrustStrip: Detector = ($, $el) => {
  const cls = $el.attr('class') ?? ''
  if (!/\b(trust-?(banner|strip)|wordmarks|features?-?bar)\b/i.test(cls)) return null
  const items: Array<{ value: string; label?: string }> = []
  $el.find('.trust-item, .badge, .pill, span').each((_, span) => {
    const text = cleanText($(span).text())
    if (text && text.length < 60) items.push({ value: text })
  })
  if (items.length < 2) return null
  return {
    blockType: 'trust_strip',
    note: 'Trust strip',
    items,
  }
}

const detectFaq: Detector = ($, $el) => {
  const cls = $el.attr('class') ?? ''
  const id = $el.attr('id') ?? ''
  const looksFaq = /\bfaq\b/i.test(cls) || /\bfaq\b/i.test(id)
  const items: Array<{ question: string; answer: string }> = []
  // Pattern A: .faq-item with .faq-q / .faq-a (the user's file).
  $el.find('.faq-item, [class*="faq-item"], [class*="accordion-item"]').each((_, item) => {
    const $item = $(item)
    const q = cleanText(
      $item.find('.faq-q, button, [class*="question"], .question, dt').first().text(),
    )
    const a = cleanText(
      $item.find('.faq-a, .answer, [class*="answer"], dd, p').first().text(),
    )
    if (q && a) items.push({ question: q, answer: a })
  })
  // Pattern B: native <details><summary>.
  if (items.length === 0) {
    $el.find('details').each((_, det) => {
      const $det = $(det)
      const q = cleanText($det.find('summary').first().text())
      const a = cleanText($det.clone().find('summary').remove().end().text())
      if (q && a) items.push({ question: q, answer: a })
    })
  }
  // Pattern C: dl with dt/dd pairs.
  if (items.length === 0) {
    $el.find('dt').each((_, dt) => {
      const $dt = $(dt)
      const q = cleanText($dt.text())
      const a = cleanText($dt.next('dd').text())
      if (q && a) items.push({ question: q, answer: a })
    })
  }
  if (!looksFaq && items.length < 2) return null
  if (items.length === 0) return null
  const heading = cleanText($el.find('h1, h2, h3').first().text()) || undefined
  return {
    blockType: 'faq',
    note: heading || 'FAQ',
    heading,
    items,
  }
}

const detectHowItWorks: Detector = ($, $el) => {
  const cls = $el.attr('class') ?? ''
  const heading = cleanText($el.find('h1, h2, h3').first().text())
  const looksSteps =
    /\b(steps?|how-?it-?works|process)\b/i.test(cls) ||
    /\b(step|process|how it works)\b/i.test(heading)
  // Each step has a label like "Step 1" / "Step 2" — use that as a structural cue.
  const cards = $el.find('.step-card, .step, [class*="step-"]').toArray()
  if (cards.length < 2 && !looksSteps) return null
  const steps: Array<{ title: string; description?: string }> = []
  const items = cards.length > 0 ? cards : $el.find('.usp-card, .card, .accident-card').toArray()
  for (const item of items) {
    const $item = $(item)
    const title = cleanText(
      $item.find('.step-title, h3, h4, .title, [class*="title"]').first().text(),
    )
    const description = cleanText(
      $item.find('.step-desc, p, .desc, [class*="desc"]').first().text(),
    )
    if (title) steps.push({ title, description: description || undefined })
  }
  if (steps.length < 2) return null
  return {
    blockType: 'how_it_works',
    note: heading || 'How it works',
    eyebrow: cleanText($el.find('.eyebrow, .step-label').first().text()) || undefined,
    heading,
    sub: cleanText($el.find('.section-sub, .sub, .lead').first().text()) || undefined,
    steps,
  }
}

const detectTestimonials: Detector = ($, $el) => {
  const cls = $el.attr('class') ?? ''
  const looksTest =
    /\b(testimonials?|reviews?|quotes|client-?stories|stars?)\b/i.test(cls) ||
    /\b(testimonials?|reviews?|client stories|what.*say)\b/i.test(
      cleanText($el.find('h1, h2, h3').first().text()),
    )
  const items: Array<{ quote: string; attribution?: string; avatar_url?: string }> = []
  $el.find('.review-card, .testimonial, [class*="review"], [class*="testimonial"]').each((_, card) => {
    const $c = $(card)
    const quote = cleanText(
      $c.find('.review-text, .quote, [class*="quote"], p.testimonial-text, blockquote, p').first().text(),
    )
    const attribution = cleanText(
      $c.find('.reviewer-name, .author, .attribution, [class*="name"]').first().text(),
    )
    const avatarSrc = $c.find('img').first().attr('src') || ''
    if (quote) items.push({ quote, attribution: attribution || undefined, avatar_url: avatarSrc || undefined })
  })
  if (items.length < 2) return null
  if (!looksTest && items.length < 3) return null
  return {
    blockType: 'testimonials',
    note: cleanText($el.find('h1, h2, h3').first().text()) || 'Testimonials',
    heading: cleanText($el.find('h1, h2, h3').first().text()) || undefined,
    items,
  }
}

const detectServicesGrid: Detector = ($, $el) => {
  const cls = $el.attr('class') ?? ''
  const id = $el.attr('id') ?? ''
  const heading = cleanText($el.find('h1, h2, h3').first().text())
  const looksServices =
    /\b(services?|accident-?(grid|types)|practice-?areas)\b/i.test(cls + ' ' + id) ||
    /\b(services|practice areas|specialties|what we do)\b/i.test(heading)
  const cardClass = '.accident-card, .service-card, [class*="service"], .card, [class*="card"]'
  const cards = $el.find(cardClass).toArray()
  if (cards.length < 2) return null
  const items: Array<{ title: string; description?: string; icon?: string }> = []
  for (const card of cards) {
    const $c = $(card)
    const title = cleanText(
      $c.find('h3, h4, .accident-title, .title, [class*="title"]').first().text(),
    )
    const description = cleanText(
      $c.find('.accident-desc, .desc, [class*="desc"], p').first().text(),
    )
    if (title) items.push({ title, description: description || undefined })
  }
  if (items.length < 2) return null
  if (!looksServices) return null
  return {
    blockType: 'services_grid',
    note: heading || 'Services',
    eyebrow: cleanText($el.find('.eyebrow').first().text()) || undefined,
    heading,
    sub: cleanText($el.find('.section-sub, .sub, .lead').first().text()) || undefined,
    items,
  }
}

const detectCards: Detector = ($, $el) => {
  // Generic card grid — used when none of the more specific detectors matched.
  const heading = cleanText($el.find('h1, h2, h3').first().text())
  const cards = $el.find('.usp-card, .card, [class*="card"]').toArray()
  if (cards.length < 2) return null
  const items: Array<{ title: string; body?: string }> = []
  for (const c of cards) {
    const $c = $(c)
    const title = cleanText(
      $c.find('h3, h4, .title, .usp-title, [class*="title"]').first().text(),
    )
    const body = cleanText(
      $c.find('p, .desc, .usp-desc, [class*="desc"]').first().text(),
    )
    if (title) items.push({ title, body: body || undefined })
  }
  if (items.length < 2) return null
  return {
    blockType: 'cards',
    note: heading || 'Cards',
    heading,
    items,
  }
}

const detectFinalCta: Detector = ($, $el) => {
  const cls = $el.attr('class') ?? ''
  if (!/\b(final-?cta|footer-?cta|closing-?cta|end-?cta)\b/i.test(cls)) return null
  const heading = cleanText($el.find('h1, h2, h3').first().text())
  const sub = cleanText($el.find('p').first().text())
  const cta = $el.find('a.btn, a.cta, a[class*="btn"]').first()
  if (!heading || cta.length === 0) return null
  return {
    blockType: 'final_cta',
    note: heading,
    heading,
    sub: sub || undefined,
    primary_cta_label: cleanText(cta.text()),
    primary_cta_href: cta.attr('href') ?? '#',
    show_phone: false,
  }
}

// Order matters — most specific first, then general fallbacks.
const DETECTORS: Detector[] = [
  detectNavHeader,
  detectSiteFooter,
  detectFinalCta, // checked before hero because final_cta sections often have h1/h2
  detectFaq,
  detectTrustStrip,
  detectTestimonials,
  detectHowItWorks,
  detectServicesGrid,
  detectHero, // before cards because cards detector is hungry
  detectCards,
]

// ----------------------------------------------------------------------------
// Main entry point — same shape as html-to-blocks.extractBlocksFromHtml so
// the import action can swap behind a mode flag.
// ----------------------------------------------------------------------------

export type ImportResult = {
  title: string
  meta_description: string | null
  blocks: Array<Record<string, unknown>>
}

export function extractStructuredFromHtml(html: string, externalCss?: string): ImportResult {
  const $ = load(html, { decodeEntities: false })

  const title =
    cleanText($('title').first().text()).slice(0, 120) ||
    cleanText($('h1').first().text()).slice(0, 120) ||
    'Imported page'

  const meta_description =
    cleanText($('meta[name="description"]').attr('content') ?? '').slice(0, 200) || null

  const inlineStyles: string[] = []
  $('style').each((_, el) => {
    const css = $(el).html() ?? ''
    if (css.trim()) inlineStyles.push(css)
    $(el).remove()
  })
  $('script').remove()

  const css = [externalCss?.trim(), inlineStyles.join('\n\n').trim()].filter(Boolean).join('\n\n')

  const blocks: Array<Record<string, unknown>> = []
  if (css) {
    blocks.push({
      blockType: 'custom_html',
      note: 'Page styles (CSS)',
      html: `<style>${css}</style>`,
    })
  }

  const seen = new Set<Element>()
  $('body > nav, body > section, body > footer, body > header, body > main > nav, body > main > section, body > main > footer, body > main > header').each(
    (_, el) => {
      if (seen.has(el)) return
      seen.add(el)
      const $el = $(el)
      const tag = (el as Element).tagName

      // Run detectors in order; first match wins.
      let block: Block | null = null
      for (const det of DETECTORS) {
        block = det($, $el, tag)
        if (block) break
      }

      if (block) {
        blocks.push(block as Record<string, unknown>)
      } else {
        // No structured match — keep as custom_html so the section still
        // renders correctly and the user can convert it manually later.
        blocks.push({
          blockType: 'custom_html',
          note: labelFor($, $el, tag),
          html: ($.html($el) ?? '').trim(),
        })
      }
    },
  )

  // Fallback content sweep: pick up content-heavy <div>s under body.
  $('body > div').each((_, el) => {
    if (seen.has(el)) return
    const $el = $(el)
    const text = cleanText($el.text())
    if (text.length < 80) return
    seen.add(el)
    let block: Block | null = null
    for (const det of DETECTORS) {
      block = det($, $el, 'div')
      if (block) break
    }
    if (block) {
      blocks.push(block as Record<string, unknown>)
    } else {
      blocks.push({
        blockType: 'custom_html',
        note: labelFor($, $el, 'div'),
        html: ($.html($el) ?? '').trim(),
      })
    }
  })

  // No matches at all — return the whole body as one block.
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
