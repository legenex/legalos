// @ts-nocheck -- the seam between the ported builder (untyped props) and the
// typed node renderers under nodes/. Everything it delegates to is checked.
'use client'

/**
 * The landing-page renderer.
 *
 * One component serves the builder and the public page, which is deliberate: a
 * separate public renderer is how a page ends up looking one way to the person
 * designing it and another way to a visitor. `editable` is the only difference.
 * When it is false no click handler is attached, no hover affordance is drawn,
 * and unfilled nodes are dropped rather than shown as placeholders.
 *
 * Everything about HOW a page draws now lives in `nodes/`. This file is the
 * seam: it resolves the template, normalises whatever shape the sections are
 * stored in, substitutes brand tokens, and hands each section to the node
 * renderer. It carries no section renderers of its own any more - there were
 * thirteen, one per subject, and they were the reason four templates could
 * differ only in colour.
 */

import { fillAll as fillAllTokens, resolveTokens } from './tokens'
import { LP_IDENTITIES, IDENTITY_FONTS_HREF, getLpIdentity } from '@/lib/lp-identities'
import { toNodeSections } from '@/lib/lp-nodes/from-legacy'
import { isVisible, TONES } from '@/lib/lp-nodes/model'
import { deriveSurface, groundFor, lookOf } from '@/lib/lp-nodes/surface'
import { skeletonFor } from '@/lib/lp-skeletons'
import { SectionNode } from './nodes/SectionNode'
import { T } from '../ui'

export { resolveTokens }
export const fillPlaceholders = (str, brand) => resolveTokens(str, { brand })
export const fillAll = fillAllTokens

// Section default copy + helpers live in a server-safe module so the seed
// script can share them. They now describe LEGACY sections, which the converter
// in lp-nodes/from-legacy turns into nodes on read.
export { SEED_SECTION_COPY, DEFAULT_SECTION_ORDER, buildSeedSections } from './section-copy'

/** Kept under its old name because the section editor still imports it. */
export const SECTION_TONES = TONES

// ============================================================================
// TEMPLATES
// ============================================================================

/**
 * A template is an identity plus a structure.
 *
 * The identity half was settled earlier: the template owns the palette, the
 * faces, the radii and the mark, so a page deployed under any brand renders in
 * the template's own colours. The structure half is the new part, and it is
 * what makes the four actually different rather than four tints of one layout.
 *
 * A template whose skeleton has not been built yet still works. It keeps its
 * identity, so an existing page assigned to it renders in its colours and
 * typography; what it cannot yet do is seed a new page with a shape. The
 * gallery says so rather than quietly handing out a copy of another template's
 * structure.
 */
const ANGLE_FOR_POSITION = { adversary: 'pain', clarity: 'community', authority: 'authority', direct: 'urgency' }

export const TEMPLATES = LP_IDENTITIES.map((identity) => {
  const skeleton = skeletonFor(identity.id)
  return {
    id: identity.id,
    name: identity.name,
    identity,
    skeleton,
    structure: skeleton ? skeleton.summary : null,
    angleDefault: ANGLE_FOR_POSITION[identity.position] || 'pain',
    blurb: `${identity.position} - ${identity.tagline}`,
    hookExample: identity.tagline,
  }
})

export const templateFor = (templateId) =>
  TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0]

/** The colours a template's own ground produces, for gallery swatches. */
export const templatePreviewSurface = (template) =>
  deriveSurface(groundFor('default', template.identity), template.identity)

export const templateLook = (template) => lookOf(template.identity)

export const ANGLES = [
  { id: 'pain', label: 'Pain First', desc: 'Acknowledge what happened. Lean into emotion and consequences.' },
  { id: 'authority', label: 'Authority', desc: 'Lead with credentials, network size, settlement track record.' },
  { id: 'urgency', label: 'Urgency', desc: 'Statute of limitations. Time is running out. Act now.' },
  { id: 'community', label: 'Community', desc: 'You are not alone. Many people in your situation got help.' },
]

export const PREVIEW_BRAND_DEFAULT = {
  id: 'preview',
  name: 'Preview',
  displayName: 'Your Brand',
  shortName: 'YB',
  tagline: '',
  primaryDomain: '',
  logoUrl: '',
  logoUrlDark: '',
  faviconUrl: '',
  colors: { primary: '#475569', accent: '#64748b', background: '#334155', cardBg: '#1e293b', textOnDark: '#ffffff' },
  typography: { headlineFont: 'Inter', bodyFont: 'Inter', baseSize: 'md' },
  contact: { callNumber: '', callCtaText: 'CLICK HERE TO CALL', callCtaStyle: 'pill' },
  legal: { copyright: '(c) 2026 Your Brand', tcpaText: '', privacyUrl: '', termsUrl: '', defaultDisclaimer: 'Brand disclaimer goes here.' },
}

