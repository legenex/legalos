/**
 * The build log shown at /admin/buildlog.
 *
 * Data, not prose: each entry is a structured record so the page can render
 * status consistently and so "what actually shipped" stays separate from "what
 * is still open". Append a new entry at the TOP of ENTRIES when work lands.
 *
 * The honesty rule for this file: `status` describes the code as committed, and
 * `verification` describes what was actually run. A thing that compiles but has
 * never been exercised is 'shipped' with a verification note saying so - it is
 * not 'verified'. Nothing here should read as finished when it is not.
 */

export type ItemStatus = 'shipped' | 'partial' | 'open'

export type BuildLogItem = {
  /** The owner's own numbering where one exists, e.g. '9'. */
  ref?: string
  title: string
  status: ItemStatus
  /** What changed, in the reader's terms. */
  detail: string
  /** Repo-relative paths a reader can open to see it. */
  files?: string[]
  /** Overrides the area inferred from `files`. */
  area?: Area
}

export type BuildLogVerification = {
  label: string
  state: 'verified' | 'not-run'
  detail: string
}

export type BuildLogEntry = {
  /** ISO date, rendered as a stable absolute date. */
  date: string
  title: string
  summary: string
  items: BuildLogItem[]
  verification: BuildLogVerification[]
  /** Anything an operator must do on deploy for the entry to take effect. */
  deployNotes?: string[]
  /** Known gaps this entry did NOT close. */
  openIssues?: string[]
}

export const STATUS_LABEL: Record<ItemStatus, string> = {
  shipped: 'Shipped',
  partial: 'Partial',
  open: 'Not started',
}


/**
 * Areas of the system, used to filter the board.
 *
 * Derived from an item's own file paths rather than hand-tagged on 60-odd
 * existing items: a tag typed by hand goes stale the moment the item is edited,
 * where a path is the item's actual subject. An item can be given an explicit
 * `area` when the inference gets it wrong.
 */
export const AREAS = [
  'Brand',
  'Quiz',
  'Landing page',
  'Public render',
  'Domains',
  'Leads',
  'Data',
  'Admin',
] as const

export type Area = (typeof AREAS)[number]

