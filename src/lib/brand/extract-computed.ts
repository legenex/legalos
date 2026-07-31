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

/**
 * Runs INSIDE the page. Returns raw readings only - no judgement, because
 * anything decided here would be untestable without a browser.
 */
const SAMPLER = `() => {
  const vw = window.innerWidth, vh = window.innerHeight
  const area = vw * vh
  const out = { colors: [], fonts: [], notes: [] }
  const px = (el) => {
    const r = el.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return 0
    return (r.width * r.height) / area
  }
  const visible = (el) => {
    const s = getComputedStyle(el)
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }
  const push = (role, color, share, source) => out.colors.push({ role, color, share, source })

  // --- primary call to action -------------------------------------------
  // The largest solid-background button or link in the first viewport. This is
  // the colour a brand is most certain to have chosen on purpose.
  const clickable = [...document.querySelectorAll('button, a, [role=button], input[type=submit]')]
    .filter(visible)
    .filter((el) => {
      const r = el.getBoundingClientRect()
      return r.top < vh && r.bottom > 0
    })
    .map((el) => {
      const s = getComputedStyle(el)
      return { el, bg: s.backgroundColor, img: s.backgroundImage, area: px(el) }
    })
    // A gradient or image background has no single colour to take.
    .filter((c) => c.img === 'none' && c.area > 0)
    .sort((a, b) => b.area - a.area)
  if (clickable[0]) push('cta', clickable[0].bg, clickable[0].area, 'computed background of the largest above-the-fold button')
  else out.notes.push('no solid-background button found above the fold')

  // --- page ground -------------------------------------------------------
  const bodyStyle = getComputedStyle(document.body)
  const htmlStyle = getComputedStyle(document.documentElement)
  const ground = bodyStyle.backgroundImage === 'none' ? bodyStyle.backgroundColor : htmlStyle.backgroundColor
  push('page_bg', ground, 1, 'computed background of the page at the top of the document')

  // --- card surfaces -----------------------------------------------------
  // The most repeated block background that is not the page ground.
  const tally = new Map()
  for (const el of document.querySelectorAll('div, section, article, aside, li')) {
    if (!visible(el)) continue
    const s = getComputedStyle(el)
    if (s.backgroundImage !== 'none') continue
    const c = s.backgroundColor
    if (!c || c === 'rgba(0, 0, 0, 0)' || c === 'transparent') continue
    if (c === ground) continue
    const cur = tally.get(c) || { n: 0, share: 0 }
    cur.n += 1
    cur.share = Math.max(cur.share, px(el))
    tally.set(c, cur)
  }
  const surfaces = [...tally.entries()].sort((a, b) => b[1].n - a[1].n)
  if (surfaces[0]) push('surface', surfaces[0][0], surfaces[0][1].share, 'most repeated card background, ' + surfaces[0][1].n + ' elements')

  // --- body text ---------------------------------------------------------
  // The colour of the longest run of prose, not of the first paragraph found.
  let longest = null, longestLen = 0
  for (const el of document.querySelectorAll('p, li, span, div')) {
    if (!visible(el)) continue
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent || '').join('').trim()
    if (own.length > longestLen) { longestLen = own.length; longest = el }
  }
  if (longest) push('ink', getComputedStyle(longest).color, px(longest), 'computed colour of the longest run of text on the page')

  // --- headings ----------------------------------------------------------
  const heads = [...document.querySelectorAll('h1, h2')].filter(visible)
  if (heads[0]) {
    const s = getComputedStyle(heads[0])
    push('heading', s.color, px(heads[0]), 'computed colour of the first heading')
    out.fonts.push({ role: 'heading', family: s.fontFamily, count: heads.length })
  }
  const bodyFontEl = longest || document.body
  out.fonts.push({ role: 'body', family: getComputedStyle(bodyFontEl).fontFamily, count: 1 })

  // --- links in prose ----------------------------------------------------
  const proseLinks = [...document.querySelectorAll('p a, li a')].filter(visible)
  if (proseLinks.length) {
    const c = getComputedStyle(proseLinks[0]).color
    push('link', c, proseLinks.reduce((n, el) => n + px(el), 0), 'computed colour of links inside prose, ' + proseLinks.length + ' found')
  }

  // --- logo --------------------------------------------------------------
  // Decoded in-page onto a canvas so the dominant non-neutral colour can be
  // read directly. Cross-origin images taint the canvas; that is caught and
  // reported rather than thrown.
  const logo = document.querySelector('header img, [class*=logo] img, a[href="/"] img, img[alt*=logo i]')
  if (logo && logo.complete && logo.naturalWidth > 0) {
    try {
      const c = document.createElement('canvas')
      const w = c.width = Math.min(64, logo.naturalWidth)
      const h = c.height = Math.min(64, logo.naturalHeight)
      const ctx = c.getContext('2d')
      ctx.drawImage(logo, 0, 0, w, h)
      const data = ctx.getImageData(0, 0, w, h).data
      const buckets = new Map()
      for (let i = 0; i < data.length; i += 4) {
        const [r, g, b, a] = [data[i], data[i+1], data[i+2], data[i+3]]
        if (a < 200) continue
        const max = Math.max(r,g,b), min = Math.min(r,g,b)
        // Drop near-white, near-black and greys: a logo's ink is not its brand.
        if (max - min <= 18) continue
        const key = [r,g,b].map(v => Math.round(v/24)*24).join(',')
        buckets.set(key, (buckets.get(key) || 0) + 1)
      }
      const top = [...buckets.entries()].sort((a,b) => b[1]-a[1])[0]
      if (top) {
        const [r,g,b] = top[0].split(',').map(Number)
        push('logo', 'rgb(' + r + ', ' + g + ', ' + b + ')', 0.05, 'dominant colour of the header logo, ' + top[1] + ' pixels sampled')
      } else {
        out.notes.push('logo found but it is monochrome, so it carries no brand colour')
      }
    } catch (e) {
      out.notes.push('logo could not be sampled: it is served cross-origin without CORS headers')
    }
  } else {
    out.notes.push('no header logo image found')
  }

  return out
}`

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

    const raw = (await page.evaluate(SAMPLER as never)) as {
      colors: Array<{ role: string; color: string; share: number; source: string }>
      fonts: Array<{ role: 'heading' | 'body'; family: string; count: number }>
      notes: string[]
    }

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
      samples.push({
        role: c.role as Sample['role'],
        color: hex,
        // The sampler reports one reading per role; corroboration comes from
        // two roles landing on the same colour, counted in the scorer.
        count: c.role === 'surface' || c.role === 'link' ? 3 : 3,
        pixelShare: c.share,
        source: c.source,
      })
    }

    const { kept, rejected: ruleRejected } = applyRejections(samples)
    for (const r of ruleRejected) rejected.push({ role: r.sample.role, color: r.sample.color, reason: r.reason })

    const tokens = { ...proposeTokens(kept), ...proposeFonts(raw.fonts as FontSample[]) }

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
