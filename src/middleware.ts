import { NextResponse, type NextRequest } from 'next/server'

// Pass through anything Payload owns, the custom admin shell, all _next assets, and our integration endpoints.
// Custom admin is at /admin/*, raw Payload admin at /cms/*, Payload API at /api/*.
const PASSTHROUGH_PREFIXES = ['/admin', '/cms', '/api']
const SYSTEM_PREFIXES = ['/_next', '/favicon.ico']

const isPassthrough = (pathname: string): boolean => PASSTHROUGH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
const isSystemPath = (pathname: string): boolean => SYSTEM_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))

export function middleware(req: NextRequest) {
  const url = req.nextUrl
  const pathname = url.pathname

  if (isPassthrough(pathname) || isSystemPath(pathname)) return NextResponse.next()

  // Preview override: ?site=<slug> bypasses host lookup.
  const previewSiteSlug = url.searchParams.get('site')
  // ?preview=1 asks the public route to bypass the status='published' filter
  // so an admin previewing draft / scheduled content sees the unpublished
  // version. The route re-verifies the request is authenticated before
  // actually honouring the bypass — middleware only forwards the intent.
  const previewMode = url.searchParams.get('preview')
  if (previewSiteSlug) {
    const res = NextResponse.next()
    res.headers.set('x-legalos-preview-site', previewSiteSlug)
    if (previewMode === '1') res.headers.set('x-legalos-preview', '1')
    return res
  }
  if (previewMode === '1') {
    const res = NextResponse.next()
    res.headers.set('x-legalos-preview', '1')
    res.headers.set('x-legalos-host', req.headers.get('host') ?? '')
    return res
  }

  const host = req.headers.get('host') ?? ''
  const res = NextResponse.next()
  res.headers.set('x-legalos-host', host)
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
