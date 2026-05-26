import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import '../globals.css'
import { resolveSiteByHost, isFallbackHost } from '@/lib/site-resolver'

export const dynamic = 'force-dynamic'

type Site = {
  id: string | number
  name?: string | null
  brand?: {
    logo_url?: string | null
    favicon_url?: string | null
    primary?: string | null
    accent?: string | null
    surface?: string | null
    ink?: string | null
    muted?: string | null
    success?: string | null
    warning?: string | null
    danger?: string | null
    font_heading?: string | null
    font_body?: string | null
  } | null
}

// Per-Site brand tokens use distinct names (--site-*) so they don't collide with the
// dark-theme app tokens (--color-*) defined in globals.css. When no Site is matched
// (the LegalOS marketing fallback), no site tokens are emitted — the dark @theme wins.
const siteStyleVars = (site: Site): string => {
  const b = site?.brand
  return `:root{
    --site-primary:${b?.primary ?? '#0B1F3A'};
    --site-accent:${b?.accent ?? '#E8B14B'};
    --site-surface:${b?.surface ?? '#F7F5F0'};
    --site-ink:${b?.ink ?? '#0E1116'};
    --site-muted:${b?.muted ?? '#5C6470'};
    --site-success:${b?.success ?? '#1F9D55'};
    --site-warning:${b?.warning ?? '#E8B14B'};
    --site-danger:${b?.danger ?? '#C03A2B'};
    --site-font-heading:${b?.font_heading ?? 'Inter'},system-ui,sans-serif;
    --site-font-body:${b?.font_body ?? 'Inter'},system-ui,sans-serif;
  }
  html.site-shell,html.site-shell body{background:var(--site-surface);color:var(--site-ink);font-family:var(--site-font-body);margin:0;}
  html.site-shell h1,html.site-shell h2,html.site-shell h3,html.site-shell h4,html.site-shell h5{font-family:var(--site-font-heading);color:var(--site-ink);}
  html.site-shell a{color:var(--site-primary);}
  `
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const h = await headers()
  const previewSiteSlug = h.get('x-legalos-preview-site')
  const host = h.get('x-legalos-host') ?? h.get('host')
  let site: Site | null = null

  // Preview mode (?site=<slug>) — middleware stamps x-legalos-preview-site.
  // This must take precedence over host resolution because the host here
  // is always os.legenex.com (the admin host), which would otherwise resolve
  // to no site and the brand CSS variables would never be emitted.
  if (previewSiteSlug) {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'sites',
      where: { slug: { equals: previewSiteSlug } },
      limit: 1,
      overrideAccess: true,
    })
    site = (res.docs[0] as Site) ?? null
  } else if (host && !isFallbackHost(host)) {
    const resolved = await resolveSiteByHost(host)
    if (resolved) {
      const payload = await getPayload({ config })
      site = (await payload.findByID({
        collection: 'sites',
        id: resolved.siteId,
        overrideAccess: true,
      })) as Site
    }
  }

  return (
    <html lang="en" className={site ? 'site-shell' : ''}>
      <head>
        {site ? <style dangerouslySetInnerHTML={{ __html: siteStyleVars(site) }} /> : null}
        {site?.brand?.favicon_url ? <link rel="icon" href={site.brand.favicon_url} /> : null}
      </head>
      <body>{children}</body>
    </html>
  )
}
