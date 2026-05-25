// Home page body_blocks for each seeded Site. Realistic legal-vertical copy.
// All {{site.*}} variables are resolved at render time, so we leave them in here.

type Block = { blockType: string } & Record<string, unknown>

const FOOTER_COLUMNS = [
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Our partners', href: '/partners' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy notice', href: '/privacy' },
      { label: 'Terms of service', href: '/terms-of-service' },
      { label: 'TCPA consent', href: '/tcpa' },
      { label: 'Disclosures', href: '/disclosures' },
    ],
  },
]

const FOOTER_LEGAL_MD = `{{site.org_name}} is a marketing service, not a law firm. Submitting your information does not create an attorney-client relationship. Any case review is performed by a licensed attorney at one of our partner law firms. Past results do not guarantee future outcomes. This is attorney advertising.

© {{year}} {{site.org_name}}. All rights reserved.`

const NAV_HEADER: Block = {
  blockType: 'nav_header',
  links: [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Our partners', href: '/partners' },
    { label: 'FAQ', href: '#faq' },
  ],
  cta_label: 'Check my case',
  cta_href: '#hero',
  show_phone: true,
}

const SITE_FOOTER: Block = {
  blockType: 'site_footer',
  columns: FOOTER_COLUMNS,
  legal_md: FOOTER_LEGAL_MD,
}

const TCPA_CONSENT = `By submitting your information you agree to be contacted by {{site.org_name}} and our partner law firms by phone, text, and email regarding your inquiry, including by automated means. Consent is not a condition of any purchase. Message and data rates may apply. Reply STOP to unsubscribe. See our <a href="/tcpa">TCPA consent</a> and <a href="/privacy">privacy notice</a>.`

const LEAD_FORM: Block = {
  blockType: 'lead_form',
  eyebrow: 'Free case review',
  heading: 'See if you qualify in two minutes.',
  sub: 'No payment information. No obligation. A partner attorney reviews your situation at no cost.',
  submit_label: 'Check my case',
  consent_md: TCPA_CONSENT,
  funnel_type: 'contact-form',
  success_slug: '/submitted',
}

/* -------------------------------------------------------------------------- */
/*                              Check A Case (Mass Tort)                       */
/* -------------------------------------------------------------------------- */

