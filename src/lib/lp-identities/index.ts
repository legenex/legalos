/**
 * The four landing-page identities, taken verbatim from the Claude Design
 * handoff (LegalOS Brand Identities.dc.html).
 *
 * Each is a COMPLETE design system - palette, three faces, radii, border
 * weight, a two-path mark with light and dark variants, and voice rules - not
 * a colour scheme. They are deliberately unrelated: the brief was that no two
 * overlap on more than one of the four axes (palette temperature, type
 * personality, shape language, mark idea) and that they should not read as a
 * family.
 *
 * A NOTE ON PRECEDENCE, because it reverses what shipped earlier the same day.
 *
 * Templates were made colour-free that morning, so a brand's own tokens drove
 * every surface and a template only declared whether it grounded dark or light.
 * The owner has since chosen the opposite for these four: the template carries
 * the identity, and a page deployed under Counterweight renders in vermilion
 * whatever the Site's own brand says.
 *
 * That is a deliberate product decision, not an oversight, and it is recorded
 * here because the two rules cannot both be true and the next person reading
 * the colour system will otherwise take this for the bug it was written to
 * prevent. What survives from that work is the part that is not about
 * ownership: every text colour is still DERIVED against the surface it lands on
 * and verified, so an identity cannot produce unreadable copy.
 */

export type IdentityMark = {
  d: string
  fill: string
  stroke: string
  strokeWidth: number
  d2: string
  fill2: string
  fillDark: string
  strokeDark: string
  fill2Dark: string
}

export type LpIdentity = {
  id: string
  position: string
  name: string
  wordmark: string
  tagline: string
  primary: string
  primaryInk: string
  secondary: string
  accent: string
  surface: string
  surfaceAlt: string
  surfaceDark: string
  ink: string
  inkMuted: string
  line: string
  primaryDark: string
  fontDisplay: string
  fontBody: string
  fontUtility: string
  fontDisplayName: string
  fontBodyName: string
  fdw: number
  h1tt: string
  h1ls: string
  h1s: string
  h1sShort: string
  wmTt: string
  wmLs: string
  wmSize: string
  wmSizeLg: string
  rSm: string
  rMd: string
  rLg: string
  rPill: string
  bw: string
  mark: IdentityMark
  voice: string[]
  darkNote: string
}

