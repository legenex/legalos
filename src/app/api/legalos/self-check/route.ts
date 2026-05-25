import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { resolveSiteByHost } from '@/lib/site-resolver'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const APP_MARKER = 'legalos'

/**
 * Self-identifying endpoint used by the domain provisioning poller.
 *
 * The verifier hits `https://<connected-host>/api/legalos/self-check` and checks
 * that the JSON response carries `app: "legalos"` and the expected `site_id`.
 * This proves that the request actually reached our Next.js app for the right
 * tenant — Plesk's default vhost, another server, or a misconfigured proxy will
 * all fail this check even if the TLS handshake succeeds.
 */
export async function GET(req: NextRequest) {
  const host = (req.headers.get('x-legalos-host') ?? req.headers.get('host') ?? '').toLowerCase()
  const resolved = await resolveSiteByHost(host)
  if (!resolved) {
    return NextResponse.json(
      { ok: false, app: APP_MARKER, host, error: 'host not mapped to any site' },
      { status: 404, headers: { 'cache-control': 'no-store' } },
    )
  }
  return NextResponse.json(
    {
      ok: true,
      app: APP_MARKER,
      host,
      site_id: String(resolved.siteId),
      primary_host: resolved.primaryHost,
      time: new Date().toISOString(),
    },
    { headers: { 'cache-control': 'no-store' } },
  )
}