export const CHECK_A_CASE_HOME: Block[] = [
  NAV_HEADER,
  {
    blockType: 'hero',
    eyebrow: 'Free case review',
    heading: 'See if you may qualify for a mass tort claim.',
    sub: 'Answer a few quick questions and a partner attorney will review your situation at no cost.',
    primary_cta_label: 'Start my free review',
    primary_cta_href: '#quiz',
    secondary_cta_label: `Call {{site.phone}}`,
    secondary_cta_href: 'tel:{{site.phone_tel}}',
  },
  LEAD_FORM,
  {
    blockType: 'trust_strip',
    items: [
      { value: '50,000+', label: 'Claimants reviewed' },
      { value: '$2.4B+', label: 'Recovered for clients' },
      { value: '$0', label: 'Out of pocket cost' },
      { value: '24/7', label: 'Case intake' },
    ],
  },
  {
    blockType: 'services_grid',
    eyebrow: 'Active matters',
    heading: 'Cases we review',
    sub: 'Our partner firms handle large-scale product liability and consumer harm matters across the country.',
    items: [
      { title: 'Hair Relaxer', description: 'Long-term chemical hair relaxer use linked to uterine and ovarian cancer.', icon: 'H' },
      { title: 'Talc / Baby Powder', description: 'Talcum powder linked to ovarian cancer and mesothelioma.', icon: 'T' },
      { title: 'Roundup', description: 'Glyphosate exposure linked to non-Hodgkin lymphoma.', icon: 'R' },
      { title: 'Paraquat', description: 'Paraquat herbicide exposure linked to Parkinson’s disease.', icon: 'P' },
      { title: 'AFFF Firefighting Foam', description: 'PFAS exposure linked to several cancers in firefighters and military.', icon: 'F' },
      { title: 'Hernia Mesh', description: 'Defective mesh implants causing complications and revision surgery.', icon: 'M' },
      { title: 'Camp Lejeune', description: 'Contaminated water at Camp Lejeune between 1953 and 1987.', icon: 'C' },
      { title: 'Social Media Harm', description: 'Youth mental-health injury claims against social platforms.', icon: 'S' },
    ],
  },
  {
    blockType: 'how_it_works',
    eyebrow: 'How it works',
    heading: 'Three steps to your free case review',
    steps: [
      { title: 'Answer a few questions', description: 'Tell us about your situation in about two minutes. No payment, no obligation.' },
      { title: 'Speak with an attorney', description: 'A partner law firm contacts you to review whether you may qualify.' },
      { title: 'Move forward, fee-free', description: 'If your case qualifies, you pay nothing unless your attorney recovers compensation.' },
    ],
  },
  {
    blockType: 'recent_wins',
    eyebrow: 'Outcomes',
    heading: 'Recent settlements and verdicts',
    sub: 'A small sample of mass tort outcomes from cases similar to ones we review.',
    items: [
      { amount: '$2.1B', case_type: 'Talcum Powder Settlement', description: 'Class settlement covering thousands of ovarian cancer claimants.' },
      { amount: '$289M', case_type: 'Roundup Verdict', description: 'Jury verdict for a school groundskeeper diagnosed with NHL.' },
      { amount: '$110M', case_type: 'Hernia Mesh', description: 'Verdict for a single plaintiff after a defective implant.' },
    ],
    disclaimer: 'Prior outcomes do not guarantee a similar outcome in your case. Every case is different.',
  },
  {
    blockType: 'testimonials',
    heading: 'What clients have said',
    items: [
      {
        quote: 'I had no idea where to start. They walked me through it and connected me to a firm the same day.',
        attribution: 'Karen, Texas',
      },
      {
        quote: 'The review took five minutes. The attorney called me back within hours and explained everything clearly.',
        attribution: 'Marcus, Ohio',
      },
      {
        quote: 'I was nervous about the cost. They explained there is no fee unless the firm wins my case.',
        attribution: 'Lisa, Florida',
      },
    ],
  },
  {
    blockType: 'faq',
    heading: 'Common questions',
    items: [
      {
        question: 'How much does this cost me?',
        answer: 'Nothing. The case review is free, and partner firms work on a contingency basis. You pay only if they recover compensation for you.',
      },
      {
        question: 'How long does a case take?',
        answer: 'Every case is different. Some mass tort matters resolve within months; others take years. The attorney reviewing your case can give you a realistic estimate.',
      },
      {
        question: 'Who will I speak with?',
        answer: 'A licensed attorney or case manager at one of our partner law firms that handles the type of matter you contacted us about.',
      },
      {
        question: 'Is my information private?',
        answer: 'Yes. We share your information only with the partner law firm reviewing your case. See our privacy notice for full details.',
      },
    ],
  },
  {
    blockType: 'final_cta',
    eyebrow: 'No fee unless we win',
    heading: 'Find out if you qualify today.',
    sub: 'Two minutes is all it takes to start your free case review.',
    primary_cta_label: 'Start my free review',
    primary_cta_href: '#quiz',
    show_phone: true,
  },
  SITE_FOOTER,
]

/* -------------------------------------------------------------------------- */
/*                          Check My Claim (MVA)                              */
/* -------------------------------------------------------------------------- */

