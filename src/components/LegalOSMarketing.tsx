'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Brain,
  Layers,
  Sparkles,
  ShieldCheck,
  Globe,
  FileText,
  Target,
  CheckCircle2,
  Zap,
  Settings as SettingsIcon,
  TrendingUp,
  Activity,
  BarChart3,
  Code2,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'

export default function LegalOSMarketing() {
  return (
    <div className="bg-[var(--color-canvas)] text-[var(--color-ink)] min-h-screen">
      <TopNav />
      <Hero />
      <AboutSection />
      <FeaturesSection />
      <TechSection />
      <BuiltForLegenex />
      <Footer />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Top Nav                                   */
/* -------------------------------------------------------------------------- */

function TopNav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[var(--color-surface-1)]/95 backdrop-blur-xl shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]'
          : 'bg-[var(--color-surface-1)]/85 backdrop-blur-md'
      }`}
    >
      {/* always-visible brand gradient bottom border so the nav reads as a distinct bar against the hero */}
      <span
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,92,117,0.6) 30%, rgba(92,193,225,0.6) 70%, transparent 100%)',
        }}
      />
      <div className="max-w-[1280px] mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-[19px] font-bold tracking-tight">
            <span className="brand-gradient-text">Legal</span>
            <span className="text-white">OS</span>
          </span>
          <span className="hidden xs:inline-block text-[11px] text-[var(--color-ink-muted)] border border-[var(--color-border-strong)] rounded-full px-2 py-0.5">
            by Legenex
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[14px] text-[var(--color-ink-muted)]">
          <a href="#home" className="hover:text-white transition-colors">Home</a>
          <a href="#about" className="hover:text-white transition-colors">About</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#tech" className="hover:text-white transition-colors">Tech</a>
          <a href="#contact" className="hover:text-white transition-colors">Contact</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="hidden sm:inline-flex brand-gradient text-white text-[14px] font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            Login
          </Link>
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-[var(--color-border-strong)] text-white hover:bg-[var(--color-surface-1)] transition-colors"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-[var(--color-border)]/40 bg-[var(--color-canvas)]/95 backdrop-blur-xl">
          <nav className="px-5 py-4 flex flex-col gap-1 text-[15px]">
            {[
              ['Home', '#home'],
              ['About', '#about'],
              ['Features', '#features'],
              ['Tech', '#tech'],
              ['Contact', '#contact'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded-lg text-[var(--color-ink)] hover:bg-[var(--color-surface-1)] transition-colors"
              >
                {label}
              </a>
            ))}
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="mt-2 brand-gradient text-center text-white text-[15px] font-semibold px-5 py-3 rounded-full"
            >
              Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Hero                                    */
/* -------------------------------------------------------------------------- */

function Hero() {
  const ref = useRef<HTMLElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: -1000, y: -1000 })
  const [active, setActive] = useState(false)

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    if (!active) setActive(true)
  }
  const onLeave = () => setActive(false)

  return (
    <section
      id="home"
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative overflow-hidden isolate"
    >
      {/* ambient blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[min(1100px,140vw)] aspect-square rounded-full bg-gradient-to-b from-[var(--color-brand-from)]/15 via-[var(--color-brand-to)]/8 to-transparent blur-3xl float-slow" />
        <div className="absolute top-[55%] right-[-15%] w-[600px] h-[600px] rounded-full bg-[var(--color-info)]/10 blur-3xl float-slower" />
        <div className="absolute top-[30%] left-[-10%] w-[420px] h-[420px] rounded-full bg-[var(--color-brand-from)]/8 blur-3xl float-slow" />
      </div>

      {/* grid pattern */}
      <div className="absolute inset-0 hero-grid pointer-events-none" aria-hidden />

      {/* mouse spotlight */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 hidden md:block"
        aria-hidden
        style={{
          opacity: active ? 1 : 0,
          background: `radial-gradient(620px circle at ${pos.x}px ${pos.y}px, rgba(255,92,117,0.18), rgba(92,193,225,0.08) 30%, transparent 55%)`,
        }}
      />

      <div className="relative max-w-[1280px] mx-auto px-5 sm:px-6 pt-16 sm:pt-20 md:pt-24 pb-12 text-center">
        <div className="fade-up">
          <Pill tone="cyan">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#5DC1E2] mr-2 pulse-glow" />
            AI Operating System for Legal Brand Creation
          </Pill>
        </div>

        <h1 className="mt-7 sm:mt-8 text-[40px] xs:text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px] font-black tracking-[-0.03em] leading-[0.95] text-white fade-up" style={{ animationDelay: '0.08s' }}>
          <span className="brand-gradient-text">Legal</span> Brands
          <br />
          <span className="brand-gradient-text">Powered</span> By <span className="brand-gradient-text">AI</span>
        </h1>

        <p
          className="mt-7 sm:mt-8 max-w-[680px] mx-auto text-[15px] sm:text-[17px] leading-relaxed text-[var(--color-ink-muted)] px-2 fade-up"
          style={{ animationDelay: '0.18s' }}
        >
          LegalOS helps Legenex create intelligent legal acquisition brands, build conversion-focused funnels,
          generate campaign assets, structure qualification flows, and manage brand systems from one AI-powered platform.
        </p>

        <div
          className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 fade-up"
          style={{ animationDelay: '0.28s' }}
        >
          <Link
            href="/admin"
            className="brand-gradient text-white text-[15px] font-semibold px-6 py-3.5 rounded-full inline-flex items-center gap-2 hover:opacity-90 hover:scale-[1.02] transition-all shadow-[0_8px_30px_-8px_rgba(255,92,117,0.5)]"
          >
            Explore LegalOS <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="text-[15px] font-semibold text-white px-6 py-3.5 rounded-full inline-flex items-center gap-2 border border-[var(--color-border-strong)] hover:border-white/30 hover:bg-[var(--color-surface-1)] transition-colors"
          >
            View Platform Features
          </a>
          <a
            href="#tech"
            className="text-[15px] font-semibold text-[var(--color-info)] px-4 py-3.5 inline-flex items-center gap-1.5 hover:text-white transition-colors group"
          >
            See How It Works <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        <div className="fade-up" style={{ animationDelay: '0.4s' }}>
          <DashboardPreview />
        </div>
      </div>
    </section>
  )
}

function DashboardPreview() {
  return (
    <div className="mt-12 sm:mt-16 relative max-w-[960px] mx-auto">
      <div className="absolute -top-3 right-4 z-10 inline-flex items-center gap-1.5 text-[12px] text-[var(--color-info)] bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] rounded-full px-3 py-1.5">
        <Activity className="w-3.5 h-3.5 pulse-glow" />
        AI Active
      </div>
      <div className="rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-surface-1)] shadow-2xl shadow-black/40 overflow-hidden">
        <div className="h-9 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center px-4 gap-2">
          <span className="w-3 h-3 rounded-full bg-[#ED6A5E]" />
          <span className="w-3 h-3 rounded-full bg-[#F5BF4F]" />
          <span className="w-3 h-3 rounded-full bg-[#62C554]" />
          <div className="ml-4 flex-1 text-center text-[11px] sm:text-[12px] text-[var(--color-ink-muted)] font-mono truncate">
            os.legenex.com / admin
          </div>
        </div>
        <div className="p-4 sm:p-6 grid grid-cols-3 gap-3 sm:gap-4">
          <PreviewStat label="Active Brands" value="12" tone="red" />
          <PreviewStat label="Live Funnels" value="34" tone="cyan" />
          <PreviewStat label="Leads This Month" value="4.2k" tone="green" />
        </div>
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PreviewRow label="Check My Claim" sub="MVA" status="Active" tone="green" />
          <PreviewRow label="Claim Checker" sub="MVA" status="Active" tone="green" />
          <PreviewRow label="Brand Draft #7" sub="Workers Comp" status="Building" tone="amber" />
          <PreviewRow label="Campaign: Slip & Fall" sub="Personal Injury" status="Draft" tone="cyan" />
        </div>
      </div>
    </div>
  )
}

function PreviewStat({ label, value, tone }: { label: string; value: string; tone: 'red' | 'cyan' | 'green' }) {
  const color = tone === 'red' ? '#FF5C75' : tone === 'cyan' ? '#5CC1E1' : '#2DBE6C'
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 sm:p-4 text-center">
      <p className="text-[24px] sm:text-[32px] font-bold leading-none" style={{ color }}>{value}</p>
      <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] mt-1.5 sm:mt-2">{label}</p>
    </div>
  )
}

function PreviewRow({
  label,
  sub,
  status,
  tone,
}: {
  label: string
  sub: string
  status: string
  tone: 'green' | 'amber' | 'cyan'
}) {
  const dot = tone === 'green' ? '#2DBE6C' : tone === 'amber' ? '#E8B14B' : '#5CC1E1'
  const fg = tone === 'green' ? '#7FE3A8' : tone === 'amber' ? '#F4C97F' : '#9FD8EE'
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 flex items-center gap-3">
      <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-white font-medium truncate">{label}</p>
        <p className="text-[11px] text-[var(--color-ink-dim)]">{sub}</p>
      </div>
      <span className="text-[11px] font-semibold" style={{ color: fg }}>{status}</span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  About                                     */
/* -------------------------------------------------------------------------- */

function AboutSection() {
  const cards = [
    {
      icon: Brain,
      title: 'Brand Builder',
      body: 'AI-guided brand creation from vertical selection to full identity, voice, and domain presence. Go from concept to live brand in hours.',
      tone: 'red' as const,
    },
    {
      icon: Layers,
      title: 'Funnel Architect',
      body: 'Build qualifying funnels, landing pages, and lead capture flows with AI-structured logic, branching, and disqualification routing.',
      tone: 'cyan' as const,
    },
    {
      icon: Sparkles,
      title: 'AI Content Engine',
      body: 'Generate campaign copy, blog content, ad creatives, and qualification scripts calibrated to your legal vertical and brand voice.',
      tone: 'red' as const,
    },
    {
      icon: ShieldCheck,
      title: 'Compliance Workflow',
      body: 'Every asset passes through compliance-aware review stages. TCPA consent, advertising disclosures, and legal copy controls built in.',
      tone: 'cyan' as const,
    },
  ]
  const verticals = [
    'Motor Vehicle Accidents',
    'Workers Compensation',
    'Employment Law',
    'Insurance Claims',
    'Debt Relief',
    'Personal Injury',
    'Mass Tort',
    'Multi-Vertical',
  ]
  return (
    <section
      id="about"
      className="relative bg-[var(--color-surface-1)] border-t border-[var(--color-border-strong)] py-20 sm:py-24 overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF5C75] to-transparent opacity-80" />

        {/* big red glow that visibly sweeps left↔right every 14s */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[600px] glow-sweep"
          style={{
            background:
              'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(255,92,117,0.55) 0%, rgba(239,79,107,0.25) 30%, transparent 65%)',
          }}
        />

        {/* dot pattern */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,92,117,0.22) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage:
              'radial-gradient(ellipse 90% 80% at 50% 50%, black 30%, transparent 90%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 90% 80% at 50% 50%, black 30%, transparent 90%)',
          }}
        />

        {/* base red blobs */}
        <div className="absolute top-[10%] right-[-15%] w-[600px] h-[600px] rounded-full bg-[var(--color-brand-from)]/20 blur-3xl float-slow" />
        <div className="absolute bottom-[5%] left-[-15%] w-[480px] h-[480px] rounded-full bg-[var(--color-brand-strong)]/18 blur-3xl float-slower" />
        <div className="absolute top-[40%] left-[55%] w-[400px] h-[400px] rounded-full bg-[var(--color-info)]/10 blur-3xl pulse-glow" />
      </div>

      <div className="relative max-w-[1280px] mx-auto px-5 sm:px-6">
        <header className="text-center max-w-[760px] mx-auto">
          <Pill tone="cyan">● ABOUT LEGALOS</Pill>
          <h2 className="mt-5 sm:mt-6 text-[32px] sm:text-[44px] md:text-[52px] font-bold tracking-tight text-white leading-tight">
            One platform. <span className="brand-gradient-text">Every brand system.</span>
          </h2>
          <p className="mt-4 sm:mt-5 text-[15px] sm:text-[16px] leading-relaxed text-[var(--color-ink-muted)]">
            LegalOS is an AI-powered internal operating system that helps Legenex turn legal campaign ideas into
            structured brands, landing pages, funnels, and acquisition systems faster and with greater consistency
            than any manual process.
          </p>
        </header>

        <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <AboutCard key={c.title} icon={c.icon} title={c.title} body={c.body} tone={c.tone} />
          ))}
        </div>

        <div className="mt-8 sm:mt-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)]/60 p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">
            Legal Verticals
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {verticals.map((v) => (
              <span
                key={v}
                className="text-[12px] sm:text-[13px] text-[var(--color-ink)] border border-[var(--color-border-strong)] bg-[var(--color-surface-2)]/60 rounded-full px-3 py-1.5 hover:border-[var(--color-brand-from)]/40 hover:text-white transition-colors"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function AboutCard({
  icon: Icon,
  title,
  body,
  tone,
}: {
  icon: typeof Brain
  title: string
  body: string
  tone: 'red' | 'cyan'
}) {
  const ringColor = tone === 'red' ? 'rgba(255,92,117,0.18)' : 'rgba(92,193,225,0.18)'
  const iconColor = tone === 'red' ? '#FF5C75' : '#5CC1E1'
  const iconBg = tone === 'red' ? 'rgba(255,92,117,0.10)' : 'rgba(92,193,225,0.10)'
  const glow = tone === 'red' ? 'rgba(255,92,117,0.18)' : 'rgba(92,193,225,0.18)'
  return (
    <div
      className="group relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-border-strong)] card-edge"
      style={{ ['--glow' as string]: glow }}
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(420px circle at 50% 0%, ${glow}, transparent 60%)` }}
        aria-hidden
      />
      <div className="relative">
        <span
          className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-5 transition-transform duration-300 group-hover:scale-110"
          style={{ background: iconBg, boxShadow: `inset 0 0 0 1px ${ringColor}` }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </span>
        <h3 className="text-[17px] font-bold text-white">{title}</h3>
        <p className="mt-2.5 text-[14px] leading-relaxed text-[var(--color-ink-muted)]">{body}</p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Features                                  */
/* -------------------------------------------------------------------------- */

function FeaturesSection() {
  const features = [
    { icon: Brain, title: 'AI-Assisted Brand Creation', body: 'Generate complete legal brand systems from a single vertical brief.' },
    { icon: FileText, title: 'Landing Page Generation', body: 'Publish conversion-focused legal acquisition pages with full CMS control.' },
    { icon: Target, title: 'Campaign Concept Development', body: 'Structured campaign briefs with angles, headlines, and offer framing.' },
    { icon: Globe, title: 'Vertical-Specific Templates', body: 'Prebuilt systems for MVA, workers comp, employment law, insurance, and more.' },
    { icon: CheckCircle2, title: 'Lead Qualification Logic', body: 'Branching quiz flows with soft/hard DQ rules and disposition routing.' },
    { icon: ShieldCheck, title: 'Compliance Messaging Controls', body: 'Embedded TCPA, disclosure, and advertorial review at every step.' },
    { icon: Zap, title: 'Conversion-Focused Copy Blocks', body: 'Structured block library for hero, trust, testimonials, FAQ, wins, and more.' },
    { icon: SettingsIcon, title: 'Asset and Offer Structuring', body: 'Define, package, and version campaign offers across brands and funnels.' },
    { icon: Layers, title: 'Internal Brand Management', body: 'One dashboard for all brand sites, pages, funnels, numbers, and tracking.' },
    { icon: TrendingUp, title: 'Performance-Ready Systems', body: 'Full attribution stack: UTMs, Meta CAPI, GA4, TikTok Events API, TrustedForm.' },
  ]
  return (
    <section
      id="features"
      className="relative border-t border-[var(--color-border-strong)] py-24 sm:py-28 overflow-hidden bg-gradient-to-b from-[#FFF5F7] via-white to-[#FFF5F7] text-[#1C242E]"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* soft edge fades — blends the white into the surrounding dark sections */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#1C242E]/12 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1C242E]/12 to-transparent" />

        {/* red gradient wash mesh — gives the white some color, not flat */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 15% 20%, rgba(255,92,117,0.14) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 80%, rgba(239,79,107,0.12) 0%, transparent 60%)',
          }}
        />

        {/* dot pattern */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,92,117,0.20) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage:
              'radial-gradient(ellipse 90% 80% at 50% 50%, black 30%, transparent 90%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 90% 80% at 50% 50%, black 30%, transparent 90%)',
          }}
        />

        {/* floating soft blobs */}
        <div className="absolute top-[10%] right-[-15%] w-[520px] h-[520px] rounded-full bg-[#FF5C75]/15 blur-3xl float-slow" />
        <div className="absolute bottom-[10%] left-[-15%] w-[460px] h-[460px] rounded-full bg-[#EF4F6B]/12 blur-3xl float-slower" />

        {/* accent lines on top + bottom for crisp boundary */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF5C75] to-transparent opacity-70" />
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF5C75] to-transparent opacity-50" />
      </div>

      <div className="relative max-w-[1280px] mx-auto px-5 sm:px-6">
        <header className="text-center max-w-[760px] mx-auto">
          <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full text-[#EF4F6B] bg-[#FF5C75]/8 border border-[#FF5C75]/30">
            ● PLATFORM FEATURES
          </span>
          <h2 className="mt-5 sm:mt-6 text-[32px] sm:text-[44px] md:text-[52px] font-bold tracking-tight text-[#1C242E] leading-tight">
            Everything the <span className="brand-gradient-text-rb">growth engine</span> needs
          </h2>
          <p className="mt-4 sm:mt-5 text-[15px] sm:text-[16px] leading-relaxed text-[#5C6376]">
            From first brand concept to live acquisition system, LegalOS handles every layer of the build.
          </p>
        </header>

        <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {features.map((f, i) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} body={f.body} idx={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon: Icon, title, body, idx }: { icon: typeof Brain; title: string; body: string; idx: number }) {
  const colors = ['#FF5C75', '#EF4F6B']
  const color = colors[idx % 2]
  const tint = idx % 2 === 0 ? 'rgba(255,92,117,0.10)' : 'rgba(239,79,107,0.10)'
  return (
    <div
      className="group relative rounded-xl border border-[#E6E8EE] bg-white p-5 transition-all duration-300 hover:border-[#FF5C75]/40 hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(255,92,117,0.45)] overflow-hidden"
    >
      <div
        className="absolute inset-x-0 -top-px h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        aria-hidden
      />
      <span
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg mb-4 transition-transform duration-300 group-hover:scale-110"
        style={{ background: tint, boxShadow: `inset 0 0 0 1px ${color}30` }}
      >
        <Icon className="w-[18px] h-[18px]" style={{ color }} />
      </span>
      <h3 className="text-[14px] font-bold text-[#1C242E] leading-snug">{title}</h3>
      <p className="mt-2 text-[12.5px] leading-relaxed text-[#5C6376]">{body}</p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Tech                                    */
/* -------------------------------------------------------------------------- */

function TechSection() {
  return (
    <section
      id="tech"
      className="relative bg-[var(--color-surface-2)] border-t border-[var(--color-border-strong)] py-20 sm:py-24 overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* cyan top accent line — Legenex info color */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#5CC1E1] to-transparent opacity-80" />

        {/* blueprint grid pattern — distinct from About's dots */}
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage:
              'radial-gradient(ellipse 75% 65% at 50% 50%, black 25%, transparent 80%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 75% 65% at 50% 50%, black 25%, transparent 80%)',
          }}
        />

        {/* cyan/red asymmetric ambient — using Legenex info + brand */}
        <div className="absolute top-[15%] left-[-10%] w-[520px] h-[520px] rounded-full bg-[var(--color-info)]/15 blur-3xl float-slow" />
        <div className="absolute bottom-[10%] right-[-10%] w-[520px] h-[520px] rounded-full bg-[var(--color-brand-from)]/15 blur-3xl float-slower" />
      </div>

      <div className="relative max-w-[1280px] mx-auto px-5 sm:px-6">
        <header className="text-center max-w-[760px] mx-auto">
          <Pill tone="red">● TECHNOLOGY</Pill>
          <h2 className="mt-5 sm:mt-6 text-[32px] sm:text-[44px] md:text-[52px] font-bold tracking-tight text-white leading-tight">
            <span className="brand-gradient-text">AI-driven</span> from input to launch
          </h2>
          <p className="mt-4 sm:mt-5 text-[15px] sm:text-[16px] leading-relaxed text-[var(--color-ink-muted)]">
            A structured AI pipeline that transforms a vertical selection into a complete, launch-ready legal acquisition brand.
          </p>
        </header>

        <div className="mt-10 sm:mt-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)]/60 p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <PipelineColumn
            label="INPUT"
            tone="cyan"
            icon={Target}
            items={['Legal vertical', 'Target geography', 'Offer type', 'Brand intent brief']}
          />
          <PipelineColumn
            label="AI SYSTEM"
            tone="cyan"
            icon={SettingsIcon}
            items={['Brand architecture', 'Funnel structure', 'Copy generation', 'Compliance review', 'Qualification logic']}
          />
          <PipelineColumn
            label="OUTPUT"
            tone="red"
            icon={Zap}
            items={['Live brand site', 'Conversion funnel', 'Campaign assets', 'Qualified lead flow']}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StepCard n="01" title="Choose the Legal Vertical" body="Select from MVA, workers comp, employment, insurance, debt relief, or define a new vertical." />
          <StepCard n="02" title="Generate the Brand Direction" body="AI produces brand name candidates, voice profile, color palette, and domain suggestions." />
          <StepCard n="03" title="Build the Funnel and Qualification Flow" body="Structured quiz steps, branching logic, contact capture, and TCPA consent assembled automatically." />
          <StepCard n="04" title="Launch, Test, and Optimize" body="Deploy with one click. A/B test pages, monitor lead quality, and iterate from the same dashboard." />
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)]/60 p-5 sm:p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <TechCapability icon={Brain} label="LLM Orchestration" tone="red" />
          <TechCapability icon={ShieldCheck} label="Compliance Engine" tone="cyan" />
          <TechCapability icon={BarChart3} label="Attribution Stack" tone="red" />
          <TechCapability icon={Code2} label="Block CMS" tone="cyan" />
        </div>
      </div>
    </section>
  )
}