const AREA_RULES: Array<[RegExp, Area]> = [
  [/\/brand\/|brand-map|brand-identities|BrandModule|tokens\.ts/, 'Brand'],
  [/quiz/i, 'Quiz'],
  [/\/lp\/|landing/i, 'Landing page'],
  [/migrations\/|collections\//, 'Data'],
  [/lead/i, 'Leads'],
  [/domain/i, 'Domains'],
  [/\(public\)|components\/blocks|components\/public|bespoke-css/, 'Public render'],
  [/\(app\)\/admin|scripts\//, 'Admin'],
]

export const inferArea = (item: BuildLogItem): Area => {
  if (item.area) return item.area
  const haystack = (item.files ?? []).join(' ')
  for (const [re, area] of AREA_RULES) if (re.test(haystack)) return area
  return 'Admin'
}

/** URL-safe slug. Stable across re-ordering; changes only if the text changes. */
const slug = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

/**
 * Stable anchors for comments.
 *
 * Derived from content, not from row ids or array positions: the log is code,
 * so there is nothing to relate to, and an index-based id would reassign every
 * comment the moment a new entry is added at the top. Renaming an item does
 * orphan its comments, which is why the comment also stores the title it was
 * written against.
 */
export const buildLogEntryId = (entry: BuildLogEntry): string => `${entry.date}--${slug(entry.title)}`

export const buildLogItemId = (entry: BuildLogEntry, item: BuildLogItem): string =>
  `${buildLogEntryId(entry)}--${slug(item.title)}`

export const ENTRIES: BuildLogEntry[] = [
  {
    date: '2026-07-29',
    title: 'The build log becomes the review surface',
    summary:
      'Rather than a second progress page, the existing board gained the review loop: every item can be commented on, comments persist against that specific decision, and each item is categorised so the board can be read by area instead of only by date.',
    items: [
      {
        title: 'Comments, attached to the decision they are about',
        status: 'shipped',
        detail:
          'Any item can be commented on, and the comment stays with that item rather than in a chat thread nobody can find next week. Threads collapse to a count so the board stays scannable, and an item with unanswered feedback shows its open count without being expanded.',
        files: ['src/app/(app)/admin/(top)/buildlog/CommentThread.tsx'],
      },
      {
        title: 'Stored in the database, not a file',
        status: 'shipped',
        detail:
          'The agent-plan board keeps machine-written status in JSON files, which is the right weight for something cheap to regenerate. These are notes a person wrote about a decision, and losing them to a rebuilt server would be a real loss, so they go in the database where they are backed up, exportable and covered by the audit hooks.',
        files: ['src/collections/BuildLogComments.ts', 'src/migrations/20260729_230000_buildlog_comments.ts'],
      },
      {
        title: 'Comments survive a rename instead of vanishing',
        status: 'shipped',
        detail:
          'Anchors are slugs derived from the log\u2019s own content, because the log is code and there is no row to relate to. That means renaming an item would orphan its comments, so the title the comment was written against is stored with it: an orphan is shown with its original target rather than silently disappearing.',
        files: ['src/lib/buildlog.ts'],
      },
      {
        title: 'Items are categorised by area',
        status: 'shipped',
        detail:
          'Each item carries an area - brand, quiz, landing page, public render, domains, leads, data, admin - inferred from its own file paths rather than hand-tagged across sixty-odd existing items. A tag typed by hand goes stale when the item is edited; a path is the item\u2019s actual subject. An explicit area can override the inference.',
        files: ['src/lib/buildlog.ts'],
      },
      {
        title: 'A summary that leads with what is not done',
        status: 'shipped',
        detail:
          'Counts of entries, items, items not shipped, and open comments, with the last two in amber when they are non-zero. Unrun verification checks are called out above the entries rather than summarised away, because an unrun check is not a passing one.',
        files: ['src/app/(app)/admin/(top)/buildlog/page.tsx'],
      },
      {
        title: 'Screenshots of each section',
        status: 'open',
        detail:
          'Not built. It needs a headless browser on the server, a capture job and image storage, which is a real dependency I cannot install or test from here. The comment loop works without it, so it ships first and capture follows once the dependency can be verified on the server.',
      },
    ],
    verification: [
      {
        label: 'Anchors are stable',
        state: 'verified',
        detail:
          'All 63 item ids are unique with no collisions, and an id is unchanged when entries are reordered - which matters because a new entry is added at the top every time, and an index-based id would reassign every existing comment.',
      },
      {
        label: 'Degrades before the migration runs',
        state: 'verified',
        detail:
          'The comment read is wrapped so a missing table renders an empty board rather than a 500. A page whose job is reporting state should not itself be the thing that is down.',
      },
      {
        label: 'In the browser',
        state: 'not-run',
        detail: 'Nothing here has been clicked. Post a comment, resolve it, reopen it, and delete one.',
      },
    ],
    deployNotes: [
      'Adds a migration for the comments table. Run pnpm payload migrate after the build.',
      'Until that migration runs the board renders normally with no comments, rather than erroring.',
    ],
    openIssues: [
      'Screenshot capture per section is not built. It needs a headless browser on the server.',
      'Comments cannot yet be filtered to just the open ones, and there is no notification when one is added.',
    ],
  },
  {
    date: '2026-07-29',
    title: 'Pickers stop offering things that cannot be used (P0-D)',
    summary:
      'The archived quiz you spotted in the deployment dropdown, and the free-text domain field next to it. Both are now real pickers over real records, through one helper, so the same mistake cannot be made screen by screen.',
    items: [
      {
        title: 'Archived quizzes are no longer offered',
        status: 'shipped',
        detail:
          'Archiving a quiz is a decision to stop using it, and a retired quiz sitting in the deployment dropdown is how it gets deployed again by accident. Pickers now return published and draft records only.',
        files: ['src/lib/selectable.ts', 'src/components/builder/quiz/QuizBuilderApp.tsx'],
      },
      {
        title: 'But a saved reference is never dropped silently',
        status: 'shipped',
        detail:
          'Filtering alone would have created a worse bug. A deployment pointing at a quiz that was archived afterwards would find its value missing from the list, and the select would fall back to whatever came first, silently repointing a live deployment at a different quiz the next time anyone saved an unrelated field. The archived record is kept, disabled, labelled, with a line explaining what happened. A reference to something deleted entirely shows as missing rather than as an empty box.',
        files: ['src/lib/selectable.ts'],
      },
      {
        title: 'Domain is a picker, not a text box',
        status: 'shipped',
        detail:
          'It was free text, so a typo produced a deployment bound to a host that does not exist and nothing said so until a visitor got a 404. It now lists the brand\u2019s own domains, and only one that is active with an active certificate can be chosen. A domain that is not ready is shown greyed out rather than hidden, so "why is my domain not in the list" has an answer on screen. A brand with no ready domain gets a link to connect one instead of an empty select.',
        files: ['src/components/builder/quiz/QuizBuilderApp.tsx', 'src/lib/brand-map.ts'],
      },
      {
        title: 'One helper, so this cannot drift per screen',
        status: 'partial',
        detail:
          'The rules live in one place and the quiz and domain pickers use it. The remaining dropdowns across the admin still run their own queries and have not been converted yet.',
        files: ['src/lib/selectable.ts'],
      },
    ],
    verification: [
      {
        label: 'Picker rules',
        state: 'verified',
        detail:
          '17 assertions. Archived records are absent, drafts are present, a saved reference to an archived record is kept and disabled, a dangling reference is surfaced rather than swallowed, only a fully ready domain is selectable, and a saved domain whose certificate lapsed is kept disabled while an unrelated unready one stays hidden. The last group asserts the property directly: whatever is currently saved is always present in the options.',
      },
      {
        label: 'On screen',
        state: 'not-run',
        detail:
          'Open a deployment and confirm the archived quiz is gone from the dropdown, and that the domain field is now a list of that brand\u2019s domains.',
      },
    ],
    deployNotes: [
      'No migration.',
      'A deployment whose domain was typed by hand and does not match a Domain row will show as unset. Pick the right domain and save.',
    ],
    openIssues: [
      'The publish gate is still not built, so nothing yet blocks publishing to a host that is not ready. The picker discourages it; only the gate will prevent it.',
      'Other admin dropdowns still query directly and need converting to the shared helper.',
    ],
  },
  {
    date: '2026-07-29',
    title: 'One tenant\u2019s logo stops appearing on everyone\u2019s site',
    summary:
      'A new brand at getwhatyoureowed.co was showing the Check My Claim logo. Two bugs in the shared navigation, and a third in what a new brand starts life as. None of them was a styling problem.',
    items: [
      {
        title: 'The nav read a field that does not exist',
        status: 'shipped',
        detail:
          'It looked for the logo at the top level of the Site record. The logo lives on the brand. So the lookup was always empty and setting a logo in the brand editor did nothing, which is why there appeared to be nowhere to add one.',
        files: ['src/components/blocks/BlockRenderer.tsx'],
      },
      {
        title: 'And fell through to a hardcoded Check My Claim logo',
        status: 'shipped',
        detail:
          'The final fallback was a fixed URL to one tenant\u2019s logo file. With the brand lookup always empty, every site that had not overridden the logo on the block itself landed on it. The fallback is now the site\u2019s own name as a wordmark, styled from the brand tokens: a brand with no logo should look like a brand with no logo, not like a different company.',
        files: ['src/components/blocks/BlockRenderer.tsx', 'src/components/blocks/bespoke-css.ts'],
      },
      {
        title: 'A new brand was a copy of Check My Claim',
        status: 'shipped',
        detail:
          'Creating a brand seeded that tenant\u2019s display name, phone number, copyright line, privacy and terms URLs, domains, colours and fonts. The create action overrode the name and left the rest, so every brand started as a copy and stayed one in any field nobody happened to edit. A new brand is now genuinely blank, and blank colours resolve to the neutral grey that reads as unconfigured.',
        files: ['src/components/builder/brand/BrandModule.tsx'],
      },
      {
        title: 'Fabricated evidence was being seeded into new sites',
        status: 'shipped',
        detail:
          'The brand seed carried named people, cities and settlement amounts, and the starter home page carried claims of tens of thousands of claimants reviewed and billions recovered. Those were auto-inserted into legal advertising for a brand that had not yet reviewed a single claim. Both are gone. What remains describes how the service works rather than what it has achieved.',
        files: ['src/components/builder/brand/BrandModule.tsx', 'src/seed/home-blocks.ts'],
      },
    ],
    verification: [
      {
        label: 'No tenant asset left in shared code',
        state: 'verified',
        detail:
          'A repo-wide search for that logo URL now returns only the check-my-claim page components, which are that tenant\u2019s own files and are already tracked separately for deletion.',
      },
      {
        label: 'On screen',
        state: 'not-run',
        detail:
          'Worth loading getwhatyoureowed.co after deploying. Expect either that brand\u2019s own logo if one is set, or its name as a wordmark. If the Check My Claim logo is still there, it is saved into that page\u2019s navigation block and needs clearing in the page builder rather than in code.',
      },
    ],
    deployNotes: [
      'No migration.',
      'A site with no brand logo will show its name as a wordmark. Set the logo on the brand identity and every page for that brand picks it up.',
      'Existing pages whose navigation block has a logo saved into it keep that logo. The block override still wins, which is correct, but it means an imported page may need clearing by hand.',
    ],
    openIssues: [
      'The starter home page still ships headline copy written for a mass-tort brand. It reads as generic today but should become vertical-aware.',
    ],
  },
  {
    date: '2026-07-29',
    title: 'Quizzes actually wear their brand now',
    summary:
      'The quiz preview barely reflected the brand, and the reason was not styling. The map that feeds every funnel builder was reading the page background out of the brand\u2019s body-text colour, never populating the card colour at all, and filling both gaps with Check My Claim\u2019s blue and navy. Any brand with a sparse record was rendering as a different brand.',
    items: [
      {
        title: 'The page background was the text colour',
        status: 'shipped',
        detail:
          'The funnel brand map took the quiz page ground from the brand\u2019s ink field, which is the body-text colour and is dark by definition. Every quiz therefore rendered on a dark ground regardless of what the brand said its background was. It now reads the background token, which is the field that means background.',
        files: ['src/lib/brand-map.ts'],
      },
      {
        title: 'Every brand\u2019s quiz card was Check My Claim navy',
        status: 'shipped',
        detail:
          'The card colour was never populated, so it always fell through to a hardcoded navy, and the primary fell through to a hardcoded blue. Those two values are one specific tenant\u2019s palette. A brand that had not filled in every field was not approximately wrong, it was showing another brand\u2019s colours.',
        files: ['src/lib/brand-map.ts'],
      },
      {
        title: 'The map now goes through the one resolver',
        status: 'shipped',
        detail:
          'Colour for the quiz, landing page and advertorial builders is resolved by the same function the public site uses, so the same brand cannot look like two different brands depending on which surface renders it. The brand JSON is no longer consulted for colour either: the token columns are the single store, and reading both is how two stores drift.',
        files: ['src/lib/brand-map.ts'],
      },
      {
        title: 'An unconfigured brand looks unconfigured',
        status: 'shipped',
        detail:
          'A brand with no colours set now resolves to a grey with no hue at all, and carries a flag saying which tokens are missing. Grey reads as "nobody has set this yet"; a blue reads as a finished brand that happens to be wrong. Even a blue-tinted grey was too suggestive, so the placeholder has zero saturation.',
        files: ['src/lib/brand-map.ts'],
      },
      {
        title: 'The editorial template stopped ignoring the brand',
        status: 'shipped',
        detail:
          'It hardcoded a cream page and gold accents, so it looked identical for every brand that chose it. Its paper is now the brand\u2019s own surface pushed to a paper lightness and warmed slightly toward the brand\u2019s accent, and its rules take the accent. The character survives, the colour comes from the brand: a navy brand gets an ivory sheet, a green brand gets a warmer stone one.',
        files: ['src/components/builder/quiz/templates.tsx'],
      },
      {
        title: 'The preview ignored the brand twice over',
        status: 'shipped',
        detail:
          'The palette used by both the builder preview and the live page hardcoded cream for the editorial template and fell back to a navy for everything else, so a brand\u2019s background was discarded once by the template and again by the fallback. Both now ask the template for its ground, and the template derives it from the brand.',
        files: ['src/components/builder/quiz/preview.tsx', 'src/components/public/quiz/QuizRuntime.tsx'],
      },
    ],
    verification: [
      {
        label: 'Two brands produce two quizzes',
        state: 'verified',
        detail:
          '62 assertions. Two brands with different palettes now differ on primary, accent, background and card, and no value of either resolves to any of the three Check My Claim colours that used to leak in. A light brand stays light instead of being forced dark. Text on the ground, on the primary and on the button all reach 4.5:1. Status colours stay identical across brands while brand colours do not. An empty brand is flagged incomplete, names its missing tokens, and resolves to a true neutral.',
      },
      {
        label: 'On screen',
        state: 'not-run',
        detail:
          'Worth opening two brands\u2019 quizzes side by side after deploying, and switching one of them to the editorial template to confirm the paper picks up its brand rather than the old cream.',
      },
    ],
    deployNotes: [
      'No migration.',
      'Quiz previews will change appearance, and that is the point. A quiz that looked blue and navy under a brand that is neither was showing another tenant\u2019s palette.',
      'A brand that renders grey is telling you its colour tokens are unset. Fill them in on the brand identity rather than reporting it as a bug.',
    ],
    openIssues: [
      '157 hardcoded colours remain, concentrated in the landing-page renderer and the block renderer. The quiz templates are down to 26 and the rest of those are neutral scrims.',
    ],
  },
  {
    date: '2026-07-29',
    title: 'Hardcoded colour starts coming out of public pages',
    summary:
      'First real pass at the 311. The shared public stylesheet, the lead form and the quiz runtime now take every colour from a token. 119 down, 163 left, and the remainder is a different kind of work rather than more of the same.',
    items: [
      {
        title: 'The shared public stylesheet is at zero',
        status: 'shipped',
        detail:
          'All 104 hardcoded values in the CSS behind the public sections are gone. Alpha tints became a mix of the token they were tinting rather than a fixed rgba, so a brand recolour carries through them. The stylesheet also still carried fallback colours inside its variables, which is the fallback palette the contract forbids; those are gone, so a brand with no data now fails visibly instead of rendering in someone else\u2019s grey.',
        files: ['src/components/blocks/bespoke-css.ts'],
      },
      {
        title: 'Four errors the scripted pass introduced, caught and fixed',
        status: 'shipped',
        detail:
          'A find-and-replace collapsed a two-stop gradient onto one colour, flattened two distinct navies into one, painted the page in the card colour so every card vanished, and put button text verified against one token onto a button painted with another. Each was found by reading the output rather than trusting the script, which is the reason to read the output.',
        files: ['src/components/blocks/bespoke-css.ts'],
      },
      {
        title: 'Lead form and quiz runtime tokenised',
        status: 'shipped',
        detail:
          'The public lead form and the quiz page now use tokens for surfaces, hairlines, shadows and button text, and the error message uses the fixed system danger colour rather than a brand-scoped one. The same card-on-the-same-colour-as-its-section mistake was in the lead form and is fixed.',
        files: ['src/components/blocks/LeadForm.tsx', 'src/components/public/quiz/QuizRuntime.tsx'],
      },
      {
        title: 'New derived tokens, none of them authored',
        status: 'shipped',
        detail:
          'Text that sits on the ink colour when ink is used as a surface, which is where hardcoded white usually hides in dark heroes and footers. A muted version of it. An elevation and scrim set, neutral by design because a drop shadow is a depth cue rather than an identity, but tokenised so components stop inventing their own alpha.',
        files: ['src/lib/brand/resolve-tokens.ts'],
      },
      {
        title: 'The admin page builder was being counted as public output',
        status: 'shipped',
        detail:
          'Three page-builder components were in the public budget. Nothing under the public routes imports them, checked rather than assumed, so they moved to the uncounted admin scope. That is 29 of the reduction and it is a scope correction, not work.',
        files: ['scripts/lint-brand-tokens.mjs'],
      },
      {
        title: 'What is left is template work, not find and replace',
        status: 'partial',
        detail:
          'The remaining 163 is concentrated in the landing-page renderer, the quiz templates and the block renderer. Their colours are not stray literals; they are the fixed palettes that define what each template looks like. Turning those into tokens is the template library itself, which is its own package, and doing it as a sweep now would produce templates that all look the same.',
        files: ['src/components/builder/lp/render.tsx', 'src/components/builder/quiz/templates.tsx', 'src/components/blocks/BlockRenderer.tsx'],
      },
    ],
    verification: [
      {
        label: 'Every token the CSS now depends on resolves',
        state: 'verified',
        detail:
          '78 assertions across three brands including the reported bad palette and a deliberately hostile one. Each checks that all 22 referenced tokens are emitted, that text on the ink surface and text on the button both reach 4.5:1, that the gradient still has two distinguishable ends, and that a card is never the same colour as the page behind it.',
      },
      {
        label: 'Neutral values were not quietly exempted',
        state: 'verified',
        detail:
          '196 of the 282 were greyscale, and exempting them would have cut the number by two thirds without doing anything. They were not exempted: a grey used as text or as a surface is exactly the white-on-white risk, and only shadow and scrim alpha is genuinely brand independent. Those became tokens too.',
      },
      {
        label: 'In a browser',
        state: 'not-run',
        detail:
          'The public sections have not been rendered since the stylesheet was rewritten. This is the change most worth looking at directly: open a site page and check the hero, the buttons, the cards and the footer.',
      },
    ],
    deployNotes: [
      'No migration. This is a render change only.',
      'The public sections should look the same. Colour now flows from the brand, so if anything shifted it is because that section was previously ignoring the brand.',
      'The stylesheet uses color-mix for tints. It has been available in every major browser since 2023, but it is worth a glance on an older device if you have one.',
    ],
    openIssues: [
      '163 hardcoded colours remain, almost all of them template palettes rather than stray literals. They come out as part of building the template library.',
      'One tenant still has 125 in page components that should be CMS content rather than source code.',
    ],
  },
  {
    date: '2026-07-29',
    title: 'Deployments stop authoring colour (P0-C)',
    summary:
      'The third owner of colour is gone. A deployment could generate and store its own palette, so the brand said one thing and the deployment said another and whichever ran last won. Colour now has exactly one owner, and the generator that used to do the damage now proposes to the brand instead.',
    items: [
      {
        title: 'Per-deployment palettes removed',
        status: 'shipped',
        detail:
          'The Theme tab, the stored palette, and every read of it are gone from the deployment editor, the preview, the public runtime and the resolver. A deployment still picks its template, which is a choice among brand-derived presentations rather than a new colour.',
        files: ['src/lib/quiz-theme.ts', 'src/components/builder/quiz/QuizBuilderApp.tsx'],
      },
      {
        title: 'The generator moved to Brand Identity and lost its write access',
        status: 'shipped',
        detail:
          'It is now Brand Extraction, on the brand editor. It returns a proposal and writes nothing: every token shows where it came from and how much to trust it, the contrast verdict beside the Accept button is computed by the same resolver the publish gate uses, and a human accepts before anything changes.',
        files: ['src/app/(app)/admin/(top)/brands/brand-identities/actions.ts', 'src/components/builder/brand/BrandModule.tsx'],
      },
      {
        title: 'The extraction method is still the weak one, and says so',
        status: 'partial',
        detail:
          'Reading a URL still inspects the site’s declared stylesheet and Tailwind config, which returns framework defaults rather than the brand on any utility-framework site. That is why one brand came back as Tailwind’s orange-600 and slate-800. Confidence for that source is reported at 35 per cent and the panel says plainly that it is a starting point, so the weakness is visible instead of implied. Replacing it with computed-style sampling from a headless render is its own package.',
        files: ['src/app/(app)/admin/(top)/brands/brand-identities/actions.ts'],
      },
      {
        title: 'Stored palettes renamed, not destroyed',
        status: 'shipped',
        detail:
          'The instruction was to report any deployment carrying a custom palette before dropping the data, and this workspace has no database access to run that report. The column is renamed instead: the live path is gone immediately because the collection no longer declares the field, while every stored palette survives and can be reviewed with one query. Dropping it now would delete the only record of what those deployments were displaying, which is exactly what is needed to check nothing regressed.',
        files: ['src/migrations/20260729_200000_drop_deployment_theme.ts'],
      },
      {
        title: 'Host-surface inheritance kept, and separated from theming',
        status: 'shipped',
        detail:
          'A quiz inside a landing-page card still learns which opaque colour it sits on so its text is derived against the real backdrop. That is context being passed down, not a palette being invented, so it survives the removal under its own name rather than riding on the theme machinery.',
        files: ['src/lib/quiz-theme.ts'],
      },
    ],
    verification: [
      {
        label: 'Template selection and host surface',
        state: 'verified',
        detail:
          '21 assertions. A leftover theme object on a deployment is ignored entirely rather than still being honoured. An invalid or blank surface leaves the brand untouched and returns the same object. A dark brand dropped into a light card adopts the light ground and re-derives its button text instead of staying black on black. The input brand is never mutated.',
      },
      {
        label: 'Nothing left referencing the removed path',
        state: 'verified',
        detail:
          'A repo-wide search for the palette field, the theme helper and the old generator returns nothing outside the migrations that manage the column.',
      },
      {
        label: 'No structural drift in the edited builders',
        state: 'verified',
        detail:
          'Brace and paren balance compared against the committed version of every edited file. This also corrected the checker itself: it was treating the // inside an https:// string as a comment, which had been producing phantom imbalances all session. With strings stripped first, every edited file balances exactly.',
      },
      {
        label: 'Type check and browser',
        state: 'not-run',
        detail: 'No dependencies, database or generated types here, as always.',
      },
    ],
    deployNotes: [
      'Adds a migration that renames the deployment palette column. Run pnpm payload migrate after the build.',
      'After deploying, review anything that had a custom palette: SELECT d.id, d.path, s.name, d.theme_overrides_removed_20260729 FROM funnel_quiz_deployments d LEFT JOIN sites s ON s.id = d.site_id WHERE d.theme_overrides_removed_20260729 IS NOT NULL;',
      'A deployment that was relying on a custom palette will now render in its brand’s colours. That is the intended correction, but it is a visible change worth checking against the query above.',
    ],
    openIssues: [
      'Brand Extraction still reads declared stylesheet values. Computed-style sampling from a headless render is the fix and has not been built.',
      'The renamed column should be dropped once the stored palettes have been reviewed.',
      'Deployments cannot yet choose mode, density or emphasis. Those are the legitimate per-deployment choices the framework allows, and only template selection exists today.',
    ],
  },
  {
    date: '2026-07-29',
    title: 'Brand colour gets one owner (P0-B)',
    summary:
      'First package of the restructure framework. Colour had three owners: the brand record, the per-deployment theme generator, and hardcoded values inside components. Three owners of one value produce arbitrary output, which is what the wrong Don’t Settle colours actually were. There is now one contract, one resolver, and a lint that stops the count going back up.',
    items: [
      {
        title: 'A written token contract',
        status: 'shipped',
        detail:
          'Twelve colour tokens and five shape tokens, with four required: primary, call to action, page background, body text. The schema, the resolver, the brand editor and the lint all read this one list rather than keeping three copies in step by hand.',
        files: ['src/lib/brand/tokens.ts'],
      },
      {
        title: 'One resolver, and it refuses to guess',
        status: 'shipped',
        detail:
          'resolveBrandTokens is now the only thing that turns a brand into CSS. A missing required token throws instead of falling back. The old layout carried a hardcoded fallback on every variable, so a brand with no data rendered as a plausible navy site rather than visibly failing, and a wrong palette that looks deliberate is exactly how wrong colour reaches production.',
        files: ['src/lib/brand/resolve-tokens.ts', 'src/app/(public)/layout.tsx'],
      },
      {
        title: 'Everything else is derived, never stored',
        status: 'shipped',
        detail:
          'Tint and shade ramps, hover, active, focus and disabled states, and any text colour left blank, all recomputed on every resolve against the surface they will actually sit on. A stored derived value is a cache with no invalidation: it goes stale the moment someone edits the colour it came from.',
        files: ['src/lib/brand/resolve-tokens.ts'],
      },
      {
        title: 'Status colours stop being brand colours',
        status: 'shipped',
        detail:
          'Success, warning, danger and info are now fixed and identical for every brand. A destructive action rendered in brand orange on one site and brand red on another teaches people to read colour as decoration, and the cost lands on whoever clicks Delete expecting Save. The old brand-scoped names still resolve, but they now point at the fixed values.',
        files: ['src/lib/brand/tokens.ts'],
      },
      {
        title: 'Schema and backfill, with nothing repainted',
        status: 'shipped',
        detail:
          'Eleven new columns, backfilled so no live page changes appearance: the page background takes the value the old surface field was really being used for, the button colour takes primary because that is what every site already drew, and colours that only existed in the funnel brand JSON are promoted into the canonical columns. The derived tokens are deliberately left blank, because writing today’s guess into them would freeze it and defeat the contrast check.',
        files: ['src/migrations/20260729_170000_brand_token_contract.ts', 'src/collections/Sites.ts'],
      },
      {
        title: 'A lint that can actually be switched on',
        status: 'shipped',
        detail:
          'pnpm lint:tokens fails when public output gains a hardcoded colour. It runs as its own script because pnpm lint in this repo has no committed config and is not a working gate. It counts three scopes separately, because one number was hiding three different problems: render (311, the real debt, target zero), tenant (125, one brand’s pages living as source code, fixed by moving the content into the CMS and deleting the files), and admin (201, not counted at all, because builder chrome is fixed product UI and is supposed to look the same for every tenant). Budgets ratchet down and may never go up.',
        files: ['scripts/lint-brand-tokens.mjs'],
      },
      {
        title: 'Deleted the largest offender outright',
        status: 'shipped',
        detail:
          'The bespoke Check My Claim home component was the single worst file at 157 hardcoded colours, and nothing routed to it. It was being kept "as a historical reference for the design", which is another way of saying dead code: git is the reference, and its section designs already live on in the block renderer. Deleting it removed 157 violations at zero risk.',
        files: ['src/app/(public)/[[...slug]]/page.tsx'],
      },
      {
        title: 'The funnel brand map still has its own defaults',
        status: 'partial',
        detail:
          'The public site path now goes through the resolver. The funnel path does not: the brand map that feeds the quiz, landing page and advertorial builders still applies its own fallback colours. That is the second half of this package and it is the next thing to do, because a template library built on top of it would inherit the split.',
        files: ['src/lib/brand-map.ts'],
      },
    ],
    verification: [
      {
        label: 'The resolver',
        state: 'verified',
        detail:
          '90 assertions. Every required token throws when absent and is named in the error. Text derived for white, black and the exact Tailwind orange from the bug report all reach 4.5:1. A deliberately illegible brand fails the audit and names the failing pair rather than being silently corrected. Two different brands get byte-identical system colours. Dark mode changes the ground without changing the brand colour. One assertion scans the resolver’s own source for a reintroduced fallback, and a second proves that scan would catch one.',
      },
      {
        label: 'The lint gate',
        state: 'verified',
        detail:
          'Baseline recorded at 699, then a hardcoded colour was deliberately added to a public component to confirm the script exits non-zero, then reverted.',
      },
      {
        label: 'Backfill against real data',
        state: 'not-run',
        detail:
          'The migration is written to be idempotent and to preserve appearance, but it has not run against the production database. Worth checking one site’s rendered background before and after.',
      },
      {
        label: 'Type check and browser',
        state: 'not-run',
        detail: 'No dependencies, database or generated types in this workspace, as always.',
      },
    ],
    deployNotes: [
      'Adds a migration that backfills brand columns. Run pnpm payload migrate after the build and before restarting.',
      'Nothing should look different after this deploy. If a site does change appearance, that is a backfill problem worth reporting rather than a design change.',
      'A site whose brand cannot resolve now renders unstyled instead of in an invented palette. That is intentional and visible on purpose.',
    ],
    openIssues: [
      'Per-deployment theme overrides are still in place. The decision is to remove them and relocate the generator to Brand Identity as an accept-or-reject proposal; that is the next package.',
      'The brand map used by the funnel builders still carries its own fallback colours, so the funnel path has not yet been consolidated onto the resolver.',
      'The block renderer still sets --site-* per block from block metadata. That is a content-level override rather than a competing brand store, but it should be reviewed once templates land.',
      '311 hardcoded colours remain in code that paints public pages. Biggest: the bespoke section CSS (104), the landing-page renderer (65), the quiz preview and templates (64), the block renderer (32). Each one is a second owner of a colour the brand should decide.',
      'One tenant still has 125 hardcoded colours across ten page components that exist only for that brand. The fix is to move that content into Pages or shared legal templates for the Site and delete the files, not to tokenise them in place.',
    ],
  },
  {
    date: '2026-07-29',
    title: 'Landing pages go live, running the real quiz',
    summary:
      'Closes the one item left partial earlier today. A funnel landing page now serves on its own URL with its own link preview, and the quiz in its hero is the real deployment: the real flow, its own theme, its own destinations, and leads that arrive in the dashboard. Same page, several brands, each running its own quiz.',
    items: [
      {
        title: 'A landing-page deployment is a real page',
        status: 'shipped',
        detail:
          'The public router resolves a live landing-page deployment for the requested site and path and renders it through the same component the builder uses, with the click-to-edit affordances and preview framing switched off. One renderer rather than two is what stops a page looking one way in the builder and another way to a visitor.',
        files: ['src/lib/lp-deployment.ts', 'src/app/(public)/[[...slug]]/page.tsx'],
      },
      {
        title: 'The hero quiz is the real deployment, not a copy',
        status: 'shipped',
        detail:
          'The landing page reaches its quiz through the same hydration a standalone quiz page uses, so it arrives with its own theme, its own destination overrides and live lead delivery. Answering it inside a landing page and answering it on its own URL now do exactly the same thing.',
        files: ['src/lib/quiz-deployment.ts'],
      },
      {
        title: 'A landing page cannot borrow another brand’s quiz',
        status: 'shipped',
        detail:
          'The link between a landing page and its quiz is a bare text id with no foreign key behind it, so nothing in the database stopped brand A’s page pointing at brand B’s quiz. Since destinations now resolve from the deployment, that would have sent brand A’s leads to brand B’s pages. The resolver checks both belong to the same Site and refuses otherwise.',
        files: ['src/lib/quiz-deployment.ts'],
      },
      {
        title: 'Its own link preview',
        status: 'shipped',
        detail:
          'Title, description, canonical and Open Graph tags built from the hero copy the author already wrote. Two brands running one landing page produce two different previews, so a pasted link says who it is from.',
        files: ['src/lib/lp-deployment.ts'],
      },
      {
        title: 'One path-ownership rule for every deployment type',
        status: 'shipped',
        detail:
          'The check that stops a deployment claiming a path an authored page already serves is now shared by the quiz and landing-page resolvers instead of living inside one of them. It has to sit in the resolver rather than the router because the metadata pass runs before the router’s earlier steps, and a mismatch there means a crawler indexing a document no visitor sees.',
        files: ['src/lib/public-path-claims.ts'],
      },
      {
        title: 'Landing-page tables added to the migration chain',
        status: 'shipped',
        detail:
          'Same drift the quiz tables had: declared by collections, created by no migration, present only where a development server pushed them. The public route reads them on every request. Four of the six funnel tables are now in the chain; the two advertorial tables stay out until something renders them.',
        files: ['src/migrations/20260729_140000_funnel_lp_public_render.ts'],
      },
    ],
    verification: [
      {
        label: 'Link preview generation',
        state: 'verified',
        detail:
          '12 assertions, including one landing page under two brands producing two different titles, falling back to the page name when no hero copy exists, ignoring non-hero sections, length caps, and surviving null copy and junk in the stored sections array.',
      },
      {
        label: 'Modules load and export what the router imports',
        state: 'verified',
        detail:
          'Every new and refactored server module was imported with the database stubbed, confirming it parses and exposes the expected exports. The earlier destination and theme suites still apply unchanged, confirmed by diffing those files against the last commit.',
      },
      {
        label: 'End to end in a browser',
        state: 'not-run',
        detail:
          'Nothing here has been opened on a running server. Worth doing first: set a landing-page deployment live with a path, open it, complete the hero quiz, and confirm the lead appears under Leads with the right brand.',
      },
    ],
    deployNotes: [
      'Adds a migration. Run pnpm payload migrate after the build and before restarting.',
      'A landing page serves only when the page itself is published and the deployment status is Live. Both are checked on every request.',
      'If the hero quiz does not appear, check the deployment’s linked quiz belongs to the same brand: a cross-brand link is refused rather than rendered.',
    ],
    openIssues: [
      'The landing-page renderer pulls its display font in with an @import inside a style block, which browsers ignore unless it comes first. It was harmless in the builder and is now on a public page; the font falls back rather than failing, but it should move into the document head.',
      'Advertorials still have no public route. Same brandless-authoring shape, same treatment needed.',
    ],
  },
  {
    date: '2026-07-29',
    title: 'The quiz stops belonging to one brand',
    summary:
      'A quiz was still carrying brand-specific URLs inside its own nodes, which meant deploying it for a second brand would have sent that brand’s traffic to the first brand’s pages. Destinations now live on the brand and the deployment, the quiz names them instead of addressing them, and the same flow renders correctly whether it is a full page, an iframe on someone else’s site, or a card inside a landing page.',
    items: [
      {
        title: 'Nodes name a destination instead of a URL',
        status: 'shipped',
        detail:
          'An endpoint node used to hold a typed-in address. It now picks from thank you, did not qualify, partner list, privacy, terms, disclosures, or a genuine one-off custom URL. The address resolves at render: the deployment’s override first, then the brand’s own URL, then the site’s existing page at that path. A node built before this change keeps its URL and keeps working, treated as custom.',
        files: ['src/lib/quiz-destinations.ts', 'src/components/builder/quiz/editors.tsx'],
      },
      {
        title: 'Brand identities own their URLs',
        status: 'shipped',
        detail:
          'A URLs tab on every brand identity. Set the thank-you page once and every quiz that brand runs follows it. Blank means the site’s own page, and each field says which one that would be rather than leaving you guessing at an empty box.',
        files: ['src/components/builder/brand/BrandModule.tsx', 'src/lib/brand-map.ts'],
      },
      {
        title: 'Deployments can override any destination',
        status: 'shipped',
        detail:
          'A Destinations tab on the deployment editor showing what each destination actually resolves to and whether that came from this deployment, the brand, or the site default. One placement can send traffic somewhere different without editing the quiz or the brand.',
        files: ['src/components/builder/quiz/QuizBuilderApp.tsx', 'src/collections/FunnelQuizDeployments.ts'],
      },
      {
        title: 'Destinations are validated as a security boundary',
        status: 'shipped',
        detail:
          'A destination ends up in a link and in the browser’s address bar, so an admin-editable field that accepted anything would be script execution on a public page. Only https, http, site-relative paths, tel and mailto are accepted. Validation happens after the {{field}} substitution, not before, because a captured answer is attacker-controlled and would otherwise be able to smuggle in a scheme the template did not have.',
        files: ['src/lib/quiz-destinations.ts'],
      },
      {
        title: 'The quiz adapts to whatever it is placed in',
        status: 'shipped',
        detail:
          'Inline mode drops the quiz’s own card so it does not draw a box inside the host’s box, and the host passes the opaque colour the quiz will sit on so every text colour is derived against the real backdrop. That is what keeps a dark-brand quiz readable inside a light landing page. The answer grid now measures the space it actually has rather than the width of the window, so a two-column layout squeezed into a narrow hero card becomes one column instead of two unreadable ones.',
        files: ['src/components/public/quiz/QuizRuntime.tsx'],
      },
      {
        title: 'Landing pages run the real quiz',
        status: 'shipped',
        detail:
          'The quiz card in the landing-page builder was a drawing of a quiz: a fake first question and a dead Continue button. It now runs the real flow, with the real routing, wearing the landing page’s colours. Serving that landing page on a public URL followed in the entry above.',
        files: ['src/components/builder/lp/render.tsx'],
      },
      {
        title: 'A builder preview can no longer create a real lead',
        status: 'shipped',
        detail:
          'Putting the live runtime into the builder introduced the risk that clicking through a preview would write a lead, fire the pixels and deliver a webhook to a buyer. Preview mode blocks the submit, the AI call and the redirect, and it defaults to on, so a caller that forgets to declare itself live gets the safe behaviour rather than the expensive one.',
        files: ['src/components/public/quiz/QuizRuntime.tsx', 'src/components/builder/quiz/preview.tsx'],
      },
      {
        title: 'Rest of the Sites schema drift closed',
        status: 'shipped',
        detail:
          'Brand URLs are stored in a column that no migration had ever created. Payload reads every declared column at startup, so a missing one takes the whole application down rather than failing a single query. That column and the twelve others in the same position are now created by a migration.',
        files: ['src/migrations/20260729_090000_destinations_and_brand_drift.ts'],
      },
    ],
    verification: [
      {
        label: 'Destination resolution and URL safety',
        state: 'verified',
        detail:
          '49 assertions, including the property this change exists for: one shared quiz node resolves to a different thank-you page for each brand. Also covers rejecting javascript, data, vbscript and protocol-relative addresses, an unsafe override falling through to the brand rather than being used, legacy nodes with raw URLs still working, and a hostile answer being unable to smuggle a scheme in through interpolation.',
      },
      {
        label: 'No structural drift in the edited builders',
        state: 'verified',
        detail:
          'The brace and paren balance of every edited file was compared against its committed version to confirm the edits did not leave a block unclosed. The one file that moved was traced to the removed code, not to new code.',
      },
      {
        label: 'Type check and browser',
        state: 'not-run',
        detail:
          'Same as yesterday: no dependencies, database or generated types in this workspace. The landing-page quiz card and the destination pickers have not been clicked yet.',
      },
    ],
    deployNotes: [
      'Adds a migration. Run pnpm payload migrate after the build and before restarting.',
      'Existing quizzes keep their typed-in redirect URLs and behave exactly as before. Move them onto named destinations when convenient; nothing breaks if you do not.',
      'Set each brand’s URLs tab before relying on a named destination, or it falls back to the site’s own page at that path.',
    ],
    openIssues: [
      'Advertorials were not touched. They have the same brandless-authoring shape and will need the same treatment.',
    ],
  },
  {
    date: '2026-07-28',
    title: 'Quiz deployments become real pages',
    summary:
      'Items 9 to 12. A brandless quiz can now be deployed as its own public page with its own brand, theme, URL and link preview; embedded on any site with a script that actually exists; and its completions arrive in the Leads dashboard. Items 1 to 8 shipped earlier the same day.',
    items: [
      {
        ref: '9',
        title: 'A deployment is a separate, crawlable page',
        status: 'shipped',
        detail:
          'The public router resolves a live deployment for the requested site and path and server-renders the quiz. Each deployment gets its own title, description, canonical URL and Open Graph and Twitter tags, derived from the deployment name, the first question and the brand, so two deployments of one quiz produce two different link previews when pasted into Facebook. An authored Page always wins the path, so a deployment can never shadow one.',
        files: [
          'src/lib/quiz-deployment.ts',
          'src/app/(public)/[[...slug]]/page.tsx',
          'src/components/public/quiz/QuizRuntime.tsx',
        ],
      },
      {
        ref: '9',
        title: 'The base quiz controls content, the deployment controls the look',
        status: 'shipped',
        detail:
          'Deployments carry their own theme layer: template, colours and fonts, stored on the deployment and layered over the brand at render time. Restyling one deployment never repaints the brand or the other funnels that share it. Text on buttons is re-derived from whatever primary colour the theme sets, so a recolour cannot produce unreadable buttons.',
        files: ['src/lib/quiz-theme.ts', 'src/collections/FunnelQuizDeployments.ts'],
      },
      {
        ref: '10',
        title: 'Generate a theme from a URL, a description, or an image',
        status: 'shipped',
        detail:
          'A Theme tab on the deployment editor. A URL has its real stylesheet read and its palette extracted, with the model only choosing a template and filling gaps, so the match is measured rather than imagined. A written brief or an uploaded image goes through the model with vision. Nothing applies until you see the palette and accept it, and one click returns the deployment to the brand colours.',
        files: [
          'src/app/(app)/admin/(top)/quizzes/actions.ts',
          'src/components/builder/quiz/QuizBuilderApp.tsx',
          'src/lib/ai/invoke.ts',
        ],
      },
      {
        ref: '11',
        title: 'Embed code that works',
        status: 'shipped',
        detail:
          'The old snippet pointed at cdn.legenex.com/q.js, a file that has never existed, so pasting it did nothing while looking finished. The loader is now served from the deployment’s own domain, creates the iframe from the address in the snippet, forwards the host page’s campaign parameters so embedded leads keep their attribution, and resizes the frame as the visitor moves through the quiz. When a deployment has no domain or path yet the builder says so instead of handing out a snippet that cannot work.',
        files: ['src/app/(public)/q.js/route.ts', 'src/lib/quiz-embed.ts'],
      },
      {
        ref: '12',
        title: 'Completed quizzes arrive in the dashboard',
        status: 'shipped',
        detail:
          'Reaching the end of a quiz submits through the same lead pipeline the block forms use: TrustedForm certificate, Jornaya id, campaign attribution, Meta CAPI with the shared event id, outbound webhooks, Slack. The submit happens before the final screen is allowed to render, because an end screen can redirect on a timer and a lead posted after that redirect is a lead lost. One submit per session, one retry on a network failure, and a quiz that collects no contact details completes without writing an empty row.',
        files: [
          'src/lib/lead-capture-client.ts',
          'src/lib/quiz-lead.ts',
          'src/components/public/quiz/QuizRuntime.tsx',
        ],
      },
      {
        title: 'Mid-quiz AI runs server-side',
        status: 'shipped',
        detail:
          'AI-enabled question nodes now execute through an endpoint that reads the prompt from the database and accepts only answer values from the visitor, so a public page cannot post an arbitrary prompt to the API key. Draft deployments and unpublished quizzes are refused, and calls are rate limited per address.',
        files: ['src/app/api/legalos/quiz-ai/route.ts'],
      },
      {
        title: 'Funnel tables added to the migration chain',
        status: 'partial',
        detail:
          'The quiz and quiz-deployment tables had never been created by any migration; they existed only where a development server had pushed them automatically. Since the public page reads them on every request, that drift would have been a 500 on a customer-facing URL. The new migration creates them when absent and brings an existing copy up to shape when present. The landing-page tables followed on 29 July; only the two advertorial tables remain outside the chain.',
        files: ['src/migrations/20260728_180000_funnel_quiz_public_render.ts'],
      },
    ],
    verification: [
      {
        label: 'Theme, embed, lead mapping, path handling',
        state: 'verified',
        detail:
          '95 assertions run against the real modules, covering invalid and hostile input: malformed colours, CSS injection attempts in colour and font values, unknown template ids, missing domains, non-string answers, competing phone fields, and a preview-versus-live comparison asserting both resolve identical colours and fonts.',
      },
      {
        label: 'Link preview text',
        state: 'verified',
        detail:
          '13 further assertions on the metadata builder, including the one that matters most: two deployments of the same quiz produce two different titles. Also covers falling back when nothing is authored, ignoring routing nodes when deriving copy, length caps, and surviving junk in the stored node array.',
      },
      {
        label: 'Button contrast after a theme change',
        state: 'verified',
        detail:
          'Asserted directly: a white primary does not keep white button text, a black primary does not keep black. The colour is re-derived from the themed primary rather than carried over from the brand.',
      },
      {
        label: 'Type check',
        state: 'not-run',
        detail:
          'This workspace has no dependencies, no database and no generated Payload types, so the type check only runs on the server as part of the build.',
      },
      {
        label: 'End to end in a browser',
        state: 'not-run',
        detail:
          'No deployment has been opened on a running server yet. First things to try after deploying: publish a quiz, set a deployment live with a path, open that path, complete the quiz, and confirm the lead appears under Leads.',
      },
      {
        label: 'Link preview in Facebook’s scraper',
        state: 'not-run',
        detail:
          'The tags are generated and server-rendered, and the generator is tested, but a live URL has not been put through the Facebook sharing debugger.',
      },
    ],
    deployNotes: [
      'This push adds a migration. Run pnpm payload migrate after the build and before restarting the service.',
      'A quiz only serves traffic when the parent quiz is published and the deployment status is Live. Both are checked on every request.',
      'Custom domains used for embedding need their certificate active, since the loader is requested over HTTPS from the third-party page.',
    ],
    openIssues: [
      'Webhook and verification nodes still pass through without calling out. They were never implemented beyond a preview stub; the runtime advances past them rather than pretending they ran.',
      'The two advertorial tables are still missing from the migration chain. That is what remains of finding F001 after the quiz, landing-page and Sites columns were added on 28 and 29 July.',
      'The public runtime imports the builder preview components on purpose, so preview and live cannot drift. The cost is a larger JavaScript bundle on the public page than a purpose-built renderer would need.',
    ],
  },
  {
    date: '2026-07-28',
    title: 'Quiz builder overhaul',
    summary:
      'Items 1 to 8. Every structural change and routing decision moved into one shared module, so the builder, the preview and the public runtime cannot disagree about how a quiz behaves.',
    items: [
      {
        ref: '1',
        title: 'Move nodes up and down, with questions aligned to their nodes',
        status: 'shipped',
        detail:
          'The step list and the tier grid were two separate scroll containers, so a question drifted out of line with its own nodes. They are now one grid where a step and its variants are siblings in the same row, which makes misalignment impossible rather than fixed. Explicit up and down buttons sit alongside drag.',
        files: ['src/components/builder/quiz/builder.tsx', 'src/lib/quiz-graph.ts'],
      },
      {
        ref: '2',
        title: 'Duplicate nodes',
        status: 'shipped',
        detail:
          'Duplicate a whole step with every tier variant, or a single variant. A variant duplicate only ever targets a free cell, so it cannot create a node that no grid cell can display; on a full row the button disables itself and says why.',
        files: ['src/lib/quiz-graph.ts'],
      },
      {
        ref: '3',
        title: 'Tiers renumber when one is removed',
        status: 'shipped',
        detail:
          'The reported case where T4 and T3 both remained. Remaining default tier names are resequenced so numbering never shows gaps, while custom names and ids are left alone. A question that existed only for the deleted tier is deleted rather than quietly converted to a shared question, which would have started showing a tier-specific question to everyone.',
        files: ['src/lib/quiz-graph.ts'],
      },
      {
        ref: '4',
        title: 'Add fields from inside a node',
        status: 'shipped',
        detail:
          'Every place that references a field can create a missing one in place: dropdown sources, answer mappings, decision conditions, webhook response mappings, AI input and output, dynamic content, and the insert-variable picker. Names are validated centrally, so a duplicate or malformed key is refused rather than written.',
        files: ['src/components/builder/quiz/editors.tsx', 'src/lib/quiz-graph.ts'],
      },
      {
        ref: '5',
        title: 'Optional questions',
        status: 'shipped',
        detail:
          'A toggle inside the node marks a question reachable by routing only. Sequential advance skips it, and also skips steps with no variant for the visitor’s tier, so a half-built row falls through to the next question instead of dead-ending. The editor warns when an optional step has no route into it.',
        files: ['src/components/builder/quiz/editors.tsx', 'src/lib/quiz-graph.ts'],
      },
      {
        ref: '6',
        title: 'Save button, and no dialog when there is nothing to save',
        status: 'shipped',
        detail:
          'The always-on leave prompt is replaced by a real save state: saved, pending, saving, failed. Back exits silently when nothing is outstanding, flushes a pending write, and only interrupts when a save actually failed. Explicit Save button in the top bar, plus the keyboard shortcut.',
        files: ['src/components/builder/quiz/QuizBuilderApp.tsx'],
      },
      {
        ref: '7',
        title: 'Undo',
        status: 'shipped',
        detail:
          'Undo and redo across builder edits, with keyboard shortcuts, suppressed while a dialog is open or while typing in a text field.',
        files: ['src/components/builder/quiz/QuizBuilderApp.tsx'],
      },
      {
        ref: '8',
        title: 'Archived quizzes',
        status: 'shipped',
        detail:
          'Active and Archived tabs. Archiving forces the quiz unpublished in the same write, so a retired quiz can never still be serving traffic, and restoring brings it back as a draft rather than silently republishing it.',
        files: [
          'src/app/(app)/admin/(top)/quizzes/actions.ts',
          'src/migrations/20260728_120000_funnel_quizzes_archive.ts',
        ],
      },
      {
        title: 'Two routing bugs found along the way',
        status: 'shipped',
        detail:
          'Deleting a step left every route that pointed at it dangling, which silently fell through to whatever step came next. And switching tiers resolved the next step against the outgoing tier for one step.',
        files: ['src/lib/quiz-graph.ts'],
      },
    ],
    verification: [
      {
        label: 'Graph operations',
        state: 'verified',
        detail:
          '144 assertions against the real module, including a composition test that reorders, duplicates a row, duplicates a variant, deletes a tier and deletes a step in one session, then asserts the graph is still internally consistent.',
      },
      {
        label: 'In the builder UI',
        state: 'not-run',
        detail: 'Not yet clicked through on a running server.',
      },
    ],
    deployNotes: ['Adds a migration for the archive columns. Run pnpm payload migrate as part of the deploy.'],
  },
]