const RAW = [
      {
        id: 'a', label: 'Brand A', position: 'adversary', name: 'Counterweight', wordmark: 'Counterweight',
        tagline: 'The other side has lawyers.',
        axisPalette: 'Hot: vermilion on warm gray, charcoal dark, gunmetal accent',
        axisType: 'Compressed poster caps (Anton) with Barlow body',
        axisShape: 'Square: 0 to 4px radii, 2px rules, even the pill is sharp',
        axisMark: 'A counterweight: beam, fulcrum, two unequal blocks',
        primary: '#BF2E1A', primaryInk: '#FFFFFF', secondary: '#26292E', accent: '#7E8C99',
        surface: '#F4F2EE', surfaceAlt: '#E9E5DD', surfaceDark: '#17191D',
        ink: '#17191D', inkMuted: '#5B5E64', line: '#D9D4CB', primaryDark: '#BF2E1A',
        fontDisplay: "'Anton', 'Arial Narrow', sans-serif", fontBody: "'Barlow', sans-serif", fontUtility: "'Barlow Semi Condensed', sans-serif",
        fontDisplayCss: "'Anton', 'Arial Narrow', sans-serif  (400, caps only)",
        fontBodyCss: "'Barlow', sans-serif  (400 to 700)",
        fontUtilityCss: "'Barlow Semi Condensed', sans-serif  (500, 600, labels and step numbers)",
        fontDisplayName: 'Anton', fontBodyName: 'Barlow',
        fdw: 400, h1tt: 'uppercase', h1ls: '0.015em', h1s: '54px', h1sShort: '38px',
        wmTt: 'uppercase', wmLs: '0.05em', wmSize: '19px', wmSizeLg: '24px',
        rSm: '0px', rMd: '2px', rLg: '4px', rPill: '4px', bw: '2px',
        shapeChipNote: 'md 2px · pill 4px · rules 2px',
        typeSample: 'Their side started day one',
        bodySample: 'Barlow carries the body: plain, sturdy, slightly narrow. It reads like a case file, not a brochure.',
        typeSpecNote: 'Anton, caps, +0.05em tracking in the wordmark. Never set Anton in lowercase.',
        l1d: 'M4 23 L36 15 L36 12 L4 20 Z M20 27 L27 36 L13 36 Z', l1f: '#17191D', l1s: 'none', l1sw: 0,
        l2d: 'M4 10 h11 v11 H4 Z M29 7 h7 v7 h-7 Z', l2f: '#BF2E1A',
        l1fD: '#F4F2EE', l1sD: 'none', l2fD: '#BF2E1A',
        markSpec: 'A tilted beam on a fulcrum with two unequal blocks: the weight is not even, which is the whole argument. Charcoal beam, vermilion blocks. On dark, the beam flips to off-white.',
        wmSpec: 'Anton 400, all caps, +0.05em letterspacing. Mark sits left of the wordmark at cap height, gap of half the cap height. Never stack.',
        voice: [
          'Short declaratives, weighted and even. No exclamation points.',
          'Names the insurance company as the concrete counterparty in nearly every frame.',
          "Says 'their side' and 'your side'. Never completes the money thought.",
          'The tension lives in facts and timing, not in adjectives.',
          "Comfortable stating what it is: a free matching service, not a law firm."
        ],
        darkNote: 'Surfaces drop to #101215 and #17191D, ink flips to #F4F2EE. Vermilion #BF2E1A holds on near-black for buttons and large type; body-size emphasis uses the off-white ink instead.',
        h1Long: 'The insurance company put a team on it the day it happened.',
        subLong: 'Counterweight is a free matching service. Answer a few questions and we connect you with a licensed attorney in your state.',
        ctaLong: 'Get matched',
        steps: [
          { n: '1', t: 'Answer a short set of questions' },
          { n: '2', t: 'We run a free eligibility check for your state' },
          { n: '3', t: 'Talk to a licensed attorney in your state' }
        ],
        eligH: 'Their side started early. Yours can start today.',
        faq: [
          { q: 'Is Counterweight a law firm?', a: 'No. Counterweight is a free matching service. If you qualify, we connect you with a licensed attorney in your state.' },
          { q: 'What does the eligibility check involve?', a: 'A short set of questions about the accident, your state, and timing. It is free, and there is no obligation to proceed.' }
        ],
        h1Short: 'Their side has lawyers.',
        subShort: 'A free eligibility check. About two minutes.',
        ctaShort: 'Start the check'
      },
      {
        id: 'b', label: 'Brand B', position: 'clarity', name: 'Plainpath', wordmark: 'plainpath',
        tagline: 'Attorney matching in plain steps.',
        axisPalette: 'Cool: cornflower blue on paper white, green endpoint accent',
        axisType: 'Legibility-first geometric (Lexend) with Public Sans body',
        axisShape: 'Soft: 8 to 22px radii, hairlines, true pills',
        axisMark: 'A stepped path with an endpoint dot',
        primary: '#38669E', primaryInk: '#FFFFFF', secondary: '#E2EAF3', accent: '#47946A',
        surface: '#FBFBF9', surfaceAlt: '#EFF3F6', surfaceDark: '#1C2B3A',
        ink: '#232F3B', inkMuted: '#57646F', line: '#DCE2E8', primaryDark: '#5D87BB',
        fontDisplay: "'Lexend', sans-serif", fontBody: "'Public Sans', sans-serif", fontUtility: "'Public Sans', sans-serif",
        fontDisplayCss: "'Lexend', sans-serif  (500 to 700)",
        fontBodyCss: "'Public Sans', sans-serif  (400 to 600)",
        fontUtilityCss: "'Public Sans', sans-serif  (600, small caps labels)",
        fontDisplayName: 'Lexend', fontBodyName: 'Public Sans',
        fdw: 600, h1tt: 'none', h1ls: '-0.01em', h1s: '46px', h1sShort: '32px',
        wmTt: 'lowercase', wmLs: '0em', wmSize: '20px', wmSizeLg: '26px',
        rSm: '8px', rMd: '14px', rLg: '22px', rPill: '999px', bw: '1px',
        shapeChipNote: 'md 14px · pill 999px · 1px hairlines',
        typeSample: 'One step at a time, in order',
        bodySample: 'Public Sans does the explaining: open counters, even color, nothing showy. Sentences stay short and complete.',
        typeSpecNote: 'Lexend 600 for headings, sentence case, never all caps above 12px.',
        l1d: 'M7 32 H16 V22 H25 V12 H31', l1f: 'none', l1s: '#38669E', l1sw: 4.5,
        l2d: 'M33 12 m-3.6 0 a3.6 3.6 0 1 0 7.2 0 a3.6 3.6 0 1 0 -7.2 0', l2f: '#47946A',
        l1fD: 'none', l1sD: '#A9C4E4', l2fD: '#6FBF93',
        markSpec: 'A stepped path rising left to right, rounded joins, ending in a green dot: the process, then the match. Two colors, no fill. On dark the path lightens to a pale blue.',
        wmSpec: 'Lexend 600, all lowercase, default tracking. Mark leads at the same optical height as the x-height. Lockup may sit on one line only.',
        voice: [
          'Calm and procedural. Numbered where possible, explained before it asks.',
          'Every form field earns one sentence of context.',
          'No urgency, no countdowns, no alarm.',
          "Plain words over legal words: 'the process', not 'litigation'.",
          'States plainly and early that it is a free matching service, not a law firm.'
        ],
        darkNote: 'Surfaces drop to #141D27 and #1C2B3A. Primary lifts to #5D87BB so buttons and links keep contrast; the green endpoint dot lifts to #6FBF93.',
        h1Long: 'The claims process, laid out in plain order.',
        subLong: 'Plainpath explains each step, then matches you with a licensed attorney in your state. No jargon, no pressure.',
        ctaLong: 'Start the eligibility check',
        steps: [
          { n: '1', t: 'Read how the process works, in order' },
          { n: '2', t: 'Answer a few plain questions' },
          { n: '3', t: 'Get matched with a licensed attorney' }
        ],
        eligH: 'When you are ready, the check takes a few minutes.',
        faq: [
          { q: 'Is Plainpath a law firm?', a: 'No. Plainpath is a free matching service. We explain the process and, if you qualify, connect you with a licensed attorney in your state.' },
          { q: 'What happens after I answer the questions?', a: 'We check eligibility for your state. If there is a match, an attorney contacts you. If not, we tell you that plainly too.' }
        ],
        h1Short: 'One clear path through the process.',
        subShort: 'A free eligibility check, explained as you go.',
        ctaShort: 'Begin step one'
      },
      {
        id: 'c', label: 'Brand C', position: 'authority', name: 'Meridian Legal Network', wordmark: 'Meridian',
        tagline: 'A vetted attorney network.',
        axisPalette: 'Aged: oxblood on cream, dark viridian rules',
        axisType: 'Old-style serif (Libre Caslon) with Source Sans 3 body',
        axisShape: 'Near-square: 2 to 6px, engraved hairline and double-rule motif',
        axisMark: 'A fluted column',
        primary: '#6E293A', primaryInk: '#F7EFE5', secondary: '#EDE5D4', accent: '#2F5D50',
        surface: '#F8F4EB', surfaceAlt: '#F0E9DB', surfaceDark: '#211318',
        ink: '#271F1A', inkMuted: '#5F564A', line: '#DBD1BE', primaryDark: '#9A4B60',
        fontDisplay: "'Libre Caslon Text', Georgia, serif", fontBody: "'Source Sans 3', sans-serif", fontUtility: "'Source Sans 3', sans-serif",
        fontDisplayCss: "'Libre Caslon Text', Georgia, serif  (400, 700, italic for emphasis)",
        fontBodyCss: "'Source Sans 3', sans-serif  (400 to 600)",
        fontUtilityCss: "'Source Sans 3', sans-serif  (600, letterspaced caps for credentials)",
        fontDisplayName: 'Libre Caslon Text', fontBodyName: 'Source Sans 3',
        fdw: 700, h1tt: 'none', h1ls: '0em', h1s: '42px', h1sShort: '30px',
        wmTt: 'uppercase', wmLs: '0.14em', wmSize: '16px', wmSizeLg: '21px',
        rSm: '2px', rMd: '3px', rLg: '6px', rPill: '6px', bw: '1px',
        shapeChipNote: 'md 3px · pill 6px · engraved rules',
        typeSample: 'Verification before introduction',
        bodySample: 'Source Sans 3 handles the record: credentials, coverage, and process, stated without ornament or superlatives.',
        typeSpecNote: 'Libre Caslon 700 for headings. Wordmark in caps at +0.14em; body never letterspaced.',
        l1d: 'M8 8 h24 v3.5 H8 Z M8 32 h24 v4 H8 Z M12 14.5 h4 v14.5 h-4 Z M18 14.5 h4 v14.5 h-4 Z M24 14.5 h4 v14.5 h-4 Z', l1f: '#6E293A', l1s: 'none', l1sw: 0,
        l2d: 'M6 3.5 h28 v2 H6 Z', l2f: '#2F5D50',
        l1fD: '#F7EFE5', l1sD: 'none', l2fD: '#7FA391',
        markSpec: 'A fluted column: capital, three flutes, base, with a single viridian abacus line above. Oxblood on cream; cream on dark. No enclosure, no shield, no seal.',
        wmSpec: "Libre Caslon 700 caps, +0.14em. 'MERIDIAN' leads; 'LEGAL NETWORK' sits beneath in Source Sans 600 caps at 60 percent size. Column mark sits left, full lockup height.",
        voice: [
          'Reserved and institutional. Third person when a claim is made about the network.',
          'Leads with licensure, vetting, and state coverage, never with emotion.',
          'No slang. No contractions in headlines, sparing contractions in body.',
          'Never flatters the reader and never dramatizes the accident.',
          'Speaks in credentials that can be verified, not in superlatives.'
        ],
        darkNote: 'Surfaces drop to #181014 and #211318, ink flips to cream #F7EFE5. Oxblood lifts to #9A4B60 for buttons on dark; the viridian rule lifts to #7FA391.',
        h1Long: 'A vetted network of state-licensed attorneys.',
        subLong: 'Every attorney in the Meridian network is verified for active licensure and standing in their state before any match is made.',
        ctaLong: 'Request a match',
        steps: [
          { n: '1', t: 'Licensure verified in your state' },
          { n: '2', t: 'Standing and discipline history reviewed' },
          { n: '3', t: 'A considered match, not a referral list' }
        ],
        eligH: 'Verification first. Matching second.',
        faq: [
          { q: 'Is Meridian a law firm?', a: 'No. Meridian Legal Network is a free matching service. It verifies licensure and standing, then introduces you to a licensed attorney in your state.' },
          { q: 'How are attorneys admitted to the network?', a: 'By verification of active state licensure and a review of standing. Attorneys who do not meet the standard are not admitted.' }
        ],
        h1Short: 'Counsel, properly vetted.',
        subShort: 'A free matching service built on state licensure.',
        ctaShort: 'Request a match'
      },
      {
        id: 'd', label: 'Brand D', position: 'direct', name: 'Matchline', wordmark: 'matchline',
        tagline: 'Answer three questions. Get matched.',
        axisPalette: 'Charged: volt on black and white, magenta spark',
        axisType: 'Tight geometric bold (Sora) with Manrope body',
        axisShape: 'Pill CTAs, 6 to 16px elsewhere, 1.5px lines',
        axisMark: 'Two forward chevrons',
        primary: '#C8F03C', primaryInk: '#0C1005', secondary: '#16161A', accent: '#E23F97',
        surface: '#FFFFFF', surfaceAlt: '#F3F3F1', surfaceDark: '#0B0B0D',
        ink: '#111114', inkMuted: '#5C5C61', line: '#E5E5E7', primaryDark: '#C8F03C',
        fontDisplay: "'Sora', sans-serif", fontBody: "'Manrope', sans-serif", fontUtility: "'JetBrains Mono', monospace",
        fontDisplayCss: "'Sora', sans-serif  (700, 800)",
        fontBodyCss: "'Manrope', sans-serif  (400 to 700)",
        fontUtilityCss: "'JetBrains Mono', monospace  (500, 600, counters and timers)",
        fontDisplayName: 'Sora', fontBodyName: 'Manrope',
        fdw: 800, h1tt: 'none', h1ls: '-0.025em', h1s: '56px', h1sShort: '36px',
        wmTt: 'lowercase', wmLs: '-0.02em', wmSize: '20px', wmSizeLg: '26px',
        rSm: '6px', rMd: '10px', rLg: '16px', rPill: '999px', bw: '1.5px',
        shapeChipNote: 'md 10px · pill 999px · 1.5px lines',
        typeSample: 'Three questions. One match.',
        bodySample: 'Manrope keeps body copy tight and fast. One idea per screen, never explained twice.',
        typeSpecNote: 'Sora 800 for headings, tight tracking at -0.025em. Counters set in JetBrains Mono.',
        l1d: 'M4 6 L9 6 L23 20 L9 34 L4 34 L18 20 Z', l1f: '#111114', l1s: 'none', l1sw: 0,
        l2d: 'M16 6 L22 6 L36 20 L22 34 L16 34 L30 20 Z', l2f: '#C8F03C',
        l1fD: '#FFFFFF', l1sD: 'none', l2fD: '#C8F03C',
        markSpec: 'Two forward chevrons, ink then volt: momentum, nothing else. On dark the leading chevron flips to white. Magenta appears only in UI moments, never in the mark.',
        wmSpec: 'Sora 800, all lowercase, -0.02em. Mark left of wordmark, tight 8px gap. At small sizes the volt chevron may stand alone.',
        voice: [
          'Shortest possible sentences. Often fragments.',
          'Counts things: three questions, one match, about a minute.',
          'Never explains twice. One idea per screen.',
          "No adjectives it cannot prove. 'Fast' and 'free' only.",
          'The disclaimer is part of the voice, said plainly and early.'
        ],
        darkNote: 'Built dark-first: volt on near-black is the native state and clears contrast at any size. In light remaps, volt buttons keep the near-black ink #0C1005.',
        h1Long: 'Three questions. One match.',
        subLong: 'Free. From your phone. A licensed attorney in your state.',
        ctaLong: 'Start now',
        steps: [
          { n: '1', t: 'Tap start' },
          { n: '2', t: 'Answer three questions' },
          { n: '3', t: 'Get your match' }
        ],
        eligH: 'About a minute. Free.',
        faq: [
          { q: 'Is Matchline a law firm?', a: 'No. Matchline is a free matching service that connects you with a licensed attorney in your state.' },
          { q: 'How long does it take?', a: 'About a minute. Three questions, then we check eligibility for your state.' }
        ],
        h1Short: 'Get matched in about a minute.',
        subShort: 'Three questions. Free.',
        ctaShort: 'Start now'
      }
    ]

