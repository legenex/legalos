// Starter content for newly-created Sites/brands so a new site is never empty
// or broken. Reuses the realistic vertical home-page block templates that the
// seed uses, plus a generic qualifying quiz and a landing page. Everything is
// themed by the Site's brand tokens at render, and {{site.*}} vars resolve at
// render time.

import { CHECK_A_CASE_HOME, CHECK_MY_CLAIM_HOME, CLAIM_CHECKER_HOME } from '@/seed/home-blocks'

type Block = { blockType: string } & Record<string, unknown>

/**
 * A complete starter home-page block list appropriate for the Site's vertical.
 * Returns a deep copy so callers can't mutate the shared template.
 */
export function homeBlocksForVertical(vertical: string): Block[] {
  let template: Block[]
  switch (vertical) {
    case 'mva':
    case 'personal-injury':
      template = CHECK_MY_CLAIM_HOME
      break
    case 'workers-comp':
      template = CLAIM_CHECKER_HOME
      break
    // mass-tort, class-action, medical-malpractice, multi → the broad mass-tort
    // template, which reads as a generic "see if you qualify" funnel.
    default:
      template = CHECK_A_CASE_HOME
  }
  return JSON.parse(JSON.stringify(template)) as Block[]
}

/**
 * A generic 4-step qualifying quiz that ends in a contact terminus. Matches the
 * Quizzes collection schema (step_id/question/kind required; choices need
 * label+value).
 */
export function starterQuizSteps(): Array<Record<string, unknown>> {
  return [
    {
      step_id: 'matter',
      question: 'What can we help you with?',
      kind: 'single',
      choices: [
        { label: 'I was injured in an accident', value: 'accident' },
        { label: 'I was harmed by a product or medication', value: 'product' },
        { label: 'I was injured at work', value: 'work' },
        { label: 'Something else', value: 'other' },
      ],
    },
    {
      step_id: 'timing',
      question: 'When did this happen?',
      kind: 'single',
      choices: [
        { label: 'Within the last year', value: 'lt_1y' },
        { label: '1 to 3 years ago', value: '1_3y' },
        { label: 'More than 3 years ago', value: 'gt_3y' },
      ],
    },
    {
      step_id: 'represented',
      question: 'Are you already working with an attorney on this matter?',
      kind: 'single',
      choices: [
        { label: 'No, not yet', value: 'no' },
        { label: 'Yes, I already have an attorney', value: 'yes', dq: true },
      ],
    },
    {
      step_id: 'contact',
      question: 'Where should the attorney reach you?',
      kind: 'contact',
      is_terminal: true,
      choices: [],
    },
  ]
}

/** Starter landing-page content (hero + body sections + social proof). */
export function starterLandingPage(): {
  hero: { eyebrow: string; heading: string; sub: string }
  body_sections: Array<{ heading: string; body_markdown: string }>
  social_proof: Array<{ quote: string; attribution: string }>
} {
  return {
    hero: {
      eyebrow: 'Free case review',
      heading: 'See if you may qualify in two minutes.',
      sub: 'Answer a few quick questions and a partner attorney will review your situation at no cost.',
    },
    body_sections: [
      {
        heading: 'No cost, no obligation',
        body_markdown:
          'Your case review is completely free. Our partner law firms work on contingency, which means you pay nothing unless they recover compensation for you.',
      },
      {
        heading: 'How it works',
        body_markdown:
          '1. Answer a few quick questions.\n2. A partner attorney reviews your situation.\n3. If you qualify, the firm handles everything from there.',
      },
      {
        heading: 'Why it pays to act now',
        body_markdown:
          'Every claim has a filing deadline. The sooner you start your review, the more options you may have.',
      },
    ],
    social_proof: [
      { quote: 'The review took five minutes and an attorney called me back the same day.', attribution: 'Marcus, Ohio' },
      { quote: 'I was nervous about the cost. They explained there is no fee unless the firm wins my case.', attribution: 'Lisa, Florida' },
    ],
  }
}
