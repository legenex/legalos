import Link from 'next/link'
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
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)]/40 bg-[var(--color-canvas)]/80 backdrop-blur-md">
      <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-[19px] font-bold tracking-tight">
            <span className="text-[var(--color-brand-strong)]">Legal</span>
            <span className="text-white">OS</span>
          </span>
          <span className="text-[11px] text-[var(--color-ink-muted)] border border-[var(--color-border-strong)] rounded-full px-2 py-0.5">
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
        <Link
          href="/admin"
          className="brand-gradient text-white text-[14px] font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
        >
          Login
        </Link>
      </div>
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Hero                                    */
/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section id="home" className="relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[1100px] rounded-full bg-gradient-to-b from-[var(--color-brand-from)]/12 via-[var(--color-brand-to)]/6 to-transparent blur-3xl" />
        <div className="absolute top-[60%] right-0 w-[600px] h-[600px] rounded-full bg-[var(--color-info)]/8 blur-3xl" />
      </div>

      <div className="relative max-w-[1280px] mx-auto px-6 pt-20 pb-12 text-center">
        <Pill tone="cyan">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-info)] mr-2" />
          AI Operating System for Legal Brand Creation
        </Pill>

        <h1 className="mt-8 text-[64px] md:text-[88px] font-black tracking-[-0.03em] leading-[0.95] text-white">
          Build Legal Brands
          <br />
          <span className="bg-gradient-to-r from-[#FF5C75] via-[#C8B7C2] to-[#5CC1E1] bg-clip-text text-transparent">
            at AI Speed
          </span>
        </h1>

        <p className="mt-8 max-w-[680px] mx-auto text-[17px] leading-relaxed text-[var(--color-ink-muted)]">
          LegalOS helps Legenex create intelligent legal acquisition brands, build conversion-focused funnels,
          generate campaign assets, structure qualification flows, and manage brand systems from one AI-powered platform.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/admin"
            className="brand-gradient text-white text-[15px] font-semibold px-6 py-3.5 rounded-full inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
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
            className="text-[15px] font-semibold text-[var(--color-info)] px-4 py-3.5 inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            See How It Works <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <DashboardPreview />
      </div>
    </section>
  )
}

