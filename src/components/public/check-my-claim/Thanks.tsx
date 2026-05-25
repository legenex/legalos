'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  DarkNavyPage,
  DontWaitCTA,
  FooterTrustNote,
  GhostBackButton,
  GRAD_BLUE,
  IconCheckCircle,
  MainCard,
  NoWinNoFeeCard,
  PageHeader,
  PageIconCircle,
} from './_shared'

export default function Thanks() {
  const search = useSearchParams()
  const eventId = search.get('event_id') ?? undefined

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.fbq?.('track', 'DQLead', {}, eventId ? { eventID: eventId } : undefined)
    } catch {}
    try {
      window.ttq?.track?.('DQLead', {})
    } catch {}
  }, [eventId])

  return (
    <DarkNavyPage>
      <PageHeader />
      <MainCard>
        <PageIconCircle variant="blue">
          <IconCheckCircle size={48} color="#ffffff" />
        </PageIconCircle>

        <div className="text-center flex flex-col gap-3 mb-6">
          <h1 className="text-[1.875rem] md:text-[2.25rem] font-extrabold" style={{ color: '#0C2D5B' }}>
            Thank You!
          </h1>
          <p className="text-[1.25rem] font-bold" style={{ color: '#0C2D5B' }}>
            We Have Received Your Details!
          </p>
          <p className="text-[1.125rem]" style={{ color: '#595E64' }}>
            One of our trusted advisors will call you in the next few minutes!
          </p>
        </div>

        <div
          className="text-white font-bold text-center mb-3"
          style={{ background: GRAD_BLUE, padding: '12px 16px', borderRadius: 12 }}
        >
          Please Make Sure To Answer your Phone!
        </div>

        <p className="text-[14px] italic text-center mb-8" style={{ color: '#595E64' }}>
          <strong>PLEASE NOTE:</strong> We cannot proceed with your case without talking to you on the phone and
          confirming your case details…
        </p>

        <DontWaitCTA />
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
