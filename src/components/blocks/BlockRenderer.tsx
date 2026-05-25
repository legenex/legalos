/**
 * Public Site block renderer. Maps each block type to a React component.
 * Unknown block types render a visible warning instead of silently disappearing.
 *
 * All block data is assumed to be already site-var-substituted upstream (in the catch-all route).
 */
import type { ReactNode } from 'react'
import Link from 'next/link'
import { LeadForm } from './LeadForm'

export type Block = {
  blockType: string
  id?: string
  blockName?: string
  [key: string]: unknown
}

export type SiteForRender = {
  id: string | number
  slug: string
  name?: string | null
  default_phone?: string | null
  default_phone_tel?: string | null
  org_name?: string | null
  org_address?: string | null
  support_email?: string | null
  default_disclaimer_md?: string | null
}

export type RenderContext = {
  site: SiteForRender
  phone: { display: string; tel: string }
  isPreview?: boolean
}

export function BlockRenderer({ blocks, ctx }: { blocks: Block[] | null | undefined; ctx: RenderContext }) {
  if (!blocks || blocks.length === 0) return <FallbackEmpty />
  return (
    <>
      {blocks.map((block, idx) => (
        <BlockDispatch key={block.id ?? `${block.blockType}-${idx}`} block={block} ctx={ctx} />
      ))}
    </>
  )
}