/** The design stores the mark as eight flat keys; it is one thing, so it nests. */
export const LP_IDENTITIES: LpIdentity[] = (RAW as Array<Record<string, unknown>>).map((b) => ({
  id: String(b.id),
  position: String(b.position),
  name: String(b.name),
  wordmark: String(b.wordmark),
  tagline: String(b.tagline),
  primary: String(b.primary),
  primaryInk: String(b.primaryInk),
  secondary: String(b.secondary),
  accent: String(b.accent),
  surface: String(b.surface),
  surfaceAlt: String(b.surfaceAlt),
  surfaceDark: String(b.surfaceDark),
  ink: String(b.ink),
  inkMuted: String(b.inkMuted),
  line: String(b.line),
  primaryDark: String(b.primaryDark),
  fontDisplay: String(b.fontDisplay),
  fontBody: String(b.fontBody),
  fontUtility: String(b.fontUtility),
  fontDisplayName: String(b.fontDisplayName),
  fontBodyName: String(b.fontBodyName),
  fdw: Number(b.fdw),
  h1tt: String(b.h1tt),
  h1ls: String(b.h1ls),
  h1s: String(b.h1s),
  h1sShort: String(b.h1sShort),
  wmTt: String(b.wmTt),
  wmLs: String(b.wmLs),
  wmSize: String(b.wmSize),
  wmSizeLg: String(b.wmSizeLg),
  rSm: String(b.rSm),
  rMd: String(b.rMd),
  rLg: String(b.rLg),
  rPill: String(b.rPill),
  bw: String(b.bw),
  mark: {
    d: String(b.l1d), fill: String(b.l1f), stroke: String(b.l1s), strokeWidth: Number(b.l1sw),
    d2: String(b.l2d), fill2: String(b.l2f),
    fillDark: String(b.l1fD), strokeDark: String(b.l1sD), fill2Dark: String(b.l2fD),
  },
  voice: (b.voice as string[]).slice(),
  darkNote: String(b.darkNote),
}))

export const getLpIdentity = (id: string | undefined | null): LpIdentity =>
  LP_IDENTITIES.find((i) => i.id === id) ?? LP_IDENTITIES[0]

/**
 * Every face the four identities call for, as one Google Fonts URL.
 *
 * Loaded as a stylesheet rather than bundled: these are the design's specified
 * faces and substituting a fallback would change the identity, which is most of
 * what separates these four from each other.
 */
export const IDENTITY_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Anton&family=Barlow:wght@400;500;600;700&family=Barlow+Semi+Condensed:wght@500;600&family=Lexend:wght@400;500;600;700&family=Public+Sans:wght@400;500;600;700&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:wght@400;500;600;700&family=Sora:wght@400;600;700;800&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap'