// ============================================================================
// LIVE PREVIEW
// ============================================================================

export const LivePreview = ({
  landingPage,
  brand,
  quizDepLabel,
  quiz,
  editable = true,
  quizCtx = null,
  selectedId = null,
  onSelectNode,
}: {
  landingPage: { templateId?: string; sections?: unknown }
  brand?: unknown
  quizDepLabel?: string
  quiz?: unknown
  /** False on a public page: no handlers, no affordances, no placeholders. */
  editable?: boolean
  quizCtx?: unknown
  selectedId?: string | null
  onSelectNode?: (nodeId: string) => void
}) => {
  const template = templateFor(landingPage.templateId)
  const identity = template.identity || getLpIdentity(landingPage.templateId)
  const previewBrand = brand || PREVIEW_BRAND_DEFAULT

  // Whatever shape the page is stored in comes out as nodes. Pages written
  // before the node model exist in the database and are converted on every
  // read rather than rewritten, so one that nobody opens keeps working.
  const sections = toNodeSections(landingPage.sections).filter(isVisible)

  const pageSurface = deriveSurface(groundFor('default', identity), identity)
  const look = lookOf(identity)

  const frame = editable
    ? { borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px -12px rgba(0,0,0,0.4)', border: `1px solid ${T.border}` }
    : { minHeight: '100vh' }

  return (
    <div
      className={editable ? 'lp-preview-root' : 'lp-preview-root lp-public-root'}
      style={{
        backgroundColor: pageSurface.bg,
        color: pageSurface.text,
        fontFamily: look.body,
        // Named so the rules below can target this container explicitly rather
        // than whichever ancestor happens to be nearest.
        containerType: 'inline-size',
        containerName: 'lp',
        ...frame,
      }}
    >
      {/* The identities specify their own faces, and substituting a fallback
          would change what separates them. React hoists this into the head. */}
      <link rel="stylesheet" href={IDENTITY_FONTS_HREF} />

      {sections.map((section) => (
        <SectionNode
          key={section.id}
          section={
            // Brand tokens are substituted here rather than inside the node
            // renderers, so `{{brand.callNumber}}` resolves wherever it was
            // typed without every leaf having to remember to resolve it.
            fillAllTokens(section, previewBrand)
          }
          identity={identity}
          brand={previewBrand}
          editable={editable}
          selectedId={selectedId}
          onSelect={editable ? onSelectNode : undefined}
          quiz={quiz}
          quizCtx={quizCtx}
          quizDepLabel={quizDepLabel}
        />
      ))}

      <style>{`
        .lp-preview-root section:hover > .lp-section-overlay { opacity: 1 !important; }
        .lp-preview-root .lp-node:hover { outline-color: ${pageSurface.line} !important; }
        /* The public render must not offer an affordance the visitor cannot use. */
        .lp-public-root .lp-section-overlay { display: none !important; }
        .lp-public-root section { cursor: default !important; }

        /* Container queries, not viewport ones. The builder shows the page in a
           pane roughly a third of the window wide, so a viewport media query is
           answering the wrong question: it reports a desktop and the page keeps
           a two-column hero and three-across stats inside 600 pixels, which
           collide. Asking the CONTAINER means the preview and the live page
           behave the same at the same content width, which is the only way a
           preview can be trusted. */
        @container lp (max-width: 900px) {
          .lp-split { grid-template-columns: 1fr !important; gap: 30px !important; }
          section { padding-left: 26px !important; padding-right: 26px !important; }
          h1 { font-size: clamp(30px, 5.2cqw, 46px) !important; line-height: 1.12 !important; }
        }
        @container lp (max-width: 660px) {
          section {
            padding-top: 44px !important; padding-bottom: 44px !important;
            padding-left: 18px !important; padding-right: 18px !important;
          }
          h1 { font-size: clamp(26px, 7cqw, 36px) !important; }
          h2 { font-size: clamp(21px, 5.6cqw, 30px) !important; line-height: 1.22 !important; }
          h3 { font-size: clamp(16px, 4.4cqw, 20px) !important; }
          [style*="grid-template-columns"] { grid-template-columns: 1fr !important; gap: 16px !important; }
          a[href^="tel:"], button, a[href="#lp-form"] { min-height: 48px; }
        }
      `}</style>
    </div>
  )
}
