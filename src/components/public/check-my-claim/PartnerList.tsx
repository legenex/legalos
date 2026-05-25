'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'
import {
  DarkNavyPage,
  FooterTrustNote,
  GhostBackButton,
  IconUsers,
  MainCard,
  NoWinNoFeeCard,
  PageHeader,
  PageIconCircle,
} from './_shared'

const AFFILIATED_PARTNERS = [
  'Car Accident Helpline',
  'Los Defensores',
  '4LegalLeads',
  '1800TheLaw2',
  'My Lawsuit Help',
  'Action Legal',
  'The Injury Help Network',
  'Inbounds.com',
  'Auto Accident Team',
  'Accident Helpline',
]

const SPONSORS_SCRIPT_SRC = 'https://pmdb.walkeradvertising.com/sponsors/embed.js'

export default function PartnerList() {
  const scopedStyleRef = useRef<HTMLStyleElement | null>(null)

  // Inject scoped styles for the third-party widget once.
  useEffect(() => {
    if (scopedStyleRef.current) return
    const css = `
      #participants-container { display: flex; flex-direction: column; gap: 0; }
      #participants-container > * {
        padding: 10px 14px;
        border-left: 3px solid #0285E9;
        margin-bottom: 20px;
        background: #f8fafc;
        border-radius: 0 8px 8px 0;
      }
      #participants-container a {
        font-weight: 700;
        font-size: 15px;
        color: #0C2D5B !important;
        text-decoration: none;
        display: block;
      }
      #participants-container a:hover { color: #0285E9 !important; }
    `
    const tag = document.createElement('style')
    tag.setAttribute('data-cmc-partner-widget', '')
    tag.appendChild(document.createTextNode(css))
    document.head.appendChild(tag)
    scopedStyleRef.current = tag
    return () => {
      tag.remove()
      scopedStyleRef.current = null
    }
  }, [])

  return (
    <DarkNavyPage>
      <PageHeader />
      <MainCard>
        <PageIconCircle variant="blue">
          <IconUsers size={48} color="#ffffff" />
        </PageIconCircle>
        <h1 className="text-[1.875rem] md:text-[2.25rem] font-extrabold text-center mb-8" style={{ color: '#0C2D5B' }}>
          Our Partners
        </h1>

        {/* Affiliated Partners */}
        <h2 className="text-[1.5rem] font-extrabold mb-4" style={{ color: '#0C2D5B' }}>
          Affiliated Partners
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {AFFILIATED_PARTNERS.map((p) => (
            <div
              key={p}
              className="transition-shadow duration-200 hover:shadow-md"
              style={{
                background: 'linear-gradient(to bottom right, rgba(75,168,238,.10), rgba(4,134,233,.10))',
                borderRadius: 12,
                padding: 16,
                borderLeft: '4px solid #0285E9',
              }}
            >
              <p className="font-semibold" style={{ color: '#0C2D5B' }}>
                {p}
              </p>
            </div>
          ))}
        </div>

        {/* Sponsors */}
        <h2 className="text-[1.5rem] font-extrabold mb-4" style={{ color: '#0C2D5B' }}>
          Sponsors
        </h2>
        <div id="participants-container" />
        <Script src={SPONSORS_SCRIPT_SRC} strategy="afterInteractive" data-container="participants-container" />

        <NoWinNoFeeCard />

        <div className="flex justify-center">
          <GhostBackButton />
        </div>
      </MainCard>
      <div className="max-w-[1024px] w-full mx-auto px-4 pb-12">
        <FooterTrustNote />
      </div>
    </DarkNavyPage>
  )
}
