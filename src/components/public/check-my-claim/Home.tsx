'use client'

import { useEffect, useState } from 'react'
import { PHONE_PRIMARY_DISPLAY, PHONE_PRIMARY_TEL } from './_shared'

const LOGO_LIGHT =
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c8efa75d8857518d34273/440596289_PrimaryLogo_CheckMyClaim.png'
const LOGO_DARK =
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c8efa75d8857518d34273/a32c079ff_DarkMode-PrimaryLogo_CheckMyClaim.png'
const HERO_BG =
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c27e1ee245bcd8cd77386/c7a33cdfe_1.png'

const SURVEY_URL_BASE = 'https://qualify.checkmyclaim.co/s/mva'
const cta = (medium: string): string =>
  `${SURVEY_URL_BASE}?utm_source=CMC-Website&utm_campaign=Home-Page&utm_medium=${medium}`

const Star = ({ filled }: { filled: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#0285E9' : '#e5e7eb'}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const GoogleG = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

const ReviewCard = ({
  initials,
  bg,
  name,
  ago,
  stars,
  text,
  delay,
}: {
  initials: string
  bg: string
  name: string
  ago: string
  stars: number
  text: string
  delay: number
}) => (
  <div className="review-card fade-in" style={{ transitionDelay: `${delay}ms` }}>
    <div className="review-card__header">
      <div className="review-card__author">
        <div className="review-card__avatar" style={{ backgroundColor: bg }}>
          <span className="review-card__avatar-text">{initials}</span>
        </div>
        <div>
          <p className="review-card__name">{name}</p>
          <p className="review-card__time">{ago}</p>
        </div>
      </div>
      <GoogleG />
    </div>
    <div className="review-card__stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} filled={i < stars} />
      ))}
    </div>
    <p className="review-card__text">{text}</p>
  </div>
)

const TypeCard = ({
  title,
  desc,
  delay,
  path,
}: {
  title: string
  desc: string
  delay: number
  path: 'auto' | 'commercial' | 'rideshare' | 'workplace'
}) => {
  const icon = {
    auto: (
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5a2 2 0 0 1-2 2h-2m-4 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm6 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
    ),
    commercial: (
      <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
    ),
    rideshare: (
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 4a4 4 0 0 1 4 4v2M19 7a4 4 0 0 1 0 8" />
    ),
    workplace: (
      <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2H2v2zM10 5V3m4 2V3M7 9.5C7 7 9 5 12 5s5 2 5 4.5V13H7V9.5z" />
    ),
  }[path]
  return (
    <a href={cta('4th-Button')} className="type-card fade-in" style={{ transitionDelay: `${delay}ms` }}>
      <div className="type-card__icon-wrap">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          {icon}
        </svg>
      </div>
      <h3 className="type-card__title">{title}</h3>
      <p className="type-card__desc">{desc}</p>
      <span className="type-card__cta">Check Your Claim →</span>
    </a>
  )
}

