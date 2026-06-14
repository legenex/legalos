// Brand COPY + legal extraction: the real name, tagline, phone, support email,
// copyright line, and links to privacy / terms pages. Everything here is
// scraped fact — the LLM only fills what we genuinely could not find.

import type { UrlBundle, GithubBundle } from './fetch-bundle'
import { resolveUrl } from './fetch-bundle'

export type ExtractedCopy = {
  name?: string
  displayName?: string
  tagline?: string
  callNumber?: string
  email?: string
  copyright?: string
  privacyUrl?: string
  termsUrl?: string
  domains?: string[]
}

const titleCaseHost = (host: string): string => {
  const core = host.replace(/^www\./i, '').split('.')[0]
  return core
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

// US phone: matches (555) 123-4567, 555-123-4567, +1 555 123 4567, etc.
const PHONE_RE = /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/

function pickPhone(text: string): string | undefined {
  // Prefer tel: links handled by caller; this is the text sweep.
  const m = PHONE_RE.exec(text)
  if (!m) return undefined
  const digits = m[0].replace(/[^\d]/g, '')
  // Reject obvious non-phones (zip+something, 1900 dates, etc.).
  if (digits.length < 10 || digits.length > 11) return undefined
  return m[0].trim()
}

export function extractCopyFromUrl(bundle: UrlBundle): ExtractedCopy {
  const { $, finalUrl, host } = bundle
  const out: ExtractedCopy = { domains: host ? [host.replace(/^www\./i, '')] : [] }

  // Name: og:site_name > <title> brand segment > application-name > host.
  const ogSite = $('meta[property="og:site_name"]').attr('content')?.trim()
  const appName = $('meta[name="application-name"]').attr('content')?.trim()
  const title = $('title').first().text().trim()
  const titleBrand = title ? title.split(/[|\-–—·:]/).map((s) => s.trim()).filter(Boolean).pop() : undefined
  out.name = ogSite || appName || (titleBrand && titleBrand.length <= 40 ? titleBrand : undefined) || (host ? titleCaseHost(host) : undefined)
  out.displayName = ogSite || out.name

  // Tagline: og:description / meta description (trimmed to one sentence-ish).
  const desc = ($('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '').trim()
  if (desc) out.tagline = desc.length > 140 ? desc.slice(0, 137).trimEnd() + '…' : desc

  // Phone: tel: link first (authoritative), then a header/footer text sweep.
  const telHref = $('a[href^="tel:"]').first().attr('href')
  if (telHref) {
    const num = telHref.replace(/^tel:/i, '').trim()
    if (num) out.callNumber = num
  }
  if (!out.callNumber) {
    const headerTxt = $('header').text() + '\n' + $('footer').text()
    out.callNumber = pickPhone(headerTxt) || pickPhone($('body').text())
  }

  // Email: mailto first, then text sweep.
  const mailHref = $('a[href^="mailto:"]').first().attr('href')
  if (mailHref) out.email = mailHref.replace(/^mailto:/i, '').split('?')[0].trim()
  if (!out.email) {
    const m = EMAIL_RE.exec($('footer').text() || $('body').text())
    if (m && !/example\.|sentry|wixpress|\.png|\.jpg/i.test(m[0])) out.email = m[0]
  }

  // Copyright line from footer.
  const footerText = $('footer').text().replace(/\s+/g, ' ').trim()
  const copy = /(©|copyright|\(c\))\s*\d{0,4}[^.|\n]{0,80}/i.exec(footerText)
  if (copy) out.copyright = copy[0].replace(/\s+/g, ' ').trim().slice(0, 100)

  // Privacy / terms links.
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const label = ($(el).text() + ' ' + href).toLowerCase()
    const abs = resolveUrl(href, finalUrl)
    if (!abs) return
    if (!out.privacyUrl && /privacy/.test(label)) out.privacyUrl = abs
    if (!out.termsUrl && /(terms|tos|conditions)/.test(label)) out.termsUrl = abs
  })

  return out
}

export function extractCopyFromGithub(bundle: GithubBundle): ExtractedCopy {
  const out: ExtractedCopy = {}
  const pkg = bundle.files.packageJson as
    | { name?: string; description?: string; homepage?: string; author?: unknown }
    | null

  if (pkg?.name) out.name = titleCaseHost(String(pkg.name).replace(/^@[^/]+\//, ''))
  if (pkg?.description) out.tagline = String(pkg.description).slice(0, 140)
  if (pkg?.homepage) {
    try {
      out.domains = [new URL(String(pkg.homepage)).host.replace(/^www\./i, '')]
    } catch {
      /* ignore */
    }
  }

  // README: first H1 is usually the product name; first paragraph the tagline.
  const readme = bundle.files.readme
  if (readme) {
    const h1 = /^#\s+(.+)$/m.exec(readme)
    if (h1 && (!out.name || out.name.toLowerCase() === bundle.repo.toLowerCase())) {
      out.name = h1[1].replace(/[#*`_]/g, '').trim().slice(0, 50)
    }
    if (!out.tagline) {
      // First non-heading, non-badge line.
      const line = readme
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l && !l.startsWith('#') && !l.startsWith('![') && !l.startsWith('[!') && !l.startsWith('<') && l.length > 20)
      if (line) out.tagline = line.replace(/[#*`_>]/g, '').trim().slice(0, 140)
    }
    const phone = pickPhone(readme)
    if (phone) out.callNumber = phone
    const mail = EMAIL_RE.exec(readme)
    if (mail && !/example\./i.test(mail[0])) out.email = mail[0]
  }

  if (!out.name) out.name = titleCaseHost(bundle.repo)
  out.displayName = out.name
  return out
}