export const CHECK_MY_CLAIM_HOME: Block[] = [
  NAV_HEADER,
  {
    blockType: 'hero',
    eyebrow: 'Free claim check',
    heading: 'Were you in an accident? See if you qualify.',
    sub: 'A two-minute claim check matches you with a personal injury attorney at no cost.',
    primary_cta_label: 'Check my claim',
    primary_cta_href: '#quiz',
    secondary_cta_label: `Call {{site.phone}}`,
    secondary_cta_href: 'tel:{{site.phone_tel}}',
  },
  { ...LEAD_FORM, heading: 'Check your claim in two minutes.', submit_label: 'Check my claim' },
  {
    blockType: 'trust_strip',
    items: [
      { value: '120,000+', label: 'Accident claims reviewed' },
      { value: '$1.8B+', label: 'Recovered for clients' },
      { value: '24/7', label: 'Claim intake' },
      { value: '$0', label: 'Upfront cost' },
    ],
  },
  {
    blockType: 'services_grid',
    eyebrow: 'Accident types we cover',
    heading: 'What kind of accident were you in?',
    sub: 'Our partner attorneys handle personal injury claims for any motor vehicle accident.',
    items: [
      { title: 'Car Accident', description: 'Rear-end, head-on, T-bone, multi-vehicle collisions.', icon: 'C' },
      { title: 'Truck Accident', description: 'Crashes involving semis, 18-wheelers, and commercial trucks.', icon: 'T' },
      { title: 'Motorcycle Accident', description: 'Motorcycle and scooter crashes with serious injury.', icon: 'M' },
      { title: 'Rideshare', description: 'Uber, Lyft, and other rideshare incidents.', icon: 'R' },
      { title: 'Pedestrian', description: 'Pedestrian struck by a vehicle in a crosswalk or street.', icon: 'P' },
      { title: 'Hit and Run', description: 'Crashes where the other driver fled the scene.', icon: 'H' },
    ],
  },
  {
    blockType: 'how_it_works',
    eyebrow: 'How it works',
    heading: 'Three steps to a free claim review',
    steps: [
      { title: 'Tell us what happened', description: 'Quick claim check, no payment information, no obligation.' },
      { title: 'Talk to an attorney', description: 'A partner personal injury attorney reaches out, usually the same day.' },
      { title: 'Recover compensation', description: 'If your claim qualifies, the firm advances the costs. You pay only if they win.' },
    ],
  },
  {
    blockType: 'recent_wins',
    eyebrow: 'Outcomes',
    heading: 'Recent recoveries',
    sub: 'Sample personal injury recoveries from cases similar to ones our partner firms handle.',
    items: [
      { amount: '$1.6M', case_type: 'Truck Collision', description: 'Settlement for a driver hit by a delivery truck with permanent back injury.' },
      { amount: '$850K', case_type: 'Rideshare Crash', description: 'Settlement for a passenger injured in a multi-vehicle Uber collision.' },
      { amount: '$420K', case_type: 'Pedestrian Hit', description: 'Recovery for a pedestrian struck in a marked crosswalk.' },
    ],
    disclaimer: 'Past results are not a guarantee of future outcomes. Each case is evaluated individually.',
  },
  {
    blockType: 'faq',
    heading: 'Common questions',
    items: [
      {
        question: 'How long do I have to file a claim?',
        answer: 'Every state has a statute of limitations, usually one to three years from the date of the accident. The sooner you act, the more options you have.',
      },
      {
        question: 'What if the other driver had no insurance?',
        answer: 'You may still have a path forward through your own uninsured-motorist coverage. The reviewing attorney will explain the options.',
      },
      {
        question: 'Do I need to pay anything up front?',
        answer: 'No. Our partner firms work on contingency, which means no fee unless they recover compensation for you.',
      },
    ],
  },
  {
    blockType: 'final_cta',
    eyebrow: 'No cost. No obligation.',
    heading: 'Check your claim in two minutes.',
    sub: 'Find out today whether you may qualify for a personal injury claim.',
    primary_cta_label: 'Check my claim',
    primary_cta_href: '#quiz',
    show_phone: true,
  },
  SITE_FOOTER,
]

/* -------------------------------------------------------------------------- */
/*                       Claim Checker (Workers' Comp)                        */
/* -------------------------------------------------------------------------- */

