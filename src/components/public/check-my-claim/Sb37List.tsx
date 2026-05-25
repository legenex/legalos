'use client'

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

const PARTICIPANTS = ['Kevin Danesh', 'The Law Offices of Larry H. Parker']

export default function Sb37List() {
  return (
    <DarkNavyPage>
      <PageHeader />
      <MainCard>
        <PageIconCircle variant="blue">
          <IconUsers size={48} color="#ffffff" />
        </PageIconCircle>
        <h1 className="text-[1.875rem] md:text-[2.25rem] font-extrabold text-center mb-8" style={{ color: '#0C2D5B' }}>
          Affiliated Participants
        </h1>

        <div
          className="mb-8 flex flex-col gap-4"
          style={{
            background: 'linear-gradient(to bottom right, rgba(75,168,238,.10), rgba(4,134,233,.10))',
            borderRadius: 16,
            padding: 32,
          }}
        >
          {PARTICIPANTS.map((name) => (
            <div
              key={name}
              className="bg-white"
              style={{
                borderRadius: 12,
                padding: 24,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,.10)',
                borderLeft: '4px solid #0285E9',
              }}
            >
              <p className="text-[1.25rem] font-bold" style={{ color: '#0C2D5B' }}>
                {name}
              </p>
            </div>
          ))}
        </div>

        <NoWinNoFeeCard
          body={
            <>
              The attorney&apos;s guarantee every client that they will not charge you a cent if they do not secure a
              positive outcome in your case. If you do win, the bulk of the fees are usually paid by the opposing
              counsel&apos;s client, who was responsible for the accident.
            </>
          }
          body2={
            <>
              They will discuss and agree upon the fee breakdown upfront and in detail, so there will be complete
              transparency and no disappointment once your case is won… That is a guarantee to you!
            </>
          }
        />

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