function PipelineColumn({
  label,
  tone,
  icon: Icon,
  items,
}: {
  label: string
  tone: 'red' | 'cyan'
  icon: typeof Brain
  items: string[]
}) {
  const color = tone === 'red' ? '#FF5C75' : '#5CC1E1'
  const bg = tone === 'red' ? 'rgba(255,92,117,0.08)' : 'rgba(92,193,225,0.08)'
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-5">
        <span
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ background: bg, boxShadow: `inset 0 0 0 1px ${color}33` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </span>
        <span className="text-[13px] font-bold tracking-wider" style={{ color }}>
          {label}
        </span>
      </div>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-[14px] text-[var(--color-ink)]">
            <ChevronRight className="w-3.5 h-3.5" style={{ color }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StepCard({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-6 card-edge transition-all duration-300 hover:border-[var(--color-border-strong)] hover:-translate-y-0.5">
      <p className="text-[34px] font-bold text-[var(--color-ink-dim)]/40 leading-none group-hover:brand-gradient-text transition-all">{n}</p>
      <h3 className="mt-5 text-[15px] font-bold text-white leading-snug">{title}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">{body}</p>
    </div>
  )
}

function TechCapability({ icon: Icon, label, tone }: { icon: typeof Brain; label: string; tone: 'red' | 'cyan' }) {
  const color = tone === 'red' ? '#FF5C75' : '#5CC1E1'
  const bg = tone === 'red' ? 'rgba(255,92,117,0.10)' : 'rgba(92,193,225,0.10)'
  return (
    <div className="flex items-center gap-3">
      <span
        className="inline-flex items-center justify-center w-10 h-10 rounded-lg"
        style={{ background: bg, boxShadow: `inset 0 0 0 1px ${color}33` }}
      >
        <Icon className="w-[18px] h-[18px]" style={{ color }} />
      </span>
      <span className="text-[14px] font-semibold text-white">{label}</span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                            Built for Legenex CTA                           */
/* -------------------------------------------------------------------------- */

function BuiltForLegenex() {
  const ctaRef = useRef<HTMLElement>(null)
  const [ctaPos, setCtaPos] = useState<{ x: number; y: number }>({ x: -1000, y: -1000 })
  const [ctaActive, setCtaActive] = useState(false)

  const onCtaMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = ctaRef.current?.getBoundingClientRect()
    if (!rect) return
    setCtaPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    if (!ctaActive) setCtaActive(true)
  }
  const onCtaLeave = () => setCtaActive(false)

  return (
    <section
      id="contact"
      ref={ctaRef}
      onMouseMove={onCtaMove}
      onMouseLeave={onCtaLeave}
      className="relative py-24 sm:py-32 md:py-40 overflow-hidden text-white isolate"
      style={{
        background:
          'linear-gradient(135deg, #FF5C75 0%, #EF4F6B 35%, #C4365A 70%, #8E2A48 100%)',
      }}
    >
      {/* drifting aurora — animated bg overlay */}
      <div className="absolute inset-0 aurora-cta pointer-events-none" aria-hidden />

      {/* mouse-tracked spotlight — desktop only */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 hidden md:block"
        aria-hidden
        style={{
          opacity: ctaActive ? 1 : 0,
          background: `radial-gradient(720px circle at ${ctaPos.x}px ${ctaPos.y}px, rgba(255,255,255,0.22), rgba(255,255,255,0.08) 25%, transparent 55%)`,
        }}
      />

      {/* layered glow + grid */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[10%] left-[8%] w-[420px] h-[420px] rounded-full bg-white/15 blur-3xl float-slow" />
        <div className="absolute bottom-[5%] right-[6%] w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl float-slower" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-white/5 blur-3xl pulse-glow" />

        {/* fine grid */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage:
              'radial-gradient(ellipse 60% 50% at 50% 50%, black 30%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 60% 50% at 50% 50%, black 30%, transparent 75%)',
          }}
        />

        {/* top/bottom dark fade for separation from neighboring sections */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <div className="relative max-w-[1100px] mx-auto px-5 sm:px-6 text-center">
        <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full text-white bg-white/15 border border-white/30 backdrop-blur-sm">
          ● BUILT FOR LEGENEX
        </span>

        <h2 className="mt-6 sm:mt-8 text-[36px] xs:text-[44px] sm:text-[56px] md:text-[72px] lg:text-[84px] font-black tracking-[-0.03em] text-white leading-[1] sm:leading-[0.98]">
          Built for the
          <br />
          Legenex growth engine.
        </h2>

        <p className="mt-6 sm:mt-8 max-w-[680px] mx-auto text-[16px] sm:text-[18px] leading-relaxed text-white/95">
          LegalOS helps the team move from campaign idea to launch-ready legal acquisition brand faster.
        </p>
        <p className="mt-4 max-w-[680px] mx-auto text-[13px] sm:text-[14px] leading-relaxed text-white/75">
          Every vertical, every brand, every funnel — one intelligent system. The platform handles brand creation,
          AI content, qualification flows, compliance review, attribution wiring, and campaign management so the
          team can focus on strategy and scale.
        </p>

        <div className="mt-9 sm:mt-12 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/admin"
            className="bg-white text-[#C4365A] text-[16px] font-semibold px-8 py-4 rounded-full inline-flex items-center gap-2 hover:scale-[1.03] hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.5)] transition-all"
          >
            Open LegalOS <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="text-[16px] font-semibold text-white px-8 py-4 rounded-full inline-flex items-center gap-2 border border-white/40 hover:border-white hover:bg-white/10 backdrop-blur-sm transition-colors"
          >
            View All Features
          </a>
        </div>

        {/* stats strip */}
        <div className="mt-14 sm:mt-20 grid grid-cols-3 gap-px max-w-[760px] mx-auto rounded-2xl overflow-hidden border border-white/25 bg-white/10 backdrop-blur-sm">
          <StatCell value="10+" label="Legal Verticals" />
          <StatCell value="4.2k" label="Monthly Leads" />
          <StatCell value="< 1hr" label="Brand to Launch" />
        </div>
      </div>
    </section>
  )
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-black/15 backdrop-blur-sm px-4 py-5 sm:py-6 text-center">
      <p className="text-white text-[24px] sm:text-[32px] font-black leading-none">{value}</p>
      <p className="mt-1.5 text-[10px] sm:text-[11px] uppercase tracking-wider text-white/75 font-semibold">{label}</p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Footer                                    */
/* -------------------------------------------------------------------------- */

function Footer() {
  return (
    <footer className="relative bg-[#1C242E] border-t border-[var(--color-border-strong)] py-12 sm:py-14 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-brand-from)]/30 to-transparent" />
        <div className="absolute top-[30%] left-[10%] w-[300px] h-[300px] rounded-full bg-[var(--color-brand-from)]/5 blur-3xl" />
      </div>

      <div className="relative max-w-[1280px] mx-auto px-5 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="text-[19px] font-bold tracking-tight">
              <span className="brand-gradient-text">Legal</span>
              <span className="text-white">OS</span>
            </span>
            <span className="text-[11px] text-[var(--color-ink-muted)] border border-[var(--color-border-strong)] rounded-full px-2 py-0.5">
              by Legenex
            </span>
          </div>
          <p className="mt-4 text-[14px] leading-relaxed text-[var(--color-ink-muted)] max-w-[420px]">
            The AI operating system for legal brand creation. Helping Legenex build intelligent legal acquisition systems faster.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 text-[13px] text-[var(--color-ink-muted)]">
            <span className="w-2 h-2 rounded-full bg-[var(--color-pos)] pulse-glow" />
            System operational
          </div>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">Platform</p>
          <ul className="mt-4 space-y-3 text-[14px] text-[var(--color-ink)]">
            <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
            <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
            <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
            <li><a href="#tech" className="hover:text-white transition-colors">Tech</a></li>
            <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">Product</p>
          <ul className="mt-4 space-y-3 text-[14px] text-[var(--color-ink)]">
            <li><span className="text-[var(--color-ink-muted)]">Brand Builder</span></li>
            <li><span className="text-[var(--color-ink-muted)]">Funnel Architect</span></li>
            <li><span className="text-[var(--color-ink-muted)]">AI Content Engine</span></li>
            <li><span className="text-[var(--color-ink-muted)]">Compliance Workflow</span></li>
            <li><span className="text-[var(--color-ink-muted)]">Lead Infrastructure</span></li>
            <li><span className="text-[var(--color-ink-muted)]">Attribution Stack</span></li>
          </ul>
        </div>
      </div>

      <div className="relative max-w-[1280px] mx-auto px-5 sm:px-6 mt-10 sm:mt-12 pt-6 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-4 text-[12px] text-[var(--color-ink-dim)]">
        <p>© {new Date().getFullYear()} Legenex. All rights reserved.</p>
        <p>
          <a href="mailto:team@legenex.com" className="hover:text-white transition-colors">team@legenex.com</a>
        </p>
      </div>
    </footer>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Pill                                     */
/* -------------------------------------------------------------------------- */

function Pill({ tone, children }: { tone: 'red' | 'cyan'; children: React.ReactNode }) {
  const color = tone === 'red' ? '#FF5C75' : '#5DC1E2'
  const bg = tone === 'red' ? 'rgba(255,92,117,0.08)' : 'rgba(93,193,226,0.08)'
  const border = tone === 'red' ? 'rgba(255,92,117,0.30)' : 'rgba(93,193,226,0.30)'
  return (
    <span
      className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full"
      style={{ color, background: bg, border: `1px solid ${border}` }}
    >
      {children}
    </span>
  )
}
