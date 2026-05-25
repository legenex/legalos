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
  if (previewSiteSlug) {
    const res = NextResponse.next()
    res.headers.set('x-legalos-preview-site', previewSiteSlug)
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