function DashboardPreview() {
  return (
    <div className="mt-16 relative max-w-[960px] mx-auto">
      <div className="absolute -top-3 right-4 z-10 inline-flex items-center gap-1.5 text-[12px] text-[var(--color-info)] bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] rounded-full px-3 py-1.5">
        <Activity className="w-3.5 h-3.5" />
        AI Active
      </div>
      <div className="rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-surface-1)] shadow-2xl shadow-black/40 overflow-hidden">
        <div className="h-9 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center px-4 gap-2">
          <span className="w-3 h-3 rounded-full bg-[#ED6A5E]" />
          <span className="w-3 h-3 rounded-full bg-[#F5BF4F]" />
          <span className="w-3 h-3 rounded-full bg-[#62C554]" />
          <div className="ml-4 flex-1 text-center text-[12px] text-[var(--color-ink-muted)] font-mono">
            os.legenex.com / admin
          </div>
        </div>
        <div className="p-6 grid grid-cols-3 gap-4">
          <PreviewStat label="Active Brands" value="12" tone="red" />
          <PreviewStat label="Live Funnels" value="34" tone="cyan" />
          <PreviewStat label="Leads This Month" value="4.2k" tone="green" />
        </div>
        <div className="px-6 pb-6 grid grid-cols-2 gap-3">
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
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-center">
      <p className="text-[32px] font-bold leading-none" style={{ color }}>{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] mt-2">{label}</p>
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
    <section id="about" className="border-t border-[var(--color-border)]/40 py-24">
      <div className="max-w-[1280px] mx-auto px-6">
        <header className="text-center max-w-[760px] mx-auto">
          <Pill tone="cyan">● ABOUT LEGALOS</Pill>
          <h2 className="mt-6 text-[44px] md:text-[52px] font-bold tracking-tight text-white leading-tight">
            One platform. Every brand system.
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-[var(--color-ink-muted)]">
            LegalOS is an AI-powered internal operating system that helps Legenex turn legal campaign ideas into
            structured brands, landing pages, funnels, and acquisition systems faster and with greater consistency
            than any manual process.
          </p>
        </header>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <AboutCard key={c.title} icon={c.icon} title={c.title} body={c.body} tone={c.tone} />
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)]/60 p-6">
          <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">
            Legal Verticals
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {verticals.map((v) => (
              <span
                key={v}
                className="text-[13px] text-[var(--color-ink)] border border-[var(--color-border-strong)] bg-[var(--color-surface-2)]/60 rounded-full px-3.5 py-1.5"
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
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-6 hover:bg-[var(--color-surface-2)] transition-colors card-edge">
      <span
        className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-5"
        style={{ background: iconBg, boxShadow: `inset 0 0 0 1px ${ringColor}` }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </span>
      <h3 className="text-[17px] font-bold text-white">{title}</h3>
      <p className="mt-2.5 text-[14px] leading-relaxed text-[var(--color-ink-muted)]">{body}</p>
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
    <section id="features" className="border-t border-[var(--color-border)]/40 py-24">
      <div className="max-w-[1280px] mx-auto px-6">
        <header className="text-center max-w-[760px] mx-auto">
          <Pill tone="red">● PLATFORM FEATURES</Pill>
          <h2 className="mt-6 text-[44px] md:text-[52px] font-bold tracking-tight text-white leading-tight">
            Everything the growth engine needs
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-[var(--color-ink-muted)]">
            From first brand concept to live acquisition system, LegalOS handles every layer of the build.
          </p>
        </header>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {features.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} body={f.body} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon: Icon, title, body }: { icon: typeof Brain; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5 hover:bg-[var(--color-surface-2)] hover:border-[var(--color-border-strong)] transition-colors">
      <Icon className="w-5 h-5 text-[var(--color-ink-muted)] mb-4" />
      <h3 className="text-[14px] font-bold text-white leading-snug">{title}</h3>
      <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--color-ink-muted)]">{body}</p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Tech                                    */
/* -------------------------------------------------------------------------- */

function TechSection() {
  return (
    <section id="tech" className="border-t border-[var(--color-border)]/40 py-24">
      <div className="max-w-[1280px] mx-auto px-6">
        <header className="text-center max-w-[760px] mx-auto">
          <Pill tone="cyan">● TECHNOLOGY</Pill>
          <h2 className="mt-6 text-[44px] md:text-[52px] font-bold tracking-tight text-white leading-tight">
            AI-driven from input to launch
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-[var(--color-ink-muted)]">
            A structured AI pipeline that transforms a vertical selection into a complete, launch-ready legal acquisition brand.
          </p>
        </header>

        <div className="mt-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)]/60 p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
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

        <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)]/60 p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
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
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-6 card-edge">
      <p className="text-[34px] font-bold text-[var(--color-ink-dim)]/40 leading-none">{n}</p>
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
  return (
    <section id="contact" className="border-t border-[var(--color-border)]/40 py-24">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="relative rounded-3xl border border-[var(--color-border-strong)] bg-gradient-to-b from-[var(--color-surface-1)] to-[var(--color-canvas)] p-12 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-[var(--color-brand-from)]/8 blur-3xl" />
          </div>
          <div className="relative">
            <Pill tone="red">● BUILT FOR LEGENEX</Pill>
            <h2 className="mt-6 text-[40px] md:text-[48px] font-bold tracking-tight text-white leading-tight">
              Built for the Legenex growth engine.
            </h2>
            <p className="mt-5 max-w-[680px] mx-auto text-[16px] leading-relaxed text-[var(--color-ink)]">
              LegalOS helps the team move from campaign idea to launch-ready legal acquisition brand faster.
            </p>
            <p className="mt-4 max-w-[680px] mx-auto text-[14px] leading-relaxed text-[var(--color-ink-muted)]">
              Every vertical, every brand, every funnel — one intelligent system. The platform handles brand creation,
              AI content, qualification flows, compliance review, attribution wiring, and campaign management so the
              team can focus on strategy and scale.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/admin"
                className="brand-gradient text-white text-[15px] font-semibold px-7 py-3.5 rounded-full inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                Open LegalOS <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="text-[15px] font-semibold text-white px-7 py-3.5 rounded-full inline-flex items-center gap-2 border border-[var(--color-border-strong)] hover:border-white/30 hover:bg-[var(--color-surface-1)] transition-colors"
              >
                View All Features
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Footer                                    */
/* -------------------------------------------------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)]/60 py-14">
      <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="text-[19px] font-bold tracking-tight">
              <span className="text-[var(--color-brand-strong)]">Legal</span>
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
            <span className="w-2 h-2 rounded-full bg-[var(--color-pos)]" />
            System operational
          </div>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">Platform</p>
          <ul className="mt-4 space-y-3 text-[14px] text-[var(--color-ink)]">
            <li><a href="#home" className="hover:text-white">Home</a></li>
            <li><a href="#about" className="hover:text-white">About</a></li>
            <li><a href="#features" className="hover:text-white">Features</a></li>
            <li><a href="#tech" className="hover:text-white">Tech</a></li>
            <li><a href="#contact" className="hover:text-white">Contact</a></li>
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

      <div className="max-w-[1280px] mx-auto px-6 mt-12 pt-6 border-t border-[var(--color-border)]/40 flex flex-wrap items-center justify-between gap-4 text-[12px] text-[var(--color-ink-dim)]">
        <p>© {new Date().getFullYear()} Legenex. All rights reserved.</p>
        <p>
          <a href="mailto:team@legenex.com" className="hover:text-[var(--color-ink)]">team@legenex.com</a>
        </p>
      </div>
    </footer>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Pill                                     */
/* -------------------------------------------------------------------------- */

function Pill({ tone, children }: { tone: 'red' | 'cyan'; children: React.ReactNode }) {
  const color = tone === 'red' ? '#FF5C75' : '#5CC1E1'
  const bg = tone === 'red' ? 'rgba(255,92,117,0.08)' : 'rgba(92,193,225,0.08)'
  const border = tone === 'red' ? 'rgba(255,92,117,0.30)' : 'rgba(92,193,225,0.30)'
  return (
    <span
      className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full"
      style={{ color, background: bg, border: `1px solid ${border}` }}
    >
      {children}
    </span>
  )
}
