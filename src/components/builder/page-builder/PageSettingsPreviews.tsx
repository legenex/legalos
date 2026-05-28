// @ts-nocheck
/* eslint-disable */
'use client'

// SERP + OG card mocks rendered under the SEO inputs in the page-settings
// panel. They're approximate — not pixel-perfect copies of Google's or
// each platform's chrome — but close enough that authors can see how the
// page is going to show up before publishing.

import { T } from '../ui'

// ---------------------------------------------------------------------------
// GOOGLE SERP MOCK
// ---------------------------------------------------------------------------
export function GoogleSerpPreview({
  primaryHost,
  slug,
  metaTitle,
  metaDescription,
  pageTitle,
}) {
  const path = slug && slug !== '/' ? slug : ''
  const url = `https://${primaryHost}${path}`
  const breadcrumb = primaryHost + (path ? ' › ' + path.replace(/^\//, '').replace(/-/g, ' ').replace(/\//g, ' › ') : '')
  const title = (metaTitle || pageTitle || 'Untitled').slice(0, 60)
  const desc = (metaDescription || '').slice(0, 160) || 'No meta description set. Search engines will pull a snippet from your page content.'
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        padding: '14px 16px',
        border: `1px solid ${T.border}`,
        fontFamily: 'arial, sans-serif',
        color: '#202124',
      }}
    >
      <div style={{ fontSize: 11, color: '#5f6368', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        Google preview
      </div>
      <div style={{ fontSize: 12, color: '#202124', marginTop: 8, marginBottom: 2 }}>{breadcrumb}</div>
      <div style={{ fontSize: 11, color: '#5f6368', marginBottom: 6 }}>{url}</div>
      <div style={{ fontSize: 19, lineHeight: 1.25, color: '#1a0dab', fontWeight: 400, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.55, color: '#4d5156' }}>{desc}</div>
      <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: 11, color: '#70757a' }}>
        <span>{title.length}/60 title chars</span>
        <span>{desc === 'No meta description set. Search engines will pull a snippet from your page content.' ? '0' : Math.min(desc.length, 160)}/160 description chars</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// OG (Open Graph) social card mocks
// ---------------------------------------------------------------------------
export function OgPreviewCards({
  primaryHost,
  metaTitle,
  metaDescription,
  ogImageUrl,
  pageTitle,
}) {
  const title = metaTitle || pageTitle || 'Untitled'
  const desc = metaDescription || ''
  const domain = primaryHost
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, color: T.textMute, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Social card preview
      </div>
      <OgCard
        platform="Facebook"
        bg="#f0f2f5"
        chromeColor="#65676b"
        ogImageUrl={ogImageUrl}
        domain={domain}
        title={title}
        desc={desc}
      />
      <OgCard
        platform="X / Twitter"
        bg="#15202b"
        chromeColor="#8899a6"
        textColor="#fff"
        ogImageUrl={ogImageUrl}
        domain={domain}
        title={title}
        desc={desc}
      />
      <OgCard
        platform="LinkedIn"
        bg="#fff"
        chromeColor="#666"
        ogImageUrl={ogImageUrl}
        domain={domain}
        title={title}
        desc={desc}
        flushLayout
      />
    </div>
  )
}

function OgCard({ platform, bg, chromeColor, textColor = '#1c1e21', ogImageUrl, domain, title, desc, flushLayout }) {
  return (
    <div style={{ background: bg, borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.border}` }}>
      <div style={{ padding: '6px 10px', fontSize: 10, color: chromeColor, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>
        {platform}
      </div>
      <div
        style={{
          aspectRatio: '1.91 / 1',
          background: ogImageUrl ? `url(${ogImageUrl}) center/cover no-repeat` : 'repeating-linear-gradient(45deg, rgba(0,0,0,0.04), rgba(0,0,0,0.04) 8px, rgba(0,0,0,0.06) 8px, rgba(0,0,0,0.06) 16px)',
        }}
      >
        {!ogImageUrl ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 11, fontWeight: 500 }}>
            No OG image set
          </div>
        ) : null}
      </div>
      <div style={{ padding: flushLayout ? '8px 14px 12px' : '10px 14px 12px' }}>
        <div style={{ fontSize: 10, color: chromeColor, textTransform: flushLayout ? 'none' : 'uppercase', letterSpacing: 0.3, marginBottom: 3 }}>
          {domain}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, color: textColor, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {title}
        </div>
        {desc ? (
          <div style={{ fontSize: 12, lineHeight: 1.45, color: textColor === '#fff' ? '#8899a6' : '#606770', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {desc}
          </div>
        ) : null}
      </div>
    </div>
  )
}
