'use client'

import {
  DarkNavyPage,
  FooterTrustNote,
  GhostBackButton,
  IconXCircle,
  LOGO_ALT,
  MainCard,
  PageHeader,
  PageIconCircle,
} from './_shared'

export default function Sorry() {
  return (
    <DarkNavyPage>
      <PageHeader />
      <MainCard>
        <PageIconCircle variant="grey">
          <IconXCircle size={48} color="#ffffff" />
        </PageIconCircle>

        <div className="text-center flex flex-col gap-4 mb-8">
          <h1 className="text-[1.875rem] md:text-[2.25rem] font-extrabold" style={{ color: '#0C2D5B' }}>
            Sorry!
          </h1>
          <p className="text-[1.25rem] font-bold" style={{ color: '#0C2D5B' }}>
            Based on your answers, We Are Unable To Help!
          </p>
          <p className="text-[1.125rem]" style={{ color: '#595E64' }}>
            Unfortunately, based on the information you provided, we are unable to assist with your claim at this
            time.
          </p>
          <p className="text-[1rem]" style={{ color: '#595E64' }}>
            We appreciate your interest and wish you the best in finding the right assistance for your situation.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <GhostBackButton />
        </div>

        <div
          className="flex flex-col items-center gap-3 pt-6"
          style={{ borderTop: '1px solid #e5e7eb' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_ALT} alt="Check My Claim" className="h-10 w-auto" />
          <p className="text-[12px] text-center" style={{ color: '#595E64' }}>
            Your privacy is important to us. We will never share your information without your consent.
          </p>
        </div>
      </MainCard>
      <div className="max-w-[1024px] w-full mx-auto px-4 pb-12">
        <FooterTrustNote />
      </div>
    </DarkNavyPage>
  )
}
