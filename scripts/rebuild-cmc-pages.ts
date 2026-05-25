/**
 * Rebuild Submitted / Thanks / Partners with custom body_blocks for check-my-claim.
 * The remaining legal pages (privacy, privacy-policy, terms-of-service, tcpa, disclosures)
 * stay on the SharedLegalTemplate flow — they already render correctly with the new brand tokens.
 *
 * Run: pnpm tsx scripts/rebuild-cmc-pages.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const SLUG = 'check-my-claim'

type Block = { blockType: string } & Record<string, unknown>

const NAV_HEADER: Block = {
  blockType: 'nav_header',
  links: [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/#services' },
    { label: 'About Us', href: '/#about' },
    { label: 'FAQ', href: '/#faq' },
  ],
  cta_label: 'Start Your Free Claim Check',
  cta_href: '/',
  show_phone: true,
}

const SITE_FOOTER: Block = {
  blockType: 'site_footer',
  columns: [
    {
      heading: 'Quick Links',
      links: [
        { label: 'Home', href: '/' },
        { label: 'About Us', href: '/#about' },
        { label: 'Services', href: '/#services' },
        { label: 'FAQ', href: '/#faq' },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy-policy' },
        { label: 'Terms & Conditions', href: '/terms-of-service' },
        { label: 'Advertising Disclosure', href: '/disclosures' },
      ],
    },
    {
      heading: 'Contact',
      links: [
        { label: 'support@checkmyclaim.com', href: 'mailto:support@checkmyclaim.com' },
        { label: '{{site.phone}}', href: 'tel:{{site.phone_tel}}' },
      ],
    },
  ],
  legal_md: `Empowering accident victims with free, AI-powered claim checks and connections to top-rated attorneys. No win, no fee.

Check My Claim is not a law firm and does not provide legal advice. Results from the AI tool are for informational purposes only and do not guarantee compensation.

© {{year}} Check My Claim. All rights reserved.`,
}

const SUBMITTED_BLOCKS: Block[] = [
  NAV_HEADER,
  {
    blockType: 'hero',
    eyebrow: '✓ High value claim',
    heading: 'Congrats! We will be CALLING YOU',
    sub: 'Based on your answers, it seems you may have a HIGH VALUE CLAIM! Please make sure to answer your phone.',
    primary_cta_label: 'Call {{site.phone}}',
    primary_cta_href: 'tel:{{site.phone_tel}}',
  },
  {
    blockType: 'cards',
    heading: 'Here’s What To Expect Next',
    items: [
      { title: '📞 Step 1: We Will Call You (Next Few Minutes!)', body: 'One of our trusted advisors will call your phone to verify your details and connect you with the right attorney. Please answer the call!', icon: '1' },
      { title: 'Step 2: Attorney Review', body: 'Your matched attorney will review your case details thoroughly to assess your claim.', icon: '2' },
      { title: 'Step 3: Case Initiation (No Cost To You)', body: 'Your attorney starts your case with zero upfront fees — they only get paid when you win.', icon: '3' },
      { title: 'Step 4: Settlement & Compensation', body: 'Your attorney presents settlement options and fights for maximum compensation on your behalf.', icon: '4' },
    ],
  },
  {
    blockType: 'cta',
    heading: 'Don’t Wanna Wait?',
    sub: 'Click the button below to call now, and fast track your claim.',
    label: 'Call {{site.phone}}',
    href: 'tel:{{site.phone_tel}}',
  },
  {
    blockType: 'bullet_list',
    heading: 'NO WIN, NO FEE Guarantee',
    items: [
      { item: 'Check My Claim connects you with vetted attorneys who work on contingency.' },
      { item: 'You pay nothing unless your attorney secures a positive outcome.' },
      { item: 'YOU HAVE NOTHING TO LOSE!' },
    ],
  },
  {
    blockType: 'final_cta',
    heading: '100% Free · No Obligation · Your Information is Secure',
    sub: 'Have questions while you wait? Speak with us anytime.',
    primary_cta_label: 'Return to Home',
    primary_cta_href: '/',
    show_phone: true,
  },
  SITE_FOOTER,
]

const THANKS_BLOCKS: Block[] = [
  NAV_HEADER,
  {
    blockType: 'hero',
    eyebrow: '✓ Details received',
    heading: 'Thank You!',
    sub: 'We have received your details. One of our trusted advisors will call you in the next few minutes. Please make sure to answer your phone.',
    primary_cta_label: 'Call {{site.phone}}',
    primary_cta_href: 'tel:{{site.phone_tel}}',
  },
  {
    blockType: 'prose',
    markdown: `**PLEASE NOTE:** We cannot proceed with your case without talking to you on the phone and confirming your case details.`,
  },
  {
    blockType: 'cta',
    heading: 'Don’t Wanna Wait?',
    sub: 'Click the button below to call now, and fast track your claim.',
    label: 'Call {{site.phone}}',
    href: 'tel:{{site.phone_tel}}',
  },
  {
    blockType: 'bullet_list',
    heading: 'NO WIN, NO FEE Guarantee',
    items: [
      { item: 'Check My Claim connects you with vetted attorneys who work on contingency.' },
      { item: 'You pay nothing unless your attorney secures a positive outcome.' },
      { item: 'YOU HAVE NOTHING TO LOSE!' },
    ],
  },
  {
    blockType: 'final_cta',
    heading: '100% Free · No Obligation · Your Information is Secure',
    sub: '',
    primary_cta_label: 'Back to Home',
    primary_cta_href: '/',
    show_phone: true,
  },
  SITE_FOOTER,
]

const PARTNERS_BLOCKS: Block[] = [
  NAV_HEADER,
  {
    blockType: 'hero',
    eyebrow: 'Transparency',
    heading: 'Our Affiliated Partners & Sponsor Network',
    sub: 'We work with a carefully selected network of industry partners and 100+ vetted attorneys nationwide.',
    primary_cta_label: 'Start Your Free Claim Check',
    primary_cta_href: '/',
    secondary_cta_label: 'Back to Home',
    secondary_cta_href: '/',
  },
  {
    blockType: 'cards',
    heading: 'Affiliated Partners',
    items: [
      { title: 'Car Accident Helpline', body: 'Industry partner — accident intake and routing.', icon: 'CH' },
      { title: 'Los Defensores', body: 'Industry partner — bilingual case intake.', icon: 'LD' },
      { title: '4LegalLeads', body: 'Industry partner — legal lead generation.', icon: '4L' },
      { title: '1800TheLaw2', body: 'Industry partner — attorney connection service.', icon: '18' },
      { title: 'My Lawsuit Help', body: 'Industry partner — claim review.', icon: 'ML' },
      { title: 'Lawsuit Direct', body: 'Industry partner — lawsuit screening.', icon: 'LD' },
      { title: 'Capital Legal', body: 'Industry partner — legal services.', icon: 'CL' },
      { title: 'Attorney.com', body: 'Industry partner — attorney directory.', icon: 'A' },
      { title: 'LegalMatch', body: 'Industry partner — attorney matching.', icon: 'LM' },
      { title: 'Avvo', body: 'Industry partner — attorney reviews and ratings.', icon: 'AV' },
    ],
  },
  {
    blockType: 'prose',
    markdown: `## Our Attorney Sponsors

Check My Claim has partnered with **100+ trusted attorneys nationwide** to ensure you get the best possible representation. Our network spans every major US jurisdiction and covers all the practice areas we route claims for.

Attorney sponsors are independent law firms. They are not employees of {{site.org_name}}. Selection criteria include bar standing, track record on cases like yours, fee transparency, and responsiveness.`,
  },
  {
    blockType: 'bullet_list',
    heading: 'NO WIN, NO FEE Guarantee',
    items: [
      { item: 'Every partner attorney in our network works on contingency.' },
      { item: 'You pay nothing unless they secure a positive outcome on your case.' },
      { item: 'YOU HAVE NOTHING TO LOSE!' },
    ],
  },
  {
    blockType: 'final_cta',
    eyebrow: 'Ready to start?',
    heading: 'Get your free claim check now.',
    sub: 'Takes less than 2 minutes. 100% free. No obligation.',
    primary_cta_label: 'Start Your Free Claim Check',
    primary_cta_href: '/',
    show_phone: true,
  },
  SITE_FOOTER,
]

type PageUpdate = {
  slugs: string[]
  title: string
  meta_title: string
  meta_description: string
  blocks: Block[]
}

const UPDATES: PageUpdate[] = [
  {
    slugs: ['/submitted', 'submitted'],
    title: 'You qualify — we’ll call you',
    meta_title: 'Congrats! We’ll be calling you — Check My Claim',
    meta_description: 'Based on your answers, you may have a high-value claim. We’ll call you in the next few minutes.',
    blocks: SUBMITTED_BLOCKS,
  },
  {
    slugs: ['/thanks', 'thanks'],
    title: 'Thank you',
    meta_title: 'Thank you — we received your details — Check My Claim',
    meta_description: 'We received your details. One of our trusted advisors will call you in the next few minutes.',
    blocks: THANKS_BLOCKS,
  },
  {
    slugs: ['/partners', 'partners'],
    title: 'Our partners',
    meta_title: 'Our affiliated partners & sponsor network — Check My Claim',
    meta_description: 'A carefully selected network of industry partners and 100+ vetted attorneys nationwide.',
    blocks: PARTNERS_BLOCKS,
  },
]

async function main() {
  const payload = await getPayload({ config })

  const sites = await payload.find({
    collection: 'sites',
    where: { slug: { equals: SLUG } },
    limit: 1,
    overrideAccess: true,
  })
  const site = sites.docs[0]
  if (!site) {
    console.error(`Site ${SLUG} not found`)
    process.exit(1)
  }
  console.log(`[rebuild] Site: ${site.name} (${site.id})`)

  for (const u of UPDATES) {
    const found = await payload.find({
      collection: 'pages',
      where: {
        and: [
          { site: { equals: site.id } },
          { slug: { in: u.slugs } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })
    const page = found.docs[0]
    if (!page) {
      console.warn(`[rebuild]   SKIP — no page found for slugs ${u.slugs.join(', ')}`)
      continue
    }
    await payload.update({
      collection: 'pages',
      id: page.id,
      data: {
        title: u.title,
        meta_title: u.meta_title,
        meta_description: u.meta_description,
        template_key: 'custom',
        uses_shared_template: false,
        status: 'published',
        body_blocks: u.blocks as never,
      },
      overrideAccess: true,
    })
    console.log(`[rebuild]   ✓ ${page.slug} — ${u.blocks.length} blocks`)
  }
  console.log('[rebuild] Done.')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