export const CLAIM_CHECKER_HOME: Block[] = [
  NAV_HEADER,
  {
    blockType: 'hero',
    eyebrow: 'Free claim review',
    heading: 'Injured at work? Check your claim today.',
    sub: 'A two-minute claim check connects you to a workers compensation attorney for a free review.',
    primary_cta_label: 'Check my claim',
    primary_cta_href: '#quiz',
    secondary_cta_label: `Call {{site.phone}}`,
    secondary_cta_href: 'tel:{{site.phone_tel}}',
  },
  { ...LEAD_FORM, heading: 'Check your workers comp claim today.', submit_label: 'Check my claim' },
  {
    blockType: 'trust_strip',
    items: [
      { value: '80,000+', label: 'Workers helped' },
      { value: '$1.1B+', label: 'Recovered in benefits' },
      { value: '$0', label: 'Upfront cost' },
      { value: 'All 50', label: 'States covered' },
    ],
  },
  {
    blockType: 'services_grid',
    eyebrow: 'Workplace injuries we review',
    heading: 'What happened at work?',
    sub: 'Our partner firms handle workers compensation claims for almost every workplace injury type.',
    items: [
      { title: 'Back & Spine Injuries', description: 'Lifting injuries, slipped discs, and chronic back pain claims.', icon: 'B' },
      { title: 'Repetitive Strain', description: 'Carpal tunnel and other long-term repetitive injuries.', icon: 'R' },
      { title: 'Slips, Trips, Falls', description: 'Falls from height or on a wet floor causing serious injury.', icon: 'S' },
      { title: 'Construction', description: 'Site injuries from equipment, falls, and struck-by incidents.', icon: 'C' },
      { title: 'Toxic Exposure', description: 'Long-term workplace exposure to chemicals or hazardous materials.', icon: 'T' },
      { title: 'Denied Claim Appeals', description: 'Already filed and denied? We review appeal options too.', icon: 'D' },
    ],
  },
  {
    blockType: 'how_it_works',
    eyebrow: 'How it works',
    heading: 'Three steps to your benefits',
    steps: [
      { title: 'Tell us what happened', description: 'Quick claim check covering the basics of your injury and employer.' },
      { title: 'Talk to an attorney', description: 'A workers comp attorney reviews your case at no cost.' },
      { title: 'Pursue your benefits', description: 'If you qualify, the firm pursues medical, wage, and disability benefits on your behalf.' },
    ],
  },
  {
    blockType: 'recent_wins',
    eyebrow: 'Outcomes',
    heading: 'Recent claim outcomes',
    sub: 'Sample workers comp results from cases similar to ones our partners review.',
    items: [
      { amount: '$320K', case_type: 'Back Injury', description: 'Lump-sum settlement after a denied claim was reopened on appeal.' },
      { amount: '$180K', case_type: 'Carpal Tunnel', description: 'Recovery for an assembly-line worker with bilateral surgery.' },
      { amount: '$92K', case_type: 'Slip and Fall', description: 'Settlement for a warehouse worker with a knee injury.' },
    ],
    disclaimer: 'Prior outcomes do not guarantee a similar outcome. Each claim is reviewed individually.',
  },
  {
    blockType: 'faq',
    heading: 'Common questions',
    items: [
      {
        question: 'What if my employer says I am not covered?',
        answer: 'Most employees are covered by state workers compensation law, even if your employer says otherwise. The reviewing attorney can confirm.',
      },
      {
        question: 'Can I be fired for filing a claim?',
        answer: 'Most states have anti-retaliation protections. If you were terminated after filing, that may be a separate claim worth pursuing.',
      },
      {
        question: 'Do I pay anything if my claim is denied?',
        answer: 'No. Our partner firms work on contingency. You pay only if they recover benefits for you.',
      },
    ],
  },
  {
    blockType: 'final_cta',
    eyebrow: 'Free and confidential',
    heading: 'Check your workers comp claim today.',
    sub: 'It takes two minutes. There is no cost and no obligation.',
    primary_cta_label: 'Check my claim',
    primary_cta_href: '#quiz',
    show_phone: true,
  },
  SITE_FOOTER,
]

/* -------------------------------------------------------------------------- */
/*                              Slug-keyed lookup                             */
/* -------------------------------------------------------------------------- */

export const HOME_BLOCKS_BY_SLUG: Record<string, Block[]> = {
  'check-a-case': CHECK_A_CASE_HOME,
  'check-my-claim': CHECK_MY_CLAIM_HOME,
  'claim-checker': CLAIM_CHECKER_HOME,
}
