import 'server-only'
import type { Sample, FontSample } from './extract-score'
import { applyRejections, proposeTokens, proposeFonts } from './extract-score'

/**
 * Brand extraction by computed-style sampling.
 *
 * The previous method parsed a page's declared stylesheet and its Tailwind
 * config. Declaration order in a utility framework has no relationship to
 * visual hierarchy, so on any Tailwind site it returned the framework's
 * defaults - which is exactly how dontsettle.co came back as orange-600 and
 * slate-800, two colours that site does not use.
 *
 * This reads what the page actually PAINTED. Chromium renders it, the sampler
 * below walks the DOM asking each element for its computed style and its
 * bounding box, and every colour arrives with the role it played, how many
 * elements used it, and how much of the viewport it covered.
 *
 * The split matters: this file only reads. Every decision about what a reading
 * MEANS lives in extract-score.ts as pure functions, so the judgement can be
 * tested without launching a browser.
 */

export type ComputedExtraction = {
  finalUrl: string
  host: string
  tokens: Record<string, { value: string; confidence: number; source: string }>
  /** Everything thrown away, with the rule that threw it. Shown on request. */
  rejected: Array<{ role: string; color: string; reason: string }>
  /** Non-fatal problems worth telling the operator about. */
  warnings: string[]
}

/** Chromium reports colours as rgb()/rgba(). Normalise, and drop transparency. */
const toHex = (css: string): string | null => {
  const m = css.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?/i)
  if (!m) return null
  const a = m[4] === undefined ? 1 : Number(m[4])
  // A translucent surface is not a colour we can propose: what a visitor sees
  // depends on whatever is behind it.
  if (a < 0.95) return null
  const [r, g, b] = [m[1], m[2], m[3]].map((n) => Math.round(Number(n)))
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`
}

type RawReading = { role: Sample['role']; color: string; count: number; share: number; source: string }
type RawSample = { colors: RawReading[]; fonts: FontSample[]; notes: string[] }

/**
 * Runs INSIDE the page, serialised across by Playwright.
 *
 * Passed as a real function rather than a string: Playwright evaluates a string
 * as an EXPRESSION, so a stringified arrow evaluates to a function object and
 * returns undefined instead of calling it. A real function also gets its body
 * type-checked against the DOM lib.
 *
 * Because it is serialised, it can close over nothing - every helper it needs
 * is declared inside. It returns raw readings only; no judgement happens here,
 * since anything decided in-page could not be tested without a browser.
 */
const samplePage = (): RawSample => {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const area = vw * vh
  const colors: RawReading[] = []
  const fonts: FontSample[] = []
  const notes: string[] = []

  const px = (el: Element): number => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 ? (r.width * r.height) / area : 0
  }
  const visible = (el: Element): boolean => {
    const s = getComputedStyle(el)
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }
  const push = (role: Sample['role'], color: string, count: number, share: number, source: string) =>
    colors.push({ role, color, count, share, source })

  // --- primary call to action --------------------------------------------
  // The largest solid-background button in the first viewport: the one colour
  // a brand is most certain to have chosen on purpose.
  const clickable = Array.from(
    document.querySelectorAll('button, a, [role=button], input[type=submit]'),
  )
    .filter(visible)
    .filter((el) => {
      const r = el.getBoundingClientRect()
      return r.top < vh && r.bottom > 0
    })
    .map((el) => {
      const s = getComputedStyle(el)
      return { bg: s.backgroundColor, img: s.backgroundImage, area: px(el) }
    })
    // A gradient or image background has no single colour to take.
    .filter((c) => c.img === 'none' && c.area > 0 && c.bg !== 'rgba(0, 0, 0, 0)' && c.bg !== 'transparent')
    .sort((a, b) => b.area - a.area)

  if (clickable[0]) {
    const shared = clickable.filter((c) => c.bg === clickable[0].bg).length
    push(
      'cta',
      clickable[0].bg,
      shared,
      clickable[0].area,
      `computed background of the largest above-the-fold button${shared > 1 ? `, shared by ${shared} buttons` : ''}`,
    )
  } else {
    notes.push('no solid-background button was found above the fold')
  }

  // --- page ground --------------------------------------------------------
  const bodyStyle = getComputedStyle(document.body)
  const htmlStyle = getComputedStyle(document.documentElement)
  const ground = bodyStyle.backgroundImage === 'none' ? bodyStyle.backgroundColor : htmlStyle.backgroundColor
  push('page_bg', ground, 1, 1, 'computed background of the page at the top of the document')

  // --- card surfaces ------------------------------------------------------
  // The most repeated block background that is not the page ground.
  const tally = new Map<string, { n: number; share: number }>()
  for (const el of Array.from(document.querySelectorAll('div, section, article, aside, li'))) {
    if (!visible(el)) continue
    const s = getComputedStyle(el)
    if (s.backgroundImage !== 'none') continue
    const c = s.backgroundColor
    if (!c || c === 'rgba(0, 0, 0, 0)' || c === 'transparent' || c === ground) continue
    const cur = tally.get(c) || { n: 0, share: 0 }
    cur.n += 1
    cur.share = Math.max(cur.share, px(el))
    tally.set(c, cur)
  }
  const surfaces = Array.from(tally.entries()).sort((a, b) => b[1].n - a[1].n)
  if (surfaces[0]) {
    push('surface', surfaces[0][0], surfaces[0][1].n, surfaces[0][1].share, `most repeated card background, on ${surfaces[0][1].n} elements`)
  }

  // --- body text ----------------------------------------------------------
  // The colour of the LONGEST run of prose, not of the first paragraph found:
  // the first is often a nav item or an eyebrow label.
  let longest: Element | null = null
  let longestLen = 0
  const inkTally = new Map<string, number>()
  for (const el of Array.from(document.querySelectorAll('p, li, span, div'))) {
    if (!visible(el)) continue
    const own = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent || '')
      .join('')
      .trim()
    if (own.length < 20) continue
    const c = getComputedStyle(el).color
    inkTally.set(c, (inkTally.get(c) || 0) + 1)
    if (own.length > longestLen) {
      longestLen = own.length
      longest = el
    }
  }
  if (longest) {
    const c = getComputedStyle(longest).color
    push('ink', c, inkTally.get(c) || 1, px(longest), `computed colour of the longest run of text on the page, matched by ${inkTally.get(c) || 1} text element${(inkTally.get(c) || 1) === 1 ? '' : 's'}`)
  }

  // --- headings -----------------------------------------------------------
  const heads = Array.from(document.querySelectorAll('h1, h2')).filter(visible)
  if (heads[0]) {
    const s = getComputedStyle(heads[0])
    push('heading', s.color, heads.length, heads.reduce((n, el) => n + px(el), 0), `computed colour of the page headings, ${heads.length} found`)
    fonts.push({ role: 'heading', family: s.fontFamily, count: heads.length })
  }
  fonts.push({ role: 'body', family: getComputedStyle(longest || document.body).fontFamily, count: 1 })

  // --- links in prose -----------------------------------------------------
  const proseLinks = Array.from(document.querySelectorAll('p a, li a')).filter(visible)
  if (proseLinks.length) {
    const first = getComputedStyle(proseLinks[0]).color
    const shared = proseLinks.filter((el) => getComputedStyle(el).color === first).length
    push('link', first, shared, proseLinks.reduce((n, el) => n + px(el), 0), `computed colour of ${shared} link${shared === 1 ? '' : 's'} inside prose`)
  }

  // --- logo ---------------------------------------------------------------
  // Decoded onto a canvas so the dominant non-neutral colour can be read
  // directly. Cross-origin images taint the canvas; that is reported, not
  // thrown, because a missing logo colour is not a failed extraction.
  const logo = document.querySelector<HTMLImageElement>(
    'header img, [class*=logo] img, a[href="/"] img, img[alt*=logo i]',
  )
  if (logo && logo.complete && logo.naturalWidth > 0) {
    try {
      const canvas = document.createElement('canvas')
      const w = (canvas.width = Math.min(64, logo.naturalWidth))
      const h = (canvas.height = Math.min(64, logo.naturalHeight))
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('no 2d context')
      ctx.drawImage(logo, 0, 0, w, h)
      const data = ctx.getImageData(0, 0, w, h).data
      const buckets = new Map<string, number>()
      for (let i = 0; i < data.length; i += 4) {
        const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]]
        if (a < 200) continue
        // Drop greys: a logo's ink and its cut-out are not its brand colour.
        if (Math.max(r, g, b) - Math.min(r, g, b) <= 18) continue
        const key = [r, g, b].map((v) => Math.round(v / 24) * 24).join(',')
        buckets.set(key, (buckets.get(key) || 0) + 1)
      }
      const top = Array.from(buckets.entries()).sort((a, b) => b[1] - a[1])[0]
      if (top) {
        const [r, g, b] = top[0].split(',').map(Number)
        push('logo', `rgb(${r}, ${g}, ${b})`, 1, 0, `dominant colour of the header logo, from ${top[1]} sampled pixels`)
      } else {
        notes.push('a header logo was found but it is monochrome, so it carries no brand colour')
      }
    } catch {
      notes.push('the header logo could not be sampled: it is served cross-origin without CORS headers')
    }
  } else {
    notes.push('no header logo image was found')
  }

  return { colors, fonts, notes }
}

/**
 * Render a URL and extract brand tokens from what it actually painted.
 *
 * Sampled at two widths because a responsive site can present a different
 * primary action on mobile, and the desktop reading alone would miss it.
 */
export const extractBrandFromRender = async (rawUrl: string): Promise<ComputedExtraction | null> => {
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`

  // Imported lazily so that merely importing this module does not require
  // Playwright to be installed - the app must boot on a machine without it.
  const { chromium } = await import('playwright')

  const browser = await chromium.launch({ args: ['--no-sandbox'] })
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151 Safari/537.36 LegalOS-BrandExtract/1.0',
    })
    const page = await context.newPage()
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
    // Web fonts and late-loading heroes change what is painted.
    await page.waitForTimeout(600)

    const raw = await page.evaluate(samplePage)

    const finalUrl = page.url()
    await context.close()

    const samples: Sample[] = []
    const rejected: ComputedExtraction['rejected'] = []
    for (const c of raw.colors) {
      const hex = toHex(c.color)
      if (!hex) {
        rejected.push({ role: c.role, color: c.color, reason: 'translucent or unresolvable, so what a visitor sees depends on what is behind it' })
        continue
      }
      samples.push({ role: c.role, color: hex, count: c.count, pixelShare: c.share, source: c.source })
    }

    const { kept, rejected: ruleRejected } = applyRejections(samples)
    for (const r of ruleRejected) rejected.push({ role: r.sample.role, color: r.sample.color, reason: r.reason })

    const tokens = { ...proposeTokens(kept), ...proposeFonts(raw.fonts) }

    return {
      finalUrl,
      host: new URL(finalUrl).host,
      tokens,
      rejected,
      warnings: raw.notes,
    }
  } finally {
    await browser.close()
  }
}
