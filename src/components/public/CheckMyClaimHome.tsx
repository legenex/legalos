'use client'

import Link from 'next/link'
import { useState } from 'react'

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c8efa75d8857518d34273/440596289_PrimaryLogo_CheckMyClaim.png'
const LOGO_LIGHT_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c8efa75d8857518d34273/a32c079ff_DarkMode-PrimaryLogo_CheckMyClaim.png'
const LOGO_CARD_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c8efa75d8857518d34273/76654a39d_CheckMyClaimLogo.png'
const HERO_IMG = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c27e1ee245bcd8cd77386/c7a33cdfe_1.png'
const ATTORNEY_IMG_A = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c27e1ee245bcd8cd77386/d2af9541c_Screenshot2026-02-23at123641.png'
const ATTORNEY_IMG_B = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c27e1ee245bcd8cd77386/00a60e981_portrait-of-a-confident-young-businesswoman-workin-2026-01-09-09-11-16-utc.jpg'

const CTA = 'https://qualify.checkmyclaim.co/s/mva?utm_source=CMC-Website&utm_campaign=Home-Page'

const BLUE_GRADIENT = 'linear-gradient(90deg,#4ba8ee,#0486e9)'
const BLUE_GRADIENT_135 = 'linear-gradient(135deg,#4ba8ee,#0486e9)'
const DARK_GRADIENT = 'linear-gradient(135deg,#111E30,#0C1A2A,#1B2737)'
const PATTERN_BG = "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Services', href: '#services' },
  { label: 'About Us', href: '#about' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact Us', href: '#contact' },
]

const ArrowRight = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
)

