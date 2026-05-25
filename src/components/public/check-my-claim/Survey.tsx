'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  GRAD_BLUE,
  IconPhone,
  LOGO_PRIMARY,
  PHONE_SURVEY_DISPLAY,
  PHONE_SURVEY_TEL,
} from './_shared'

const GRAD_SURVEY_PAGE = 'linear-gradient(135deg,#061D32,#0C2D5B,#1B3A4F)'
const DOT_GRID_BG =
  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"

type Answer = { label: string; dq?: boolean }
const STEP_1_ANSWERS: Answer[] = [
  { label: 'Auto / Motorcycle Accident' },
  { label: 'Commercial / Semi Accident' },
  { label: 'Passenger / Rideshare / Pedestrian Accident' },
  { label: "At Work / Other / I Wasn't Injured", dq: true },
]

function CallBanner() {
  return (
    <header className="bg-white shadow-md relative z-10">
      <div className="max-w-[1280px] mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" aria-label="Check My Claim — home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_PRIMARY} alt="Check My Claim" className="h-10 w-auto" />
        </Link>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[12px]" style={{ color: '#595E64' }}>
            Prefer to call?
          </span>
          <a
            href={`tel:${PHONE_SURVEY_TEL}`}
            className="inline-flex items-center gap-2 text-white font-bold text-[14px] transition-all duration-300 hover:scale-105"
            style={{ background: GRAD_BLUE, padding: '8px 16px', borderRadius: 9999 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(59,130,246,.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <IconPhone size={14} />
            <span className="__tc_dni_phone">{PHONE_SURVEY_DISPLAY}</span>
          </a>
        </div>
      </div>
    </header>
  )
}

function SurveyFooter() {
  const year = new Date().getFullYear()
  return (
    <footer
      className="relative z-10 mt-12"
      style={{
        background: '#0C2D5B',
        borderTop: '1px solid rgba(255,255,255,.10)',
        padding: '32px 16px',
      }}
    >
      <div className="max-w-[1280px] mx-auto">
        <nav
          className="flex flex-wrap justify-center gap-6 pb-6 mb-6"
          style={{ borderBottom: '1px solid rgba(255,255,255,.10)' }}
        >
          {[
            { label: 'Home', href: '/' },
            { label: 'Privacy Policy', href: '/PrivacyPolicy' },
            { label: 'Terms & Conditions', href: '/TermsOfService' },
            { label: 'Advertising Disclosure', href: '/AdvertisingDisclosure' },
          ].map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-[12px] sm:text-[14px] hover:text-white transition-colors"
              style={{ color: 'rgba(255,255,255,.70)' }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div
          className="text-[12px] flex flex-col gap-4 mb-6"
          style={{ color: 'rgba(255,255,255,.60)' }}
        >
          <p>
            <strong>DISCLAIMER:</strong> CheckMyClaim.co is not a law firm or an attorney referral service. This
            advertisement is not legal advice and does not guarantee or predict the outcome of your legal matter.
          </p>
          <p>
            Advertising is paid for by participating attorneys in a joint advertising program. A complete list of
            participating attorneys is available upon request.
          </p>
          <p>
            If you live in AL, FL, MO, NY, or WY,{' '}
            <Link href="/sb-37-list" className="hover:underline" style={{ color: '#0285E9' }}>
              click here
            </Link>{' '}
            to view additional information regarding attorney advertising disclosures in your state.
          </p>
          <p>
            <strong>Cookies &amp; Data Notice:</strong> We use cookies to personalize content and analyze website
            traffic.
          </p>
        </div>
        <p
          className="text-[12px] text-center pt-4"
          style={{ color: 'rgba(255,255,255,.40)', borderTop: '1px solid rgba(255,255,255,.10)' }}
        >
          © {year} Check My Claim. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default function Survey() {
  const router = useRouter()
  const onAnswer = (a: Answer) => {
    router.push(a.dq ? '/Sorry' : '/Submitted')
  }
  return (
    <div className="min-h-screen overflow-x-hidden relative" style={{ background: GRAD_SURVEY_PAGE }}>
      {/* Dot grid texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.03, backgroundImage: DOT_GRID_BG }}
        aria-hidden
      />

      <CallBanner />

      <section className="relative z-10 px-4 py-6 md:px-6 md:py-12">
        <div
          className="max-w-[1024px] mx-auto bg-white"
          style={{
            borderRadius: 24,
            padding: 24,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,.25)',
          }}
        >
          <div className="md:p-6">
            <p className="text-center text-[14px] md:text-[16px] mb-4" style={{ color: '#595E64' }}>
              Take the 30 Second Quiz to Start the Process of Seeing How Much Your Claim Could Be Worth
            </p>
            <h1
              className="text-center font-bold mb-8 md:mb-12"
              style={{ color: '#0285E9', fontSize: 'clamp(1.875rem, 5vw, 3.75rem)', lineHeight: 1.1 }}
            >
              Get The Maximum Cash Payout For Your Accident Injury!!
            </h1>
            <h2
              className="text-center font-bold mb-2"
              style={{ color: '#111E30', fontSize: 'clamp(1.5rem, 3vw, 1.875rem)' }}
            >
              How Were You Injured?
            </h2>
            <p className="text-center text-[1rem] mb-6 md:mb-8" style={{ color: '#595E64' }}>
              Select The Type Of Accident You Were Involved In:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STEP_1_ANSWERS.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => onAnswer(a)}
                  className="text-white font-semibold transition-colors duration-200 w-full text-center cursor-pointer"
                  style={{
                    background: '#0A1F3D',
                    fontSize: '1.125rem',
                    padding: '24px',
                    borderRadius: 12,
                    border: '4px solid #0285E9',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,.10)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#0C2847'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#0A1F3D'
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SurveyFooter />
    </div>
  )
}
