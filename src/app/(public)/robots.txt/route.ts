import { headers } from 'next/headers'
import { resolveSiteByHost, isFallbackHost } from '@/lib/site-resolver'

export const dynamic = 'force-dynamic'

export async function GET() {
  const h = await headers()
  const host = h.get('x-legalos-host') ?? h.get('host') ?? ''
  const origin = `https://${host}`

  if (!host || isFallbackHost(host)) {
    return new Response(`User-agent: *\nDisallow:\n`, { headers: { 'content-type': 'text/plain' } })
  }

  const resolved = await resolveSiteByHost(host)
  if (!resolved) return new Response(`User-agent: *\nDisallow: /\n`, { headers: { 'content-type': 'text/plain' } })

  const body = `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`
  return new Response(body, { headers: { 'content-type': 'text/plain' } })
}