function BlockDispatch({ block, ctx }: { block: Block; ctx: RenderContext }) {
  switch (block.blockType) {
    case 'nav_header':
      return <NavHeader block={block} ctx={ctx} />
    case 'hero':
      return <Hero block={block} ctx={ctx} />
    case 'trust_strip':
      return <TrustStrip block={block} />
    case 'services_grid':
      return <ServicesGrid block={block} />
    case 'how_it_works':
      return <HowItWorks block={block} />
    case 'recent_wins':
      return <RecentWins block={block} />
    case 'stats':
      return <Stats block={block} />
    case 'cards':
      return <Cards block={block} />
    case 'testimonials':
      return <Testimonials block={block} />
    case 'faq':
      return <Faq block={block} />
    case 'bullet_list':
      return <BulletList block={block} />
    case 'cta':
      return <Cta block={block} />
    case 'final_cta':
      return <FinalCta block={block} ctx={ctx} />
    case 'prose':
      return <Prose block={block} />
    case 'image':
      return <ImageBlock block={block} />
    case 'embed':
      return <Embed block={block} />
    case 'custom_html':
      return <CustomHtml block={block} />
    case 'disclosure':
      return <Disclosure block={block} />
    case 'site_footer':
      return <SiteFooter block={block} ctx={ctx} />
    case 'lead_form':
      return <LeadForm block={block as never} site={{ slug: String((ctx.site as { slug?: string }).slug ?? ''), name: ctx.site.name ?? null }} />
    default:
      return <FallbackUnknown blockType={block.blockType} />
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const get = <T,>(block: Block, key: string, fallback?: T): T | undefined => {
  const v = block[key]
  return (v === undefined ? fallback : v) as T | undefined
}

const Container = ({ children, narrow }: { children: ReactNode; narrow?: boolean }) => (
  <div className={`mx-auto px-6 ${narrow ? 'max-w-[760px]' : 'max-w-[1180px]'}`}>{children}</div>
)

const Section = ({ children, dark, alt, id }: { children: ReactNode; dark?: boolean; alt?: boolean; id?: string }) => (
  <section
    id={id}
    style={{
      background: dark ? 'var(--site-ink, #0E1116)' : alt ? 'var(--site-surface-alt, rgba(0,0,0,0.025))' : 'transparent',
      color: dark ? 'var(--site-surface, #fff)' : 'inherit',
      padding: '80px 0',
    }}
  >
    {children}
  </section>
)

// Strip <script> and on*= handlers from custom HTML.
const sanitizeHtml = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')

// Minimal Markdown: paragraphs + line breaks + bold/italic + links.
function MarkdownLite({ source }: { source: string }) {
  const paragraphs = source.trim().split(/\n{2,}/)
  return (
    <>
      {paragraphs.map((p, i) => {
        const withInline = p
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:var(--site-primary);">$1</a>')
          .replace(/\n/g, '<br />')
        return <p key={i} style={{ marginBottom: 16, lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: withInline }} />
      })}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Nav Header                                  */
/* -------------------------------------------------------------------------- */

function NavHeader({ block, ctx }: { block: Block; ctx: RenderContext }) {
  const links = (get<Array<{ label: string; href: string }>>(block, 'links') ?? []) as Array<{ label: string; href: string }>
  const ctaLabel = get<string>(block, 'cta_label')
  const ctaHref = get<string>(block, 'cta_href') ?? '#'
  const showPhone = get<boolean>(block, 'show_phone') ?? true
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div
        className="mx-auto px-6"
        style={{
          maxWidth: 1180,
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <Link href="/" style={{ fontWeight: 800, fontSize: 18, color: 'var(--site-primary)', textDecoration: 'none' }}>
          {ctx.site.name ?? 'Home'}
        </Link>
        <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {links.map((l, i) => (
            <Link key={i} href={l.href} style={{ fontSize: 14, color: 'var(--site-ink)', textDecoration: 'none' }}>
              {l.label}
            </Link>
          ))}
          {showPhone && ctx.phone.display ? (
            <a
              href={`tel:${ctx.phone.tel}`}
              style={{ fontSize: 14, fontWeight: 700, color: 'var(--site-primary)', textDecoration: 'none' }}
            >
              {ctx.phone.display}
            </a>
          ) : null}
          {ctaLabel ? (
            <Link
              href={ctaHref}
              style={{
                background: 'var(--site-accent)',
                color: 'var(--site-ink)',
                fontWeight: 700,
                fontSize: 14,
                padding: '10px 18px',
                borderRadius: 999,
                textDecoration: 'none',
              }}
            >
              {ctaLabel}
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Hero                                    */
/* -------------------------------------------------------------------------- */

function Hero({ block, ctx }: { block: Block; ctx: RenderContext }) {
  const eyebrow = get<string>(block, 'eyebrow')
  const heading = get<string>(block, 'heading') ?? ''
  const sub = get<string>(block, 'sub')
  const primaryLabel = get<string>(block, 'primary_cta_label')
  const primaryHref = get<string>(block, 'primary_cta_href') ?? '#'
  const secondaryLabel = get<string>(block, 'secondary_cta_label')
  const secondaryHref = get<string>(block, 'secondary_cta_href') ?? '#'
  const imageUrl = get<string>(block, 'image_url')
  return (
    <section
      style={{
        background: `linear-gradient(180deg, var(--site-surface, #F7F5F0) 0%, rgba(255,255,255,0) 60%)`,
        padding: '64px 0 48px',
      }}
    >
      <Container>
        <div style={{ display: 'grid', gridTemplateColumns: imageUrl ? '1.1fr 0.9fr' : '1fr', gap: 48, alignItems: 'center' }}>
          <div>
            {eyebrow ? (
              <p
                style={{
                  display: 'inline-block',
                  color: 'var(--site-primary)',
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  background: 'rgba(0,0,0,0.04)',
                  padding: '6px 14px',
                  borderRadius: 999,
                  marginBottom: 20,
                }}
              >
                {eyebrow}
              </p>
            ) : null}
            <h1 style={{ fontSize: 52, lineHeight: 1.05, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--site-ink)' }}>
              {heading}
            </h1>
            {sub ? (
              <p style={{ marginTop: 20, fontSize: 18, lineHeight: 1.55, color: 'var(--site-muted)', maxWidth: 560 }}>{sub}</p>
            ) : null}
            <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {primaryLabel ? (
                <Link
                  href={primaryHref}
                  style={{
                    background: 'var(--site-primary)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 15,
                    padding: '14px 24px',
                    borderRadius: 999,
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  {primaryLabel}
                </Link>
              ) : null}
              {secondaryLabel ? (
                <Link
                  href={secondaryHref}
                  style={{
                    color: 'var(--site-ink)',
                    fontWeight: 700,
                    fontSize: 15,
                    padding: '14px 24px',
                    borderRadius: 999,
                    textDecoration: 'none',
                    border: '1px solid rgba(0,0,0,0.18)',
                    display: 'inline-block',
                  }}
                >
                  {secondaryLabel}
                </Link>
              ) : null}
            </div>
            {ctx.phone.display ? (
              <p style={{ marginTop: 16, fontSize: 13, color: 'var(--site-muted)' }}>
                Or speak with us now:{' '}
                <a href={`tel:${ctx.phone.tel}`} style={{ color: 'var(--site-primary)', fontWeight: 700 }}>
                  {ctx.phone.display}
                </a>
              </p>
            ) : null}
          </div>
          {imageUrl ? (
            <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.15)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Trust Strip                                 */
/* -------------------------------------------------------------------------- */

function TrustStrip({ block }: { block: Block }) {
  const items = (get<Array<{ value: string; label: string }>>(block, 'items') ?? []) as Array<{ value: string; label: string }>
  if (items.length === 0) return null
  return (
    <section
      style={{
        background: 'var(--site-primary)',
        color: '#fff',
        padding: '28px 0',
      }}
    >
      <Container>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, minmax(0,1fr))`,
            gap: 20,
            textAlign: 'center',
          }}
        >
          {items.map((it, i) => (
            <div key={i}>
              <p style={{ fontSize: 28, fontWeight: 800, margin: 0, color: 'var(--site-accent)' }}>{it.value}</p>
              <p style={{ fontSize: 13, margin: '6px 0 0', opacity: 0.85 }}>{it.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                               Services Grid                                */
/* -------------------------------------------------------------------------- */

function ServicesGrid({ block }: { block: Block }) {
  const eyebrow = get<string>(block, 'eyebrow')
  const heading = get<string>(block, 'heading') ?? ''
  const sub = get<string>(block, 'sub')
  const items = (get<Array<{ title: string; description?: string; icon?: string }>>(block, 'items') ?? []) as Array<{
    title: string
    description?: string
    icon?: string
  }>
  return (
    <Section>
      <Container>
        <SectionHeader eyebrow={eyebrow} heading={heading} sub={sub} />
        <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {items.map((it, i) => (
            <div
              key={i}
              style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 12,
                padding: 24,
                boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: 'var(--site-accent)',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 800,
                  color: 'var(--site-ink)',
                }}
                aria-hidden
              >
                {(it.icon ?? it.title.charAt(0)).toString().slice(0, 1).toUpperCase()}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--site-ink)' }}>{it.title}</h3>
              {it.description ? (
                <p style={{ marginTop: 8, fontSize: 14, color: 'var(--site-muted)', lineHeight: 1.55 }}>{it.description}</p>
              ) : null}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*                                How It Works                                */
/* -------------------------------------------------------------------------- */

function HowItWorks({ block }: { block: Block }) {
  const eyebrow = get<string>(block, 'eyebrow')
  const heading = get<string>(block, 'heading') ?? ''
  const sub = get<string>(block, 'sub')
  const steps = (get<Array<{ title: string; description?: string }>>(block, 'steps') ?? []) as Array<{ title: string; description?: string }>
  return (
    <Section alt>
      <Container>
        <SectionHeader eyebrow={eyebrow} heading={heading} sub={sub} center />
        <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`, gap: 24 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ position: 'relative', paddingLeft: 8 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'var(--site-primary)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 16,
                  marginBottom: 14,
                }}
              >
                {i + 1}
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--site-ink)' }}>{s.title}</h3>
              {s.description ? (
                <p style={{ marginTop: 6, fontSize: 14, color: 'var(--site-muted)', lineHeight: 1.55 }}>{s.description}</p>
              ) : null}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Recent Wins                                 */
/* -------------------------------------------------------------------------- */

function RecentWins({ block }: { block: Block }) {
  const eyebrow = get<string>(block, 'eyebrow')
  const heading = get<string>(block, 'heading') ?? ''
  const sub = get<string>(block, 'sub')
  const items = (get<Array<{ amount: string; case_type: string; description?: string }>>(block, 'items') ?? []) as Array<{
    amount: string
    case_type: string
    description?: string
  }>
  const disclaimer = get<string>(block, 'disclaimer')
  return (
    <Section>
      <Container>
        <SectionHeader eyebrow={eyebrow} heading={heading} sub={sub} />
        <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {items.map((it, i) => (
            <div
              key={i}
              style={{
                background: 'var(--site-ink)',
                color: '#fff',
                borderRadius: 12,
                padding: 24,
              }}
            >
              <p style={{ fontSize: 32, fontWeight: 800, margin: 0, color: 'var(--site-accent)' }}>{it.amount}</p>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6, marginTop: 8 }}>
                {it.case_type}
              </p>
              {it.description ? (
                <p style={{ marginTop: 12, fontSize: 14, opacity: 0.85, lineHeight: 1.5 }}>{it.description}</p>
              ) : null}
            </div>
          ))}
        </div>
        {disclaimer ? (
          <p style={{ marginTop: 24, fontSize: 12, color: 'var(--site-muted)', fontStyle: 'italic' }}>{disclaimer}</p>
        ) : null}
      </Container>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Stats / Cards / etc                           */
/* -------------------------------------------------------------------------- */

function Stats({ block }: { block: Block }) {
  const heading = get<string>(block, 'heading')
  const items = (get<Array<{ value: string; label: string }>>(block, 'items') ?? []) as Array<{ value: string; label: string }>
  return (
    <Section>
      <Container>
        {heading ? <SectionHeader heading={heading} center /> : null}
        <div
          style={{
            marginTop: heading ? 32 : 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(items.length || 1, 4)}, minmax(0, 1fr))`,
            gap: 24,
            textAlign: 'center',
          }}
        >
          {items.map((s, i) => (
            <div key={i}>
              <p style={{ fontSize: 40, fontWeight: 800, color: 'var(--site-primary)', margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 13, color: 'var(--site-muted)', marginTop: 6 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

function Cards({ block }: { block: Block }) {
  const heading = get<string>(block, 'heading')
  const items = (get<Array<{ title: string; body?: string; icon?: string }>>(block, 'items') ?? []) as Array<{
    title: string
    body?: string
    icon?: string
  }>
  return (
    <Section>
      <Container>
        {heading ? <SectionHeader heading={heading} /> : null}
        <div style={{ marginTop: heading ? 32 : 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {items.map((c, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--site-ink)' }}>{c.title}</h3>
              {c.body ? <p style={{ marginTop: 10, fontSize: 14, color: 'var(--site-muted)', lineHeight: 1.55 }}>{c.body}</p> : null}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

function Testimonials({ block }: { block: Block }) {
  const heading = get<string>(block, 'heading')
  const items = (get<Array<{ quote: string; attribution?: string; avatar_url?: string }>>(block, 'items') ?? []) as Array<{
    quote: string
    attribution?: string
    avatar_url?: string
  }>
  return (
    <Section alt>
      <Container>
        {heading ? <SectionHeader heading={heading} center /> : null}
        <div style={{ marginTop: heading ? 32 : 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {items.map((t, i) => (
            <figure key={i} style={{ margin: 0, background: '#fff', borderRadius: 12, padding: 24, border: '1px solid rgba(0,0,0,0.06)' }}>
              <blockquote style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--site-ink)' }}>
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              {t.attribution ? (
                <figcaption style={{ marginTop: 14, fontSize: 13, color: 'var(--site-muted)', fontWeight: 700 }}>
                  — {t.attribution}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      </Container>
    </Section>
  )
}

function Faq({ block }: { block: Block }) {
  const heading = get<string>(block, 'heading') ?? 'Frequently asked questions'
  const items = (get<Array<{ question: string; answer: string }>>(block, 'items') ?? []) as Array<{ question: string; answer: string }>
  return (
    <Section>
      <Container narrow>
        <SectionHeader heading={heading} center />
        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((q, i) => (
            <details
              key={i}
              style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 10,
                padding: '18px 22px',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 15, color: 'var(--site-ink)', listStyle: 'none' }}>
                {q.question}
              </summary>
              <div style={{ marginTop: 12, fontSize: 14, color: 'var(--site-muted)', lineHeight: 1.6 }}>
                <MarkdownLite source={q.answer} />
              </div>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  )
}

function BulletList({ block }: { block: Block }) {
  const heading = get<string>(block, 'heading')
  const items = (get<Array<{ item: string }>>(block, 'items') ?? []) as Array<{ item: string }>
  return (
    <Section>
      <Container narrow>
        {heading ? <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--site-ink)' }}>{heading}</h2> : null}
        <ul style={{ marginTop: 16, paddingLeft: 22, color: 'var(--site-ink)', lineHeight: 1.7 }}>
          {items.map((b, i) => (
            <li key={i} style={{ marginBottom: 6 }}>
              {b.item}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}

function Cta({ block }: { block: Block }) {
  const heading = get<string>(block, 'heading') ?? ''
  const sub = get<string>(block, 'sub')
  const label = get<string>(block, 'label') ?? ''
  const href = get<string>(block, 'href') ?? '#'
  return (
    <Section alt>
      <Container narrow>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--site-ink)', margin: 0 }}>{heading}</h2>
          {sub ? <p style={{ marginTop: 12, color: 'var(--site-muted)', fontSize: 16 }}>{sub}</p> : null}
          <Link
            href={href}
            style={{
              display: 'inline-block',
              marginTop: 24,
              background: 'var(--site-primary)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              padding: '14px 28px',
              borderRadius: 999,
              textDecoration: 'none',
            }}
          >
            {label}
          </Link>
        </div>
      </Container>
    </Section>
  )
}

function FinalCta({ block, ctx }: { block: Block; ctx: RenderContext }) {
  const eyebrow = get<string>(block, 'eyebrow')
  const heading = get<string>(block, 'heading') ?? ''
  const sub = get<string>(block, 'sub')
  const label = get<string>(block, 'primary_cta_label') ?? 'Get started'
  const href = get<string>(block, 'primary_cta_href') ?? '#'
  const showPhone = get<boolean>(block, 'show_phone') ?? true
  return (
    <section
      style={{
        background: 'var(--site-ink)',
        color: '#fff',
        padding: '96px 0',
        textAlign: 'center',
      }}
    >
      <Container narrow>
        {eyebrow ? (
          <p
            style={{
              display: 'inline-block',
              color: 'var(--site-accent)',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: 16,
            }}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2 style={{ fontSize: 40, fontWeight: 800, margin: 0, lineHeight: 1.15 }}>{heading}</h2>
        {sub ? <p style={{ marginTop: 16, fontSize: 17, opacity: 0.85, lineHeight: 1.55 }}>{sub}</p> : null}
        <div style={{ marginTop: 32, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href={href}
            style={{
              background: 'var(--site-accent)',
              color: 'var(--site-ink)',
              fontWeight: 800,
              fontSize: 15,
              padding: '16px 30px',
              borderRadius: 999,
              textDecoration: 'none',
            }}
          >
            {label}
          </Link>
          {showPhone && ctx.phone.display ? (
            <a
              href={`tel:${ctx.phone.tel}`}
              style={{
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                padding: '16px 22px',
                borderRadius: 999,
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              Call {ctx.phone.display}
            </a>
          ) : null}
        </div>
      </Container>
    </section>
  )
}

function Prose({ block }: { block: Block }) {
  const md = get<string>(block, 'markdown') ?? ''
  return (
    <Section>
      <Container narrow>
        <MarkdownLite source={md} />
      </Container>
    </Section>
  )
}

function ImageBlock({ block }: { block: Block }) {
  const url = get<string>(block, 'url') ?? ''
  const alt = get<string>(block, 'alt') ?? ''
  const caption = get<string>(block, 'caption')
  if (!url) return null
  return (
    <Section>
      <Container>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} style={{ display: 'block', maxWidth: '100%', borderRadius: 12 }} />
        {caption ? <p style={{ marginTop: 12, fontSize: 13, color: 'var(--site-muted)', textAlign: 'center' }}>{caption}</p> : null}
      </Container>
    </Section>
  )
}

function Embed({ block }: { block: Block }) {
  const html = get<string>(block, 'html') ?? ''
  return (
    <Section>
      <Container>
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
      </Container>
    </Section>
  )
}

function CustomHtml({ block }: { block: Block }) {
  const html = get<string>(block, 'html') ?? ''
  return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
}

function Disclosure({ block }: { block: Block }) {
  const md = get<string>(block, 'markdown') ?? ''
  return (
    <section style={{ background: 'rgba(0,0,0,0.03)', padding: '24px 0', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      <Container narrow>
        <div style={{ fontSize: 12, color: 'var(--site-muted)', lineHeight: 1.55 }}>
          <MarkdownLite source={md} />
        </div>
      </Container>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Site Footer                                 */
/* -------------------------------------------------------------------------- */

function SiteFooter({ block, ctx }: { block: Block; ctx: RenderContext }) {
  const columns = (get<Array<{ heading: string; links?: Array<{ label: string; href: string }> }>>(block, 'columns') ?? []) as Array<{
    heading: string
    links?: Array<{ label: string; href: string }>
  }>
  const legalMd = get<string>(block, 'legal_md') ?? ctx.site.default_disclaimer_md ?? ''
  return (
    <footer style={{ background: 'var(--site-ink)', color: '#fff', padding: '64px 0 40px', marginTop: 'auto' }}>
      <Container>
        <div style={{ display: 'grid', gridTemplateColumns: `2fr ${columns.map(() => '1fr').join(' ')}`, gap: 32 }}>
          <div>
            <p style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--site-accent)' }}>{ctx.site.name}</p>
            {ctx.site.org_address ? <p style={{ marginTop: 12, fontSize: 13, opacity: 0.8 }}>{ctx.site.org_address}</p> : null}
            {ctx.phone.display ? (
              <p style={{ marginTop: 10, fontSize: 13 }}>
                <a href={`tel:${ctx.phone.tel}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: 700 }}>
                  {ctx.phone.display}
                </a>
              </p>
            ) : null}
            {ctx.site.support_email ? (
              <p style={{ marginTop: 4, fontSize: 13 }}>
                <a href={`mailto:${ctx.site.support_email}`} style={{ color: '#fff', opacity: 0.8, textDecoration: 'none' }}>
                  {ctx.site.support_email}
                </a>
              </p>
            ) : null}
          </div>
          {columns.map((col, i) => (
            <div key={i}>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, opacity: 0.6, margin: 0 }}>
                {col.heading}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(col.links ?? []).map((l, j) => (
                  <li key={j}>
                    <Link href={l.href} style={{ color: '#fff', opacity: 0.8, fontSize: 14, textDecoration: 'none' }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {legalMd ? (
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 12, opacity: 0.65, lineHeight: 1.6 }}>
            <MarkdownLite source={legalMd} />
          </div>
        ) : null}
      </Container>
    </footer>
  )
}

/* -------------------------------------------------------------------------- */
/*                            Section header helper                           */
/* -------------------------------------------------------------------------- */

function SectionHeader({
  eyebrow,
  heading,
  sub,
  center,
}: {
  eyebrow?: string
  heading?: string
  sub?: string
  center?: boolean
}) {
  if (!heading && !eyebrow && !sub) return null
  return (
    <div style={{ textAlign: center ? 'center' : 'left', maxWidth: center ? 700 : undefined, margin: center ? '0 auto' : undefined }}>
      {eyebrow ? (
        <p
          style={{
            color: 'var(--site-primary)',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: 10,
          }}
        >
          {eyebrow}
        </p>
      ) : null}
      {heading ? (
        <h2 style={{ fontSize: 36, fontWeight: 800, color: 'var(--site-ink)', margin: 0, lineHeight: 1.15 }}>{heading}</h2>
      ) : null}
      {sub ? <p style={{ marginTop: 12, fontSize: 17, color: 'var(--site-muted)', lineHeight: 1.55 }}>{sub}</p> : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Fallbacks                                 */
/* -------------------------------------------------------------------------- */

function FallbackEmpty() {
  return (
    <Section>
      <Container narrow>
        <p style={{ textAlign: 'center', color: 'var(--site-muted)' }}>This page has no content blocks yet.</p>
      </Container>
    </Section>
  )
}

function FallbackUnknown({ blockType }: { blockType: string }) {
  return (
    <div
      style={{
        margin: '12px auto',
        maxWidth: 760,
        padding: 16,
        border: '2px dashed #C03A2B',
        background: 'rgba(192,58,43,0.05)',
        color: '#C03A2B',
        borderRadius: 8,
        fontSize: 13,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      }}
    >
      Unknown block type: <strong>{blockType}</strong> — add a renderer in <code>BlockRenderer.tsx</code>.
    </div>
  )
}
