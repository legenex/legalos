// Brand LOGO + favicon extraction. Ranks every real candidate from a page
// (header img, inline svg, og:image, link icons, manifest icons, CSS logo
// backgrounds) or a GitHub repo (probed public/ assets, README refs),
// HEAD-validates that each is actually an image (rejecting the "200 but it's
// the homepage" trap), and never invents a URL — the core accuracy fix.

import type { UrlBundle, GithubBundle } from './fetch-bundle'
import { headOk, resolveUrl, extractFilename } from './fetch-bundle'

export type ExtractedLogos = {
  logoUrl?: string
  logoUrlDark?: string
  faviconUrl?: string
}

type Cand = { url: string; priority: number; filename: string; isData?: boolean }

const isDarkName = (f: string) => /dark|black|night|navy|white|light|inverse|reverse/i.test(f)
const isDarkVariant = (f: string) => /dark|black|night|navy|inverse|reverse/i.test(f)
const svgRank = (ct: string, f: string) =>
  /svg/i.test(ct) || /\.svg/i.test(f) ? 0 : /\.png|\.webp/i.test(f) ? 1 : /\.ico/i.test(f) ? 3 : 2

export async function extractLogosFromUrl(bundle: UrlBundle): Promise<ExtractedLogos> {
  const { $, finalUrl, manifest } = bundle
  const cands: Cand[] = []
  const push = (href: string | undefined | null, priority: number) => {
    const abs = resolveUrl(href, finalUrl)
    if (!abs) return
    cands.push({ url: abs, priority, filename: extractFilename(abs), isData: abs.startsWith('data:') })
  }

  // 1. header/nav <img> with logo-ish signals.
  $('header img, nav img, .navbar img, .header img, [class*="logo"] img, a[href="/"] img').each((_, el) => {
    const $el = $(el)
    const alt = ($el.attr('alt') || '').toLowerCase()
    const cls = ($el.attr('class') || '').toLowerCase()
    const id = ($el.attr('id') || '').toLowerCase()
    const src = $el.attr('src') || $el.attr('data-src') || ''
    const sig = `${alt} ${cls} ${id} ${src}`.toLowerCase()
    push(src, /logo|brand|mark/.test(sig) ? 2 : 4)
  })

  // 2. inline <svg> in header/nav or with logo class → serialize to data URI.
  $('header svg, nav svg, [class*="logo"] svg, a[href="/"] svg').each((_, el) => {
    if (cands.some((c) => c.isData)) return // one inline svg is enough
    try {
      const svg = $.html(el)
      if (svg && svg.length < 40_000) {
        const data = `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`
        cands.push({ url: data, priority: 2, filename: 'inline.svg', isData: true })
      }
    } catch {
      /* ignore */
    }
  })

  // 3. og:image / twitter:image.
  push($('meta[property="og:image"]').attr('content'), 5)
  push($('meta[name="twitter:image"]').attr('content'), 5)

  // 4. link icons (favicon family).
  $('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="shortcut icon"], link[rel="mask-icon"]').each((_, el) => {
    push($(el).attr('href'), 6)
  })

  // 5. manifest icons (prefer larger).
  if (manifest && Array.isArray((manifest as { icons?: unknown[] }).icons)) {
    const icons = (manifest as { icons: { src?: string; sizes?: string }[] }).icons
      .slice()
      .sort((a, b) => (parseInt(b.sizes || '0') || 0) - (parseInt(a.sizes || '0') || 0))
    for (const ic of icons.slice(0, 2)) push(ic.src, 5)
  }

  return rankValidateSelect(cands)
}

export async function extractLogosFromGithub(bundle: GithubBundle): Promise<ExtractedLogos> {
  const cands: Cand[] = bundle.assetUrls.map((a) => ({
    url: a.url,
    filename: a.filename,
    priority: /favicon/i.test(a.filename) ? 6 : /og/i.test(a.filename) ? 5 : 2,
  }))

  // README image refs as a fallback.
  const readme = bundle.files.readme
  if (readme) {
    for (const m of readme.matchAll(/!\[[^\]]*\]\(([^)]+)\)|<img[^>]+src=["']([^"']+)["']/gi)) {
      const ref = m[1] || m[2]
      if (!ref || !/logo|brand/i.test(ref)) continue
      const abs = /^https?:/i.test(ref) ? ref : `${bundle.baseRaw}/${ref.replace(/^\.?\//, '')}`
      cands.push({ url: abs, filename: extractFilename(abs), priority: 4 })
    }
  }

  return rankValidateSelect(cands)
}

async function rankValidateSelect(cands: Cand[]): Promise<ExtractedLogos> {
  // De-dupe by url.
  const seen = new Set<string>()
  const unique = cands.filter((c) => (seen.has(c.url) ? false : (seen.add(c.url), true)))

  // Validate (HEAD) non-data candidates in parallel; data URIs are auto-valid.
  const validated = (
    await Promise.all(
      unique.map(async (c) => {
        if (c.isData) return { ...c, contentType: 'image/svg+xml', valid: true }
        const r = await headOk(c.url, 2500)
        const valid = r.ok && /image|svg/i.test(r.contentType) && !/text\/html/i.test(r.contentType)
        return { ...c, contentType: r.contentType, valid }
      }),
    )
  ).filter((c) => c.valid)

  // Rank: priority asc, then svg>png>jpg>ico.
  validated.sort((a, b) => a.priority - b.priority || svgRank(a.contentType, a.filename) - svgRank(b.contentType, b.filename))

  const out: ExtractedLogos = {}
  const faviconCands = validated.filter((c) => c.priority >= 6 || /favicon|icon/i.test(c.filename))
  const logoCands = validated.filter((c) => c.priority < 6 && !/favicon/i.test(c.filename))

  out.faviconUrl = faviconCands[0]?.url || validated.find((c) => /\.ico|favicon/i.test(c.filename))?.url
  // Primary logo = best non-dark-variant logo candidate (a dark-named asset is
  // the "for dark backgrounds" version, not the default).
  out.logoUrl = (logoCands.find((c) => !isDarkVariant(c.filename)) || logoCands[0])?.url
  // Dark-bg variant: an explicit dark/white-named asset, else reuse the logo.
  const darkVariant = logoCands.find((c) => isDarkName(c.filename) && c.url !== out.logoUrl)
  out.logoUrlDark = darkVariant?.url || out.logoUrl
  if (!out.logoUrl && out.faviconUrl) out.logoUrl = out.faviconUrl // last resort

  return out
}
