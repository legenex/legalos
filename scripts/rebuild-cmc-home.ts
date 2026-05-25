/**
 * One-shot: replace Site brand tokens and Home page body_blocks for check-my-claim.
 * Run: pnpm tsx scripts/rebuild-cmc-home.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const SLUG = 'check-my-claim'

type Block = { blockType: string } & Record<string, unknown>

const TCPA_CONSENT = `By submitting your information you agree to be contacted by {{site.org_name}} and our partner law firms by phone, text, and email regarding your inquiry, including by automated means. Consent is not a condition of any purchase. Message and data rates may apply. Reply STOP to unsubscribe. See our <a href="/tcpa">TCPA consent</a> and <a href="/privacy">privacy notice</a>.`

const HOME_BLOCKS: Block[] = [
  {
    blockType: 'nav_header',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Services', href: '#services' },
      { label: 'About Us', href: '#about' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Contact Us', href: '#contact' },
    ],
    cta_label: 'Start Your Free Claim Check',
    cta_href: '#hero',
    show_phone: true,
  },
  {
    blockType: 'hero',
    eyebrow: '100% Free · No Win, No Fee · Fast Results',
    heading: 'Check Your Claim, Get What You Deserve',
    sub: 'Unsure if you have a case after an accident? Our AI tool instantly checks if you may qualify for compensation and matches you with the best-suited attorney, at no upfront cost.',
    primary_cta_label: 'Start Your Free Claim Check',
    primary_cta_href: '#claim-check',
    secondary_cta_label: 'Call {{site.phone}}',
    secondary_cta_href: 'tel:{{site.phone_tel}}',
  },
  {
    blockType: 'trust_strip',
    items: [
      { value: '100% Free', label: 'Always, no hidden fees' },
      { value: 'No Win, No Fee', label: 'You pay nothing unless you win' },
      { value: 'Fast Results', label: 'Eligibility in minutes' },
    ],
  },
  {
    blockType: 'testimonials',
    heading: 'Real Stories, Real Results',
    items: [
      {
        quote: 'I had no clue how to handle my claim after my crash, but they did everything. Start to finish: professional, efficient, and got me the best possible outcome.',
        attribution: 'Jason Lambert',
      },
      {
        quote: 'My car was totaled, and I had no idea what to do next. Thanks to Check My Claim, I received compensation fast, and it was more than I expected!',
        attribution: 'Dana Hopson',
      },
      {
        quote: 'I wasn’t sure at first but every step a case turned out to be a blessing. We got connected with top specialists and our claim was handled smoothly.',
        attribution: 'Kyle Bernardez',
      },
    ],
  },
  {
    blockType: 'services_grid',
    eyebrow: 'Our specialties',
    heading: 'We’re Accident Compensation Specialists',
    sub: 'Every case is special. Our team is large and diverse, but our mission is singular: to deliver the best results for you and your family.',
    items: [
      { title: 'Auto Accidents', description: 'Getting paid for your injury shouldn’t be an accident.', icon: 'Car' },
      { title: 'Commercial Accidents', description: 'Get the compensation you deserve from commercial vehicle incidents.', icon: 'Truck' },
      { title: 'Ride Share Accidents', description: 'Don’t let ride share companies deny your rightful claim.', icon: 'Users' },
      { title: 'Work Place Accidents', description: 'Filing an injury claim shouldn’t feel like working another job.', icon: 'HardHat' },
    ],
  },
  {
    blockType: 'cards',
    heading: 'Who Can Check My Claim Help?',
    items: [
      { title: 'Injured in a car, truck, or rideshare accident in the last 12 months', body: 'If you were hurt in a crash within the past year, you may be entitled to compensation for medical bills, lost wages, and pain and suffering.', icon: '✓' },
      { title: 'Struggling with medical bills, lost wages, or ongoing pain after a crash', body: 'You shouldn’t have to carry the financial weight of someone else’s mistake. We connect you to attorneys who fight for what you deserve.', icon: '✓' },
    ],
  },
  {
    blockType: 'cards',
    heading: 'From Confusion to Clarity',
    items: [
      { title: 'Without Check My Claim', body: '✗ Stressed and unsure if you even have a case  ·  ✗ Buried in medical bills or lost income with no help  ·  ✗ Confused by insurance offers or legal steps', icon: '✗' },
      { title: 'With Check My Claim', body: '✓ Clear answers on whether you might qualify for a claim in minutes  ·  ✓ Matched with a top attorney suited to your case, at no upfront cost  ·  ✓ Peace of mind knowing someone’s fighting for what you might deserve', icon: '✓' },
    ],
  },
  {
    blockType: 'cta',
    heading: 'Ready to Transform Your Situation?',
    sub: 'Join thousands who’ve found clarity, justice, and compensation through Check My Claim.',
    label: 'Start Your Free Claim Check Now',
    href: '#claim-check',
  },
  {
    blockType: 'how_it_works',
    eyebrow: 'Our 3-step process',
    heading: 'Our Simple 3-Step Process',
    sub: 'Getting help after an accident shouldn’t be hard. Here’s how Check My Claim works:',
    steps: [
      { title: 'Complete Our Free Eligibility Check', description: 'Answer a few quick questions about your accident. This service is 100% free with no obligations.' },
      { title: 'Get Your Results Instantly', description: 'Our AI-powered tool analyzes your information to determine if you might qualify for compensation.' },
      { title: 'We Connect You to a Vetted Attorney', description: 'If eligible, we’ll match you with a trusted attorney from our network who works on a no win, no fee basis. From there, the attorney takes over your case.' },
    ],
  },
  {
    blockType: 'cards',
    heading: 'We Make Injury Claims Easy',
    items: [
      { title: 'Fast Eligibility Check', body: 'Get instant results in minutes. Simply answer a few quick questions about your accident to see if you may qualify for compensation.', icon: '⚡' },
      { title: 'Seamless Attorney Matching', body: 'We connect you to a vetted attorney from our nationwide network who specializes in your exact type of claim.', icon: '🤝' },
    ],
  },
  {
    blockType: 'stats',
    heading: 'We’ll Never Stop Fighting For You',
    items: [
      { value: '$50M+', label: 'Recovered for our clients' },
      { value: '10,000+', label: 'People helped nationwide' },
      { value: '500+', label: 'Vetted attorneys in network' },
      { value: '98%', label: 'Success rate' },
    ],
  },
  {
    blockType: 'bullet_list',
    heading: 'Our Attorneys Don’t Get Paid Unless You Do',
    items: [
      { item: 'THE NO WIN, NO FEE GUARANTEE — Check My Claim connects you with vetted attorneys in our network who work on a "no win, no fee" basis. The attorneys we match you with will not charge you a cent if they do not secure a positive outcome in your case.' },
      { item: 'Free claim eligibility check, always 100% free' },
      { item: 'Connected to attorneys who work on contingency' },
      { item: 'YOU HAVE NOTHING TO LOSE!' },
    ],
  },
  {
    blockType: 'cta',
    heading: '100% FREE · Zero Risk Guarantee',
    sub: 'Our role is simple: we provide a free eligibility check and connect you with the right legal professional. You pay nothing unless they win.',
    label: 'Start Your Free Claim Check',
    href: '#claim-check',
  },
  {
    blockType: 'recent_wins',
    eyebrow: 'Recent recoveries',
    heading: 'We’ll Never Stop Fighting For You',
    sub: 'We work with only the best attorneys to get you the compensation you deserve.',
    items: [
      { amount: '$132,700', case_type: 'Recent Win', description: 'Mike P, 31 — Memphis, TN' },
      { amount: '$197,500', case_type: 'Recent Win', description: 'John M, 54 — Tampa, FL' },
    ],
    disclaimer: 'Past results do not guarantee future outcomes. Each case is unique.',
  },
  {
    blockType: 'prose',
    markdown: `## About Check My Claim

We’re here to help accident victims get the clarity and support they need. Fast and risk-free.

At Check My Claim, our mission is simple: to empower those injured in accidents by providing a free, AI-powered claim check. We connect you with top attorneys who work on a "no win, no fee" basis, so you have nothing to lose. With thousands helped nationwide, we’re committed to fighting for the compensation you might deserve.

**Why people choose us:**
- Free AI-powered eligibility check
- No win, no fee — zero risk
- Matched with top attorneys nationwide
- Fast, compassionate support`,
  },
  {
    blockType: 'lead_form',
    eyebrow: 'Free claim check',
    heading: 'See if you may qualify in two minutes.',
    sub: 'No payment information. No obligation. A partner attorney reviews your situation at no cost.',
    submit_label: 'Start Your Free Claim Check',
    consent_md: TCPA_CONSENT,
    funnel_type: 'contact-form',
    success_slug: '/submitted',
  },
  {
    blockType: 'faq',
    heading: 'Frequently Asked Questions',
    items: [
      {
        question: 'Personal injury lawyer: how does Check My Claim help you find one?',
        answer: 'If you are searching for a personal injury lawyer after an accident, Check My Claim helps you start with a quick eligibility check instead of calling random firms. If your case looks like a fit, we connect you with a vetted attorney for a review. Check My Claim is not a law firm and does not provide legal advice.',
      },
      {
        question: 'Personal injury attorney vs personal injury lawyer: what is the difference?',
        answer: 'In most US jurisdictions the two terms are used interchangeably. Both refer to a licensed lawyer who represents people injured in accidents. Differences in title are largely a matter of preference.',
      },
      {
        question: 'Injury lawyer: when should I talk to one after an accident?',
        answer: 'As soon as practical. Evidence is freshest, witnesses are easier to reach, and statutes of limitations are still well within reach. A free eligibility check costs nothing and only takes minutes.',
      },
      {
        question: 'Lawyer for motor vehicle accident: do I need one to file a claim?',
        answer: 'You are not required to have a lawyer to file an insurance claim, but representation often results in larger settlements and protects you from low-ball offers and procedural mistakes.',
      },
      {
        question: 'Motor vehicle accident attorneys: how do I find the right one?',
        answer: 'Look for a track record with cases like yours, a clear fee structure (ideally contingency), responsive communication, and trial experience if your case might go that way. Our matching process screens for these criteria.',
      },
      {
        question: 'Car accident personal injury lawyer: what can they help with?',
        answer: 'Medical bills, lost wages, pain and suffering, property damage, future care costs, and negotiating with insurers. They can also pursue litigation if a fair settlement is not offered.',
      },
      {
        question: 'Car accident personal injury attorney: how fast can I speak to one?',
        answer: 'After your free eligibility check, qualifying claimants are typically contacted by a partner attorney the same day, often within minutes.',
      },
      {
        question: 'Auto accident personal injury lawyer: do I qualify if I was partly at fault?',
        answer: 'Possibly — many states follow comparative-fault rules where you can still recover damages reduced by your share of fault. A free review is the fastest way to find out.',
      },
      {
        question: 'Car accident injury lawyers: what should I ask before hiring?',
        answer: 'Ask about case experience, fee structure, who will actually handle your case day-to-day, expected timeline, and how they communicate updates. Get the answers in writing.',
      },
    ],
  },
  {
    blockType: 'final_cta',
    eyebrow: 'Still have questions?',
    heading: 'Start your free claim check now.',
    sub: 'Takes less than 2 minutes. 100% free. No obligation.',
    primary_cta_label: 'Get Started Now',
    primary_cta_href: '#claim-check',
    show_phone: true,
  },
  {
    blockType: 'site_footer',
    columns: [
      {
        heading: 'Quick Links',
        links: [
          { label: 'Home', href: '/' },
          { label: 'About Us', href: '#about' },
          { label: 'Services', href: '#services' },
          { label: 'FAQ', href: '#faq' },
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
  },
]

async function main() {
  const payload = await getPayload({ config })

  // 1. Find the Site
  const sites = await payload.find({
    collection: 'sites',
    where: { slug: { equals: SLUG } },
    limit: 1,
    overrideAccess: true,
  })
  const site = sites.docs[0]
  if (!site) {
    console.error(`Site with slug ${SLUG} not found`)
    process.exit(1)
  }
  console.log(`[rebuild] Site: ${site.name} (${site.id})`)

  // 2. Update brand tokens to dark-navy + blue accent (matches Base44 screenshots)
  await payload.update({
    collection: 'sites',
    id: site.id,
    data: {
      brand: {
        ...(site.brand ?? {}),
        primary: '#0C2D5B',
        accent: '#0486E9',
        surface: '#F5F8FC',
        ink: '#0C2D5B',
        muted: '#5C6470',
        success: '#1F9D55',
      },
    },
    overrideAccess: true,
  })
  console.log('[rebuild] Brand tokens updated.')

  // 3. Find the home Page
  const pages = await payload.find({
    collection: 'pages',
    where: {
      and: [
        { site: { equals: site.id } },
        { slug: { in: ['/', ''] } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })
  const home = pages.docs[0]
  if (!home) {
    console.error('Home page (slug "/") not found for this site')
    process.exit(1)
  }
  console.log(`[rebuild] Home Page: ${home.title} (${home.id})`)

  // 4. Replace body_blocks
  await payload.update({
    collection: 'pages',
    id: home.id,
    data: {
      title: 'Check My Claim — Get What You Deserve',
      meta_title: 'Check My Claim — Free AI-Powered Claim Check',
      meta_description: 'Free, AI-powered claim eligibility check. Matched with top no-win-no-fee attorneys nationwide. Takes less than 2 minutes.',
      template_key: 'custom',
      uses_shared_template: false,
      status: 'published',
      body_blocks: HOME_BLOCKS as never,
    },
    overrideAccess: true,
  })
  console.log(`[rebuild] Home page body_blocks replaced — ${HOME_BLOCKS.length} blocks.`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