const Shield = ({ size = 16, stroke = 'currentColor' }: { size?: number; stroke?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
)

const Check = ({ size = 12, stroke = 'white' }: { size?: number; stroke?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
)

function CtaButton({ href = CTA, label, size = 'md' }: { href?: string; label: string; size?: 'sm' | 'md' | 'lg' }) {
  const pad = size === 'lg' ? 'px-10 py-5 text-lg' : size === 'sm' ? 'px-5 py-2.5 text-sm' : 'px-8 py-4'
  return (
    <a href={href} className={`group inline-flex items-center gap-3 text-white font-bold ${pad} rounded-full hover:opacity-90 transition-opacity`} style={{ background: BLUE_GRADIENT }}>
      {label}
      <ArrowRight size={size === 'lg' ? 24 : 20} />
    </a>
  )
}

function Navbar() {
  const [open, setOpen] = useState(false)
  const onNav = (href: string) => {
    setOpen(false)
    if (typeof document !== 'undefined') document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-24">
          <button onClick={() => onNav('#home')} className="flex-shrink-0 cursor-pointer" aria-label="Check My Claim — home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_URL} alt="Check My Claim" width={200} height={56} className="h-10 md:h-14 w-auto" />
          </button>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <button key={l.href} onClick={() => onNav(l.href)} className="text-sm font-medium tracking-wide text-[#111E30] hover:text-[#0285E9] transition-colors">
                {l.label}
              </button>
            ))}
            <a href={CTA} className="text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity" style={{ background: BLUE_GRADIENT }}>Start Your Free Claim Check</a>
          </div>
          <button onClick={() => setOpen((v) => !v)} className="md:hidden p-2 rounded-lg text-[#111E30]" aria-label={open ? 'Close menu' : 'Open menu'}>
            {open
              ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>
        </div>
      </div>
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-white border-t shadow-xl px-4 py-4 space-y-1">
          {navLinks.map((l) => (
            <button key={l.href} onClick={() => onNav(l.href)} className="block w-full text-left text-[#111E30] font-medium py-3 px-3 rounded-lg hover:bg-[#2590E6]/10 transition-colors">
              {l.label}
            </button>
          ))}
          <a href={CTA} className="block w-full text-white font-semibold py-3 rounded-full mt-3 text-center" style={{ background: BLUE_GRADIENT }}>Start Your Free Claim Check</a>
        </div>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HERO_IMG} alt="" aria-hidden width={1920} height={1080} className="w-full h-full object-cover block" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(17,30,48,.95) 0%, rgba(17,30,48,.90) 60%, rgba(12,26,42,.95) 100%)' }} />
      </div>
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: PATTERN_BG }} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 md:pt-32 md:pb-24 w-full">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-[#0285E9] text-sm font-medium px-4 py-2 rounded-full mb-8 border border-[#0285E9]/20" style={{ background: 'rgba(255,255,255,.10)', backdropFilter: 'blur(8px)' }}>
            <Shield />
            100% Free &bull; No Win, No Fee &bull; Fast Results
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight mb-6">
            Check Your Claim,{' '}
            <span style={{ background: BLUE_GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Get What You Deserve
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-10 max-w-2xl mx-auto">
            Unsure if you have a case after an accident? Our AI tool instantly checks if you may qualify for compensation and matches you with the best-suited attorney, at no upfront cost.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <CtaButton label="Start Your Free Claim Check" />
            <p className="text-gray-400 text-sm">Takes less than 2 minutes</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto -mt-8">
            {[
              { label: 'Vetted Attorneys Only', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
              { label: 'No Upfront Fees', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
              { label: 'Results in Minutes', icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 border border-white/10" style={{ background: 'rgba(255,255,255,.05)', backdropFilter: 'blur(8px)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0285E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
                <span className="text-white/80 text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TrustBanner() {
  const items = ['100% FREE', 'NO WIN, NO FEE', 'FAST RESULTS', 'VETTED ATTORNEYS']
  return (
    <section className="relative py-5 overflow-hidden" style={{ background: BLUE_GRADIENT }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {items.map((it, i) => (
            <div key={it} className="flex items-center gap-3">
              <span className="text-white font-extrabold text-sm md:text-base tracking-[0.15em]">{it}</span>
              {i < items.length - 1 && <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-white/60" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < count ? '#0285E9' : '#e5e7eb'}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

function Reviews() {
  const reviews = [
    { name: 'Jason Lambert', time: '1 Month ago', stars: 5, text: 'I had no clue how to handle my claim after my crash, but they did everything. Start to finish: professional, efficient, and got me the best possible outcome.', avatar: 'JL', color: '#111E30' },
    { name: 'Dana Hopson', time: '2 Weeks ago', stars: 5, text: 'My car was totaled, and I had no idea what to do next. Thanks to Check My Claim, I received compensation fast, and it was more than I expected!', avatar: 'DH', color: '#0285E9' },
    { name: 'Kyle Benavides', time: '4 Months ago', stars: 4, text: "I wasn't sure at first but really check a case turned out to be a blessing! We got connected with top specialists and our claim was handled smoothly.", avatar: 'KB', color: '#0486e9' },
    { name: 'Trevon Obral', time: '3 Weeks ago', stars: 5, text: 'Got covered for all the damage and had money to spare. Check My Claim came through fast and they were a pleasure to deal with.', avatar: 'TO', color: '#111E30' },
  ]
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#111E30] mb-4">Real Stories, Real Results</h2>
          <p className="text-[#595E64] text-lg max-w-2xl mx-auto">Don&apos;t just take our word for it. Hear from real people who used Check My Claim to get the compensation they deserved.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((r) => (
            <div key={r.name} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-shadow duration-500">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: r.color }}>
                    <span className="text-white text-sm font-bold">{r.avatar}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#111E30] text-sm">{r.name}</p>
                    <p className="text-xs text-[#595E64]">{r.time}</p>
                  </div>
                </div>
                <svg viewBox="0 0 24 24" width="20" height="20" aria-label="Google review" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <Stars count={r.stars} />
              <p className="mt-4 text-[#595E64] text-sm leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AccidentTypes() {
  const icons: Record<string, string> = {
    Car: 'M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5a2 2 0 0 1-2 2h-2m-4 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm6 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
    Truck: 'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
    Users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 4a4 4 0 0 1 4 4v2M19 7a4 4 0 0 1 0 8',
    HardHat: 'M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2H2v2zM10 5V3m4 2V3M7 9.5C7 7 9 5 12 5s5 2 5 4.5V13H7V9.5z',
  }
  const types = [
    { iconKey: 'Car', title: 'Auto Accidents', desc: "Getting paid for your injury shouldn't be an accident." },
    { iconKey: 'Truck', title: 'Commercial Accidents', desc: 'Get the compensation you deserve from commercial vehicle incidents.' },
    { iconKey: 'Users', title: 'Ride Share Accidents', desc: "Don't let ride share companies deny your rightful claim." },
    { iconKey: 'HardHat', title: 'Work Place Accidents', desc: "Filing an injury claim shouldn't feel like working another job." },
  ]
  return (
    <section id="services" className="py-20 md:py-28 bg-[#F9F9FB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#111E30] mb-4">We&apos;re Accident Compensation Specialists</h2>
          <p className="text-[#595E64] text-lg max-w-2xl mx-auto">Every case is special. Our team is large and diverse, but our mission is singular: To deliver the best results for you and your family.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {types.map((t) => (
            <a key={t.title} href={CTA} className="group bg-white rounded-2xl p-8 text-center border border-gray-100 hover:border-[#0285E9]/30 hover:shadow-xl transition-all duration-500 block">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500" style={{ background: BLUE_GRADIENT_135 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icons[t.iconKey]}/></svg>
              </div>
              <h3 className="text-lg font-bold text-[#111E30] mb-2">{t.title}</h3>
              <p className="text-[#595E64] text-sm leading-relaxed mb-4">{t.desc}</p>
              <span className="text-[#0285E9] font-semibold text-sm group-hover:underline">Check Your Claim →</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function WhoBenefits() {
  const bullets = [
    'Injured in a car, truck, or rideshare accident in the last 12 months',
    'Struggling with medical bills, lost wages, or ongoing pain after a crash',
    'Unsure if you have a valid claim or if insurance offered enough',
    'Looking for a trusted way to connect with an attorney at no upfront cost',
  ]
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="rounded-3xl p-10 md:p-14 text-center" style={{ background: 'linear-gradient(135deg,#111E30,#0C1A2A)' }}>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: BLUE_GRADIENT_135 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <p className="text-white text-2xl md:text-3xl font-bold mb-3">Free Claim Check</p>
              <p className="text-gray-400 mb-6">Find out in minutes if you may qualify</p>
              <div className="flex flex-wrap justify-center gap-3">
                {['Auto', 'Slip & Fall', 'Work', 'Medical'].map((t) => (
                  <span key={t} className="bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/10">{t}</span>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 md:bottom-4 md:-right-6 bg-white rounded-2xl shadow-xl px-5 py-3 border border-gray-100">
              <p className="text-[#0285E9] font-extrabold text-xl">$0</p>
              <p className="text-[#595E64] text-xs">Upfront Cost</p>
            </div>
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#111E30] mb-4">Who Can Check My Claim Help?</h2>
            <p className="text-[#595E64] text-lg mb-8 leading-relaxed">If you&apos;ve been in an accident, you might benefit from our free claim check. Here&apos;s who we&apos;re here for:</p>
            <div className="space-y-5 mb-10">
              {bullets.map((b) => (
                <div key={b} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5" style={{ background: BLUE_GRADIENT_135 }}>
                    <Check />
                  </div>
                  <p className="text-[#1B2737] text-base leading-relaxed">{b}</p>
                </div>
              ))}
            </div>
            <CtaButton label="See If You Qualify Now" />
          </div>
        </div>
      </div>
    </section>
  )
}

function Transformation() {
  const before = ['Stressed and unsure if you even have a case', 'Buried in medical bills or lost income with no help', 'Confused by insurance offers or legal steps']
  const after = ['Clear answers on whether you might qualify for a claim in minutes', 'Matched with a top attorney suited to your case, at no upfront cost', "Peace of mind knowing someone's fighting for what you might deserve"]
  return (
    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-white font-bold text-sm px-5 py-2.5 rounded-full mb-4 shadow-lg" style={{ background: BLUE_GRADIENT }}>YOUR JOURNEY TO JUSTICE</div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#111E30] mb-4">From Confusion to Clarity</h2>
          <p className="text-[#595E64] text-xl max-w-3xl mx-auto leading-relaxed">See how Check My Claim transforms your accident recovery experience</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto mb-16">
          <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-3xl p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 bg-red-500 text-white font-bold text-xs px-4 py-2 rounded-full mb-6">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              BEFORE
            </div>
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#111E30] mb-6">Without Check My Claim</h3>
            <ul className="space-y-4">
              {before.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  <span className="text-[#595E64] leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-3xl p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 bg-green-500 text-white font-bold text-xs px-4 py-2 rounded-full mb-6">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              AFTER
            </div>
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#111E30] mb-6">With Check My Claim</h3>
            <ul className="space-y-4">
              {after.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <span className="text-[#595E64] leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="text-center max-w-4xl mx-auto">
          <div className="rounded-3xl p-10 md:p-12 shadow-2xl" style={{ background: DARK_GRADIENT }}>
            <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-4">Ready to Transform Your Situation?</h3>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">Join thousands who&apos;ve found clarity, justice, and compensation through Check My Claim</p>
            <CtaButton label="Start Your Free Claim Check Now" size="lg" />
            <p className="text-gray-400 text-sm mt-4">✓ 100% Free &nbsp;•&nbsp; ✓ No Obligation &nbsp;•&nbsp; ✓ Takes 2 Minutes</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { d: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4', step: 'Step 1', title: 'Complete Our Free Eligibility Check', desc: 'Answer a few quick questions about your accident. This service is 100% free with no obligations.' },
    { d: 'M12 2a10 10 0 1 0 10 10H12V2zm7.93 9H12V4.07A9.98 9.98 0 0 1 19.93 11zM11 2.07V13H2.07A9.98 9.98 0 0 0 11 2.07z', step: 'Step 2', title: 'Get Your Results Instantly', desc: 'Our AI-powered tool analyzes your information to determine if you might qualify for compensation.' },
    { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm6 3a3 3 0 0 1 0 6M18 14a3 3 0 0 0 0 6', step: 'Step 3', title: 'We Connect You to a Vetted Attorney', desc: "If eligible, we'll match you with a trusted attorney from our network who works on a no win, no fee basis." },
  ]
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#111E30] mb-4">Our Simple 3-Step Process</h2>
          <p className="text-[#595E64] text-lg max-w-2xl mx-auto">Getting help after an accident shouldn&apos;t be hard. Here&apos;s how Check My Claim works:</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12 relative">
          <div className="hidden md:block absolute top-20 left-[16%] right-[16%] h-0.5 opacity-30" style={{ background: BLUE_GRADIENT }} />
          {steps.map((s) => (
            <div key={s.step} className="relative text-center group">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 relative z-10" style={{ background: BLUE_GRADIENT_135 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={s.d}/></svg>
              </div>
              <span className="text-[#0285E9] font-bold text-sm tracking-wider uppercase mb-2 block">{s.step}</span>
              <h3 className="text-xl font-bold text-[#111E30] mb-3">{s.title}</h3>
              <p className="text-[#595E64] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <CtaButton label="Start Your Free Survey Now" />
        </div>
      </div>
    </section>
  )
}

function USP() {
  const usps = [
    { d: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z', title: 'Fast Eligibility Check', desc: 'Get instant results in minutes. Simply answer a few quick questions about your accident to see if you may qualify for compensation.' },
    { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', title: 'Seamless Attorney Matching', desc: 'If eligible, we connect you with the best-suited attorney from our vetted network—no endless searching or cold calling required.' },
    { d: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', title: 'Always 100% Free', desc: 'Our claim check service is completely free. We never charge you—our job is simply to check eligibility and connect you with attorneys.' },
  ]
  return (
    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#111E30] mb-4">We Make Injury Claims Easy</h2>
          <p className="text-[#595E64] text-lg max-w-2xl mx-auto">Navigating the legal process shouldn&apos;t be complicated. We&apos;ve streamlined everything to get you the help you need, when you need it.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
          {usps.map((u) => (
            <div key={u.title} className="bg-gradient-to-br from-white to-[#F9F9FB] rounded-2xl p-8 border border-gray-100 hover:border-[#0285E9]/30 hover:shadow-xl transition-all duration-500 group">
              <div className="w-14 h-14 mb-6 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500" style={{ background: BLUE_GRADIENT_135 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={u.d}/></svg>
              </div>
              <h3 className="text-xl font-bold text-[#111E30] mb-3">{u.title}</h3>
              <p className="text-[#595E64] leading-relaxed">{u.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <CtaButton label="Get Started Now" />
        </div>
      </div>
    </section>
  )
}

function FightingForYou() {
  const bullets = [
    { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', text: 'Vetted attorneys with proven track records' },
    { d: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', text: 'Thousands of successful claims nationwide' },
    { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 4a4 4 0 0 1 4 4v2M19 7a4 4 0 0 1 0 8', text: 'Personalized legal care for every client' },
    { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', text: '100% commitment to your success' },
  ]
  return (
    <section className="py-20 md:py-28 relative overflow-hidden" style={{ background: DARK_GRADIENT }}>
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: PATTERN_BG }} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-[#0285E9] font-bold text-sm px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(2,133,233,.2)' }}>
              <Shield />
              YOUR TRUSTED PARTNER
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">We&apos;ll Never Stop Fighting For You</h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">We work with only the best attorneys to get you the compensation you deserve.</p>
            <div className="space-y-6 mb-10">
              {bullets.map((b) => (
                <div key={b.text} className="flex items-center gap-4 border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all duration-300" style={{ background: 'rgba(255,255,255,.10)', backdropFilter: 'blur(4px)' }}>
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: BLUE_GRADIENT_135 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={b.d}/></svg>
                  </div>
                  <p className="text-white font-medium">{b.text}</p>
                </div>
              ))}
            </div>
            <CtaButton label="Get Your Free Claim Check" />
          </div>
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ATTORNEY_IMG_A} alt="Professional attorney" width={800} height={600} loading="lazy" decoding="async" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(17,30,48,.3), transparent)' }} />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-2xl px-6 py-4" style={{ border: '4px solid #F9F9FB' }}>
              <p className="text-[#0285E9] font-extrabold text-3xl">98%</p>
              <p className="text-[#595E64] text-sm font-medium">Success Rate</p>
            </div>
            <div className="absolute -top-6 -right-6 rounded-2xl shadow-2xl px-6 py-4" style={{ background: BLUE_GRADIENT_135 }}>
              <p className="text-white font-extrabold text-3xl">$50M+</p>
              <p className="text-white/90 text-sm font-medium">Recovered</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function NoWinNoFee() {
  const items = [
    'Free claim eligibility check, always 100% free',
    'Connected to attorneys who work on contingency',
    'Attorneys only get paid if you win your case',
    'No upfront costs or surprise bills from matched attorneys',
  ]
  return (
    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ATTORNEY_IMG_B} alt="Professional attorney" width={800} height={1000} loading="lazy" decoding="async" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(17,30,48,.6), transparent)' }} />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-2xl px-6 py-4" style={{ border: '4px solid #111E30' }}>
              <div className="flex items-center gap-3">
                <Shield size={32} stroke="#0285E9" />
                <div>
                  <p className="text-[#111E30] font-extrabold text-xl">100% FREE</p>
                  <p className="text-[#111E30] text-xs">Zero Risk Guarantee</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 text-[#0285E9] font-bold text-sm px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(2,133,233,.2)' }}>
              <Shield />
              OUR GUARANTEE
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#111E30] mb-6 leading-tight">Our Attorneys Don&apos;t Get Paid Unless You Do</h2>
            <p className="text-xl font-bold text-[#111E30] mb-6">THE NO WIN, NO FEE GUARANTEE</p>
            <p className="text-[#595E64] leading-relaxed mb-8">Check My Claim connects you with vetted attorneys in our network who work on a &ldquo;no win, no fee&rdquo; basis. This means the attorneys we match you with will not charge you a cent if they do not secure a positive outcome in your case.</p>
            <div className="space-y-4 mb-10">
              {items.map((item) => (
                <div key={item} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: BLUE_GRADIENT_135 }}>
                    <Check />
                  </div>
                  <p className="text-[#111E30] font-medium">{item}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl p-6 mb-8" style={{ background: 'rgba(2,133,233,.1)', border: '1px solid rgba(2,133,233,.3)' }}>
              <p className="text-2xl font-extrabold text-[#0285E9] text-center">YOU HAVE NOTHING TO LOSE!</p>
            </div>
            <CtaButton label="Start Your Free Claim Check" />
          </div>
        </div>
      </div>
    </section>
  )
}

function RecentWins() {
  const wins = [
    { amount: '$132,700', name: 'Mike P, 31', location: 'Memphis, TN' },
    { amount: '$197,500', name: 'John M, 54', location: 'Tampa, FL' },
    { amount: '$114,600', name: 'Sarah J, 43', location: 'Los Angeles, CA' },
  ]
  return (
    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#111E30] mb-4">We&apos;ll Never Stop Fighting For You</h2>
          <p className="text-[#595E64] text-lg max-w-2xl mx-auto">We work with only the best attorneys to get you the compensation you deserve.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
          {wins.map((w) => (
            <div key={w.name} className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:border-[#0285E9]/40 hover:shadow-xl transition-all duration-500 group">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: 'rgba(2,133,233,.2)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0285E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
              </div>
              <p className="text-sm text-[#595E64] font-medium uppercase tracking-wider mb-1">Recent Win</p>
              <p className="text-3xl md:text-4xl font-extrabold mb-3" style={{ background: BLUE_GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{w.amount}</p>
              <p className="text-[#111E30] font-semibold">{w.name}</p>
              <p className="text-[#595E64] text-sm">{w.location}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <CtaButton label="Check My Claim Now" />
        </div>
      </div>
    </section>
  )
}

function AboutUs() {
  const stats = [
    { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 4a4 4 0 0 1 4 4v2M19 7a4 4 0 0 1 0 8', value: '10,000+', label: 'People Helped' },
    { d: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', value: '500+', label: 'Vetted Attorneys' },
    { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', value: '$0', label: 'Upfront Cost' },
    { d: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z', value: '100%', label: 'Commitment' },
  ]
  return (
    <section id="about" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#111E30] mb-4">About Check My Claim</h2>
            <p className="text-[#595E64] text-lg mb-6 leading-relaxed">We&apos;re here to help accident victims get the clarity and support they need. Fast and risk-free.</p>
            <p className="text-[#595E64] leading-relaxed mb-8">At Check My Claim, our mission is simple: to empower those injured in accidents by providing a free, AI-powered claim check. We connect you with top attorneys who work on a &ldquo;no win, no fee&rdquo; basis, so you have nothing to lose.</p>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="bg-[#F9F9FB] rounded-xl p-4 text-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0285E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2"><path d={s.d}/></svg>
                  <p className="text-2xl font-extrabold text-[#111E30]">{s.value}</p>
                  <p className="text-[#595E64] text-sm">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="rounded-3xl p-10 md:p-14" style={{ background: 'linear-gradient(135deg,#E8F4FD,rgba(2,133,233,.2))' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_CARD_URL} alt="Check My Claim" width={224} height={80} loading="lazy" decoding="async" className="w-56 mx-auto mb-8" />
              <div className="space-y-4">
                {['Free AI-powered eligibility check', 'No win, no fee—zero risk', 'Matched with top attorneys nationwide', 'Fast, compassionate support'].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,.8)', backdropFilter: 'blur(4px)' }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: BLUE_GRADIENT }} />
                    <span className="text-[#111E30] font-medium text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const FAQS = [
  { q: 'Personal injury lawyer: how does Check My Claim help you find one?', a: 'If you are searching for a personal injury lawyer after an accident, Check My Claim helps you start with a quick eligibility check instead of calling random firms. If your case looks like a fit, we connect you with a vetted attorney for a review. Check My Claim is not a law firm and does not provide legal advice.' },
  { q: 'Personal injury attorney vs personal injury lawyer: what is the difference?', a: 'In most states, the terms personal injury attorney and personal injury lawyer are used the same way. What matters is whether the lawyer handles your type of accident and can explain fees and next steps clearly.' },
  { q: 'Injury lawyer: when should I talk to one after an accident?', a: 'If you have injuries, medical visits, time off work, or an insurance offer that feels low, it is worth getting a legal review. Check My Claim helps you check eligibility quickly and connect with an injury lawyer if your claim qualifies.' },
  { q: 'Lawyer for motor vehicle accident: do I need one to file a claim?', a: 'You can often start a claim without a lawyer, but legal review can help if fault is disputed, injuries are serious, or the insurer is delaying or lowballing.' },
  { q: 'Motor vehicle accident attorneys: how do I find the right one?', a: 'Look for an attorney who regularly handles motor vehicle accident cases, explains fees upfront, and is responsive. Check My Claim helps you avoid wasted calls by screening your situation first.' },
  { q: 'Car accident personal injury lawyer: what can they help with?', a: 'A car accident personal injury lawyer can review liability, medical documentation, damages, and settlement offers. Check My Claim starts with a quick eligibility check and can connect you with a vetted attorney.' },
  { q: 'Car accident personal injury attorney: how fast can I speak to one?', a: 'Timing depends on availability, but the fastest path is to have your basic details ready and start with a structured claim check. Check My Claim helps you capture the key facts quickly.' },
  { q: 'Auto accident personal injury lawyer: do I qualify if I was partly at fault?', a: 'In many states, you may still have options even if you share some fault, but the rules can affect the outcome. Check My Claim helps you check eligibility based on your situation.' },
  { q: 'Car accident injury lawyers: what should I ask before hiring?', a: 'Ask about experience with your injury type, typical timelines, how fees work, and what they need from you to evaluate the claim. Check My Claim helps you start with an eligibility check.' },
]

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number>(0)
  return (
    <section id="faq" className="py-20 md:py-28 bg-gradient-to-br from-[#F9FAFB] to-white relative overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-[#0285E9] font-bold text-sm px-4 py-2 rounded-full mb-4" style={{ background: 'rgba(2,133,233,.1)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            FAQ
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#111E30] mb-4">Frequently Asked Questions</h2>
          <p className="text-[#595E64] text-lg md:text-xl max-w-2xl mx-auto">Got questions? We&apos;ve got answers.</p>
        </div>
        <div className="grid gap-4 md:gap-6">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div key={faq.q} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
                <button onClick={() => setOpenIndex(isOpen ? -1 : i)} className="w-full flex items-start justify-between p-6 md:p-8 text-left gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300" style={{ background: isOpen ? BLUE_GRADIENT_135 : 'rgba(2,133,233,.1)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isOpen ? 'white' : '#0285E9'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <span className={`text-base md:text-lg font-semibold leading-relaxed transition-colors duration-300 ${isOpen ? 'text-[#0285E9]' : 'text-[#111E30]'}`}>{faq.q}</span>
                  </div>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isOpen ? '#0285E9' : '#595E64'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {isOpen ? (
                  <div className="px-6 md:px-8 pb-6 md:pb-8">
                    <div className="pl-14">
                      <p className="text-[#595E64] leading-relaxed text-base">{faq.a}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
        <div className="text-center mt-16">
          <p className="text-[#595E64] text-lg mb-6">Still have questions? Start your free claim check now.</p>
          <CtaButton label="Get Started Now" />
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer id="contact" className="bg-[#111E30] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_LIGHT_URL} alt="Check My Claim" width={200} height={56} loading="lazy" decoding="async" className="h-14 w-auto mb-4" />
            <p className="text-gray-400 text-sm leading-relaxed">Empowering accident victims with free, AI-powered claim checks and connections to top-rated attorneys. No win, no fee.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <div className="space-y-2">
              {[{ label: 'Home', href: '#home' }, { label: 'About Us', href: '#about' }, { label: 'Services', href: '#services' }, { label: 'FAQ', href: '#faq' }].map((link) => (
                <a key={link.href} href={link.href} className="block text-gray-400 text-sm hover:text-[#0285E9] transition-colors">{link.label}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-400 text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0285E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                support@checkmyclaim.com
              </div>
              <a href="tel:+18447381035" className="flex items-center gap-3 text-gray-400 text-sm hover:text-[#0285E9] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0285E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span>(844) 738 1035</span>
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Check My Claim. All rights reserved.</p>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p className="text-gray-500 text-xs max-w-lg text-center md:text-right">
              Check My Claim is not a law firm and does not provide legal advice. Results are for informational purposes only and do not guarantee compensation.
            </p>
            <div className="flex gap-6 flex-wrap justify-center">
              <Link href="/privacy-policy" className="text-[#0285E9] hover:underline text-sm font-medium whitespace-nowrap">Privacy Policy</Link>
              <Link href="/terms-of-service" className="text-[#0285E9] hover:underline text-sm font-medium whitespace-nowrap">Terms &amp; Conditions</Link>
              <Link href="/disclosures" className="text-[#0285E9] hover:underline text-sm font-medium whitespace-nowrap">Advertising Disclosure</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function CheckMyClaimHome() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <TrustBanner />
      <Reviews />
      <AccidentTypes />
      <WhoBenefits />
      <Transformation />
      <HowItWorks />
      <USP />
      <FightingForYou />
      <NoWinNoFee />
      <RecentWins />
      <AboutUs />
      <FAQ />
      <Footer />
    </div>
  )
}