export default function CheckMyClaimHome() {
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    )
    document.querySelectorAll('[class*="fade"]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const scrollTo = (sel: string) => {
    const el = document.querySelector(sel)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
    setMobileOpen(false)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <nav className="navbar">
        <div className="navbar__inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_LIGHT} alt="Check My Claim" className="navbar__logo" />

          <div className="navbar__links">
            <button className="navbar__link" onClick={() => scrollTo('#home')}>Home</button>
            <button className="navbar__link" onClick={() => scrollTo('#services')}>Services</button>
            <button className="navbar__link" onClick={() => scrollTo('#about')}>About Us</button>
            <button className="navbar__link" onClick={() => scrollTo('#faq')}>FAQ</button>
            <button className="navbar__link" onClick={() => scrollTo('#contact')}>Contact Us</button>
          </div>

          <a href={cta('2nd-Button')} className="btn-nav">Start Your Free Claim Check</a>

          <button className="navbar__hamburger" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={`navbar__mobile${mobileOpen ? ' open' : ''}`}>
          <div className="navbar__mobile-inner">
            <button className="navbar__mobile-link" onClick={() => scrollTo('#home')}>Home</button>
            <button className="navbar__mobile-link" onClick={() => scrollTo('#services')}>Services</button>
            <button className="navbar__mobile-link" onClick={() => scrollTo('#about')}>About Us</button>
            <button className="navbar__mobile-link" onClick={() => scrollTo('#faq')}>FAQ</button>
            <button className="navbar__mobile-link" onClick={() => scrollTo('#contact')}>Contact Us</button>
          </div>
        </div>
      </nav>

      <section className="hero" id="home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HERO_BG} alt="" className="hero__bg-img" fetchPriority="high" decoding="async" />
        <div className="hero__overlay" />
        <div className="hero__pattern" />

        <div className="hero__content">
          <div className="hero__inner">
            <div className="hero__badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              100% Free • No Win, No Fee • Fast Results
            </div>

            <h1 className="hero__heading">
              Check Your Claim,
              <br />
              <span className="hero__heading-gradient">Get What You Deserve</span>
            </h1>

            <p className="hero__sub">
              Unsure if you have a case after an accident? Our AI tool instantly checks if you may qualify for compensation and matches you with the
              best-suited attorney, at no upfront cost.
            </p>

            <div className="hero__cta-row">
              <a href={cta('1st-Button')} className="btn-hero">
                Start Your Free Claim Check
              </a>
              <span className="hero__cta-sub">Takes less than 2 minutes</span>
            </div>

            <div className="hero__pills">
              <div className="hero__pill">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                </svg>
                <span className="hero__pill-text">Vetted Attorneys Only</span>
              </div>
              <div className="hero__pill">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span className="hero__pill-text">No Upfront Fees</span>
              </div>
              <div className="hero__pill">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="hero__pill-text">Results in Minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-banner">
        <div className="trust-banner__inner">
          <div className="trust-banner__item">
            <span className="trust-banner__label">100% FREE</span>
            <span className="trust-banner__dot" />
          </div>
          <div className="trust-banner__item">
            <span className="trust-banner__label">NO WIN, NO FEE</span>
            <span className="trust-banner__dot" />
          </div>
          <div className="trust-banner__item">
            <span className="trust-banner__label">FAST RESULTS</span>
            <span className="trust-banner__dot" />
          </div>
          <div className="trust-banner__item">
            <span className="trust-banner__label">VETTED ATTORNEYS</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__header fade-in">
            <h2 className="section__heading">Real Stories, Real Results</h2>
            <p className="section__sub">
              Don&apos;t just take our word for it. Hear from real people who used Check My Claim to get the compensation they deserved.
            </p>
          </div>

          <div className="reviews-grid">
            <ReviewCard
              initials="JL"
              bg="#111E30"
              name="Jason Lambert"
              ago="1 Month ago"
              stars={5}
              text="I had no clue how to handle my claim after my crash, but they did everything. Start to finish: professional, efficient, and got me the best possible outcome."
              delay={0}
            />
            <ReviewCard
              initials="DH"
              bg="#0285E9"
              name="Dana Hopson"
              ago="2 Weeks ago"
              stars={5}
              text="My car was totaled, and I had no idea what to do next. Thanks to Check My Claim, I received compensation fast, and it was more than I expected!"
              delay={80}
            />
            <ReviewCard
              initials="KB"
              bg="#0486e9"
              name="Kyle Benavides"
              ago="4 Months ago"
              stars={4}
              text="I wasn't sure at first but really check a case turned out to be a blessing! We got connected with top specialists and our claim was handled smoothly."
              delay={160}
            />
            <ReviewCard
              initials="TO"
              bg="#111E30"
              name="Trevon Obral"
              ago="3 Weeks ago"
              stars={5}
              text="Got covered for all the damage and had money to spare. Check My Claim came through fast and they were a pleasure to deal with."
              delay={240}
            />
          </div>
        </div>
      </section>

      <section className="section section--grey" id="services">
        <div className="container">
          <div className="section__header fade-in">
            <h2 className="section__heading">We&apos;re Accident Compensation Specialists</h2>
            <p className="section__sub">
              Every case is special. Our team is large and diverse, but our mission is singular: To deliver the best results for you and your family.
            </p>
          </div>

          <div className="types-grid">
            <TypeCard title="Auto Accidents" desc="Getting paid for your injury shouldn't be an accident." delay={0} path="auto" />
            <TypeCard
              title="Commercial Accidents"
              desc="Get the compensation you deserve from commercial vehicle incidents."
              delay={80}
              path="commercial"
            />
            <TypeCard title="Ride Share Accidents" desc="Don't let ride share companies deny your rightful claim." delay={160} path="rideshare" />
            <TypeCard title="Work Place Accidents" desc="Filing an injury claim shouldn't feel like working another job." delay={240} path="workplace" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="two-col">
            <div className="fade-left" style={{ position: 'relative' }}>
              <div className="panel-dark">
                <div
                  style={{
                    width: 80,
                    height: 80,
                    background: 'linear-gradient(135deg,#4ba8ee,#0486e9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    borderRadius: '50%',
                  }}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <p style={{ color: 'white', fontSize: '2rem', fontWeight: 700, marginBottom: 12 }}>Free Claim Check</p>
                <p style={{ color: '#d1d5db', marginBottom: 24 }}>Find out in minutes if you may qualify</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
                  <span className="tag-pill">Auto</span>
                  <span className="tag-pill">Slip &amp; Fall</span>
                  <span className="tag-pill">Work</span>
                  <span className="tag-pill">Medical</span>
                </div>
              </div>
              <div className="stat-badge">
                <p style={{ color: '#0285E9', fontWeight: 800, fontSize: '1.25rem' }}>$0</p>
                <p style={{ color: '#595E64', fontSize: '0.75rem' }}>Upfront Cost</p>
              </div>
            </div>

            <div className="fade-right">
              <h2 className="section__heading">Who Can Check My Claim Help?</h2>
              <p className="section__sub" style={{ marginBottom: 32 }}>
                If you&apos;ve been in an accident, you might benefit from our free claim check. Here&apos;s who we&apos;re here for:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 40 }}>
                {[
                  'Injured in a car, truck, or rideshare accident in the last 12 months',
                  'Struggling with medical bills, lost wages, or ongoing pain after a crash',
                  'Unsure if you have a valid claim or if insurance offered enough',
                  'Looking for a trusted way to connect with an attorney at no upfront cost',
                ].map((t) => (
                  <div className="bullet-row" key={t}>
                    <div className="bullet-row__icon" />
                    <p className="bullet-row__text">{t}</p>
                  </div>
                ))}
              </div>

              <a
                href={cta('5th-Button')}
                style={{
                  background: 'linear-gradient(90deg,#4ba8ee,#0486e9)',
                  color: 'white',
                  fontWeight: 700,
                  padding: '16px 32px',
                  borderRadius: 9999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                See If You Qualify Now
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__header fade-in" style={{ marginBottom: 64 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'linear-gradient(90deg,#4ba8ee,#0486e9)',
                color: 'white',
                fontWeight: 700,
                fontSize: 14,
                padding: '10px 20px',
                borderRadius: 9999,
                marginBottom: 16,
              }}
            >
              YOUR JOURNEY TO JUSTICE
            </div>
            <h2 className="section__heading">From Confusion to Clarity</h2>
            <p className="section__sub">See how Check My Claim transforms your accident recovery experience</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48, maxWidth: 1152, margin: '0 auto 64px' }}>
            <div
              className="fade-left"
              style={{ background: 'linear-gradient(to bottom right, #fef2f2, rgba(254,226,226,.50))', borderRadius: 24, padding: 40 }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#ef4444',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 12,
                  padding: '8px 16px',
                  borderRadius: 9999,
                  marginBottom: 24,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                BEFORE
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111E30', marginBottom: 24 }}>Without Check My Claim</h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 16, listStyle: 'none' }}>
                {[
                  'Stressed and unsure if you even have a case',
                  'Buried in medical bills or lost income with no help',
                  'Confused by insurance offers or legal steps',
                ].map((t) => (
                  <li key={t} style={{ display: 'flex', gap: 12 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 2 }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span style={{ color: '#595E64' }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="fade-right"
              style={{ background: 'linear-gradient(to bottom right, #f0fdf4, rgba(220,252,231,.50))', borderRadius: 24, padding: 40 }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#22c55e',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 12,
                  padding: '8px 16px',
                  borderRadius: 9999,
                  marginBottom: 24,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                AFTER
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111E30', marginBottom: 24 }}>With Check My Claim</h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 16, listStyle: 'none' }}>
                {[
                  'Clear answers on whether you might qualify for a claim in minutes',
                  'Matched with a top attorney suited to your case, at no upfront cost',
                  "Peace of mind knowing someone's fighting for what you might deserve",
                ].map((t) => (
                  <li key={t} style={{ display: 'flex', gap: 12 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 2 }}>
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span style={{ color: '#595E64' }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            style={{
              textAlign: 'center',
              maxWidth: 896,
              margin: '0 auto',
              background: 'linear-gradient(135deg,#111E30,#0C1A2A,#1B2737)',
              borderRadius: 24,
              padding: 40,
            }}
          >
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: 16 }}>Ready to Transform Your Situation?</h3>
            <p style={{ color: '#d1d5db', fontSize: '1.125rem', marginBottom: 32, maxWidth: 512, marginLeft: 'auto', marginRight: 'auto' }}>
              Join thousands who&apos;ve found clarity, justice, and compensation through Check My Claim
            </p>
            <a
              href={cta('8th-Button')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                background: 'linear-gradient(90deg,#4ba8ee,#0486e9)',
                color: 'white',
                fontWeight: 700,
                padding: '20px 40px',
                borderRadius: 9999,
                fontSize: '1.125rem',
              }}
            >
              Start Your Free Claim Check Now
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
            <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 16 }}>✓ 100% Free &nbsp;•&nbsp; ✓ No Obligation &nbsp;•&nbsp; ✓ Takes 2 Minutes</p>
          </div>
        </div>
      </section>

      <footer className="footer" id="contact">
        <div className="footer__inner">
          <div className="footer__grid">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_DARK} alt="Check My Claim" className="footer__logo" />
              <p className="footer__desc">
                Empowering accident victims with free, AI-powered claim checks and connections to top-rated attorneys. No win, no fee.
              </p>
            </div>

            <div>
              <h3 className="footer__heading">Quick Links</h3>
              <a href="#home" className="footer__link">Home</a>
              <a href="#about" className="footer__link">About Us</a>
              <a href="#services" className="footer__link">Services</a>
              <a href="#faq" className="footer__link">FAQ</a>
            </div>

            <div>
              <h3 className="footer__heading">Contact</h3>
              <a href="mailto:support@checkmyclaim.com" className="footer__contact-row">
                <span>📧</span>
                support@checkmyclaim.com
              </a>
              <a href={`tel:${PHONE_PRIMARY_TEL}`} className="footer__contact-row">
                <span>📞</span>
                {PHONE_PRIMARY_DISPLAY}
              </a>
            </div>
          </div>

          <div className="footer__bottom">
            <div className="footer__copyright">© 2026 Check My Claim. All rights reserved.</div>
            <div className="footer__legal">
              Check My Claim is not a law firm and does not provide legal advice. Results are for informational purposes only and do not guarantee
              compensation.
            </div>
            <div className="footer__policy-links">
              <a href="/PrivacyPolicy" className="footer__policy-link">Privacy Policy</a>
              <a href="/TermsOfService" className="footer__policy-link">Terms &amp; Conditions</a>
              <a href="/AdvertisingDisclosure" className="footer__policy-link">Advertising Disclosure</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

const CSS = `
/* High-specificity overrides for site-shell brand vars from PublicLayout. */
html.site-shell .hero h1, html.site-shell .hero__heading,
html.site-shell .hero__heading .hero__heading-gradient { color: #ffffff; }
html.site-shell .hero__heading .hero__heading-gradient { background: linear-gradient(90deg,#4ba8ee,#0486e9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
html.site-shell .hero__sub { color: #d1d5db; }
html.site-shell .hero__cta-sub { color: #9ca3af; }
html.site-shell .hero__pill-text { color: rgba(255,255,255,.80); }
html.site-shell .trust-banner__label { color: #ffffff; }
html.site-shell .panel-dark, html.site-shell .panel-dark p, html.site-shell .panel-dark h1, html.site-shell .panel-dark h2, html.site-shell .panel-dark h3, html.site-shell .panel-dark span { color: #ffffff; }
html.site-shell .btn-nav, html.site-shell .btn-hero, html.site-shell a.btn-nav, html.site-shell a.btn-hero { color: #ffffff; }
html.site-shell .footer, html.site-shell .footer h1, html.site-shell .footer h2, html.site-shell .footer h3, html.site-shell .footer__heading, html.site-shell .footer__logo + .footer__desc { color: #ffffff; }
html.site-shell .footer .footer__link, html.site-shell .footer .footer__contact-row, html.site-shell .footer .footer__policy-link { color: rgba(255,255,255,.70); }
html.site-shell .footer .footer__link:hover, html.site-shell .footer .footer__contact-row:hover, html.site-shell .footer .footer__policy-link:hover { color: var(--color-blue-start); }

:root {
  --color-navy: #111E30;
  --color-navy-dark: #0C2D5B;
  --color-blue: #0285E9;
  --color-blue-start: #4ba8ee;
  --color-blue-end: #0486e9;
  --color-muted: #595E64;
  --color-bg-light: #F9F9FB;
  --color-border: #e5e7eb;
  --grad-blue: linear-gradient(90deg, #4ba8ee, #0486e9);
  --grad-blue-135: linear-gradient(135deg, #4ba8ee, #0486e9);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-pill: 9999px;
}

html.site-shell, html.site-shell body { background: #ffffff; color: var(--color-navy); margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.5; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
html.site-shell * { box-sizing: border-box; }
html.site-shell h1, html.site-shell h2, html.site-shell h3, html.site-shell h4, html.site-shell h5, html.site-shell h6 { line-height: 1.1; color: var(--color-navy); font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
html.site-shell a { color: inherit; text-decoration: none; }

button { cursor: pointer; background: none; border: none; font: inherit; color: inherit; }
img, video { display: block; max-width: 100%; height: auto; }

.navbar { position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,.10), 0 2px 4px -2px rgba(0,0,0,.10); }
.navbar__inner { max-width: 1280px; margin-inline: auto; padding-inline: 16px; display: flex; align-items: center; justify-content: space-between; height: 80px; }
.navbar__logo { height: 40px; width: auto; flex-shrink: 0; }
.navbar__links { display: none; align-items: center; gap: 32px; }
.navbar__link { font-size: 0.875rem; font-weight: 500; letter-spacing: 0.05em; color: var(--color-navy); transition: color 0.2s ease; padding: 0; }
.navbar__link:hover { color: var(--color-blue); }
.btn-nav { display: none; background: var(--grad-blue); color: #ffffff; font-weight: 600; font-size: 0.875rem; padding: 10px 20px; border-radius: var(--radius-pill); transition: opacity 0.2s; }
.btn-nav:hover { opacity: 0.9; }
.navbar__hamburger { display: flex; padding: 8px; border-radius: 8px; color: var(--color-navy); }
.navbar__mobile { overflow: hidden; max-height: 0; opacity: 0; transition: max-height 0.3s ease, opacity 0.3s ease; background: #ffffff; border-top: 1px solid var(--color-border); box-shadow: 0 20px 25px -5px rgba(0,0,0,.10); }
.navbar__mobile.open { max-height: 384px; opacity: 1; }
.navbar__mobile-inner { padding: 16px; display: flex; flex-direction: column; gap: 4px; }
.navbar__mobile-link { width: 100%; text-align: left; font-weight: 500; color: var(--color-navy); padding: 12px; border-radius: 8px; transition: background-color 0.15s ease; }
.navbar__mobile-link:hover { background-color: rgba(37,144,230,.10); }

@media (min-width: 768px) {
  .navbar__inner { height: 96px; }
  .navbar__logo { height: 56px; }
  .navbar__links { display: flex; }
  .navbar__hamburger { display: none; }
  .navbar__mobile { display: none; }
  .btn-nav { display: block; }
}

.hero { position: relative; min-height: 100vh; display: flex; align-items: center; overflow: hidden; margin-top: 80px; }
.hero__bg-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hero__overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(17,30,48,.95) 0%, rgba(17,30,48,.90) 60%, rgba(12,26,42,.95) 100%); }
.hero__pattern { position: absolute; inset: 0; opacity: 0.03; background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); pointer-events: none; }
.hero__content { position: relative; z-index: 10; max-width: 1280px; margin-inline: auto; padding-inline: 16px; padding-top: 96px; padding-bottom: 64px; width: 100%; }
.hero__inner { max-width: 768px; margin-inline: auto; text-align: center; }
.hero__badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,.10); backdrop-filter: blur(8px); border: 1px solid rgba(2,133,233,.20); border-radius: var(--radius-pill); padding: 8px 16px; margin-bottom: 32px; color: var(--color-blue); font-size: 0.875rem; font-weight: 500; animation: heroFadeUp 0.5s ease both; }
.hero__heading { font-size: clamp(2.25rem, 6vw, 4.5rem); font-weight: 800; color: #ffffff; line-height: 1.08; letter-spacing: -0.02em; margin-bottom: 24px; animation: heroFadeUp 0.6s 0.1s ease both; }
.hero__heading-gradient { background: var(--grad-blue); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.hero__sub { font-size: 1.125rem; color: #d1d5db; line-height: 1.625; margin-bottom: 40px; max-width: 672px; margin-inline: auto; animation: heroFadeUp 0.6s 0.2s ease both; }
.hero__cta-row { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; margin-bottom: 56px; animation: heroFadeUp 0.6s 0.3s ease both; }
.hero__cta-sub { color: #9ca3af; font-size: 0.875rem; }
.btn-hero { display: inline-flex; align-items: center; gap: 12px; background: var(--grad-blue); color: #ffffff; font-weight: 700; font-size: 1rem; padding: 16px 32px; border-radius: var(--radius-pill); box-shadow: 0 0 0 0 rgba(2,133,233,.3); transition: box-shadow 0.3s ease, transform 0.2s ease; }
.btn-hero:hover { box-shadow: 0 8px 30px rgba(2,133,233,.35); transform: scale(1.04); }
.hero__pills { display: grid; grid-template-columns: 1fr; gap: 16px; max-width: 672px; margin-inline: auto; animation: heroFadeUp 0.7s 0.45s ease both; }
.hero__pill { display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(255,255,255,.05); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,.10); border-radius: 12px; padding: 12px 16px; color: rgba(255,255,255,.80); }
.hero__pill-text { color: rgba(255,255,255,.80); font-size: 0.875rem; font-weight: 500; }

@keyframes heroFadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
@media (min-width: 640px) { .hero__pills { grid-template-columns: repeat(3, 1fr); } .hero__cta-row { flex-direction: row; } }
@media (min-width: 768px) { .hero__content { padding-top: 128px; padding-bottom: 96px; } .hero__sub { font-size: 1.25rem; } }

.trust-banner { position: relative; padding-block: 20px; overflow: hidden; background: var(--grad-blue); }
.trust-banner__inner { max-width: 1280px; margin-inline: auto; padding-inline: 16px; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px 32px; }
.trust-banner__item { display: flex; align-items: center; gap: 12px; }
.trust-banner__label { color: #ffffff; font-weight: 800; font-size: 0.875rem; letter-spacing: 0.15em; text-transform: uppercase; }
.trust-banner__dot { display: none; width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,.60); }
@media (min-width: 640px) { .trust-banner__label { font-size: 1rem; } .trust-banner__dot { display: block; } }

.fade-in { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease, transform 0.5s ease; }
.fade-in.visible { opacity: 1; transform: translateY(0); }
.fade-left { opacity: 0; transform: translateX(-30px); transition: opacity 0.5s ease, transform 0.5s ease; }
.fade-left.visible { opacity: 1; transform: translateX(0); }
.fade-right { opacity: 0; transform: translateX(30px); transition: opacity 0.5s ease, transform 0.5s ease; }
.fade-right.visible { opacity: 1; transform: translateX(0); }
@media (prefers-reduced-motion: reduce) { .fade-in, .fade-left, .fade-right { opacity: 1; transform: none; transition: none; } }

.section { padding-block: 80px; overflow: hidden; }
.section--grey { background-color: var(--color-bg-light); }
.container { max-width: 1280px; margin-inline: auto; padding-inline: 16px; }
.section__header { text-align: center; margin-bottom: 56px; }
.section__heading { font-size: clamp(1.875rem, 4vw, 3rem); font-weight: 800; color: var(--color-navy); margin-bottom: 16px; line-height: 1.2; }
.section__sub { color: var(--color-muted); font-size: 1.125rem; max-width: 672px; margin-inline: auto; line-height: 1.625; }
@media (min-width: 768px) { .section { padding-block: 112px; } }

.reviews-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
.review-card { background: #ffffff; border: 1px solid #f3f4f6; border-radius: 16px; padding: 24px; box-shadow: 0 1px 2px 0 rgba(0,0,0,.05); transition: box-shadow 0.5s ease; }
.review-card:hover { box-shadow: 0 20px 25px -5px rgba(0,0,0,.10); }
.review-card__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.review-card__author { display: flex; align-items: center; gap: 12px; }
.review-card__avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.review-card__avatar-text { color: #ffffff; font-size: 0.875rem; font-weight: 700; }
.review-card__name { font-weight: 600; color: var(--color-navy); font-size: 0.875rem; }
.review-card__time { font-size: 0.75rem; color: var(--color-muted); }
.review-card__stars { display: flex; gap: 2px; }
.review-card__text { margin-top: 16px; color: var(--color-muted); font-size: 0.875rem; line-height: 1.625; }
@media (min-width: 640px) { .reviews-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .reviews-grid { grid-template-columns: repeat(4, 1fr); } }

.types-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
.type-card { background: #ffffff; border: 1px solid #f3f4f6; border-radius: 16px; padding: 32px; text-align: center; display: block; transition: border-color 0.5s ease, box-shadow 0.5s ease; color: inherit; }
.type-card:hover { border-color: rgba(2,133,233,.30); box-shadow: 0 20px 25px -5px rgba(0,0,0,.10); }
.type-card__icon-wrap { width: 64px; height: 64px; border-radius: 50%; background: var(--grad-blue-135); display: flex; align-items: center; justify-content: center; margin-inline: auto; margin-bottom: 20px; transition: transform 0.5s ease; }
.type-card:hover .type-card__icon-wrap { transform: scale(1.1); }
.type-card__title { font-size: 1.125rem; font-weight: 700; color: var(--color-navy); margin-bottom: 8px; }
.type-card__desc { color: var(--color-muted); font-size: 0.875rem; line-height: 1.625; margin-bottom: 16px; }
.type-card__cta { color: var(--color-blue); font-weight: 600; font-size: 0.875rem; }
.type-card:hover .type-card__cta { text-decoration: underline; }
@media (min-width: 640px) { .types-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .types-grid { grid-template-columns: repeat(4, 1fr); } }

.two-col { display: grid; grid-template-columns: 1fr; gap: 48px; align-items: center; }
@media (min-width: 1024px) { .two-col { grid-template-columns: repeat(2, 1fr); gap: 64px; } }
.panel-dark { border-radius: 24px; padding: 40px; text-align: center; background: linear-gradient(135deg, #111E30, #0C1A2A); position: relative; }
@media (min-width: 768px) { .panel-dark { padding: 56px; } }
.tag-pill { background: rgba(255,255,255,.10); border: 1px solid rgba(255,255,255,.10); color: #ffffff; font-size: 0.75rem; font-weight: 500; padding: 6px 12px; border-radius: var(--radius-pill); display: inline-block; }

.stat-badge { position: absolute; bottom: -16px; right: -16px; background: #ffffff; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,.25); padding: 12px 20px; border: 4px solid #F9F9FB; }

.bullet-row { display: flex; align-items: flex-start; gap: 12px; }
.bullet-row__icon { width: 12px; height: 12px; border-radius: 50%; background: var(--grad-blue-135); flex-shrink: 0; margin-top: 8px; box-shadow: 0 0 0 4px rgba(2,133,233,.10); }
.bullet-row__text { color: var(--color-muted); font-size: 1rem; line-height: 1.625; margin: 0; }

.footer { background: linear-gradient(135deg, #0a1f3d, #0d2847 50%, #0a1f3d); color: #ffffff; padding-block: 64px 32px; }
.footer__inner { max-width: 1280px; margin-inline: auto; padding-inline: 16px; }
.footer__grid { display: grid; grid-template-columns: 1fr; gap: 40px; padding-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,.10); }
@media (min-width: 768px) { .footer__grid { grid-template-columns: 2fr 1fr 1fr; gap: 64px; } }
.footer__logo { height: 48px; width: auto; margin-bottom: 20px; }
.footer__desc { color: rgba(255,255,255,.70); font-size: 0.95rem; line-height: 1.625; max-width: 420px; }
.footer__heading { font-size: 1rem; font-weight: 700; color: #ffffff; margin-bottom: 16px; letter-spacing: 0.05em; }
.footer__link { display: block; color: rgba(255,255,255,.70); padding: 6px 0; font-size: 0.95rem; transition: color 0.2s; }
.footer__link:hover { color: var(--color-blue-start); }
.footer__contact-row { display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,.70); padding: 6px 0; font-size: 0.95rem; transition: color 0.2s; }
.footer__contact-row:hover { color: var(--color-blue-start); }
.footer__bottom { padding-top: 32px; display: flex; flex-direction: column; gap: 16px; align-items: center; text-align: center; }
.footer__copyright { font-size: 0.875rem; color: rgba(255,255,255,.50); }
.footer__legal { font-size: 0.75rem; color: rgba(255,255,255,.40); max-width: 768px; line-height: 1.625; }
.footer__policy-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 24px; padding-top: 8px; }
.footer__policy-link { font-size: 0.875rem; color: rgba(255,255,255,.60); transition: color 0.2s; }
.footer__policy-link:hover { color: var(--color-blue-start); }
@media (min-width: 768px) { .footer__bottom { flex-direction: row; justify-content: space-between; text-align: left; align-items: flex-start; } .footer__policy-links { justify-content: flex-end; } }
`
