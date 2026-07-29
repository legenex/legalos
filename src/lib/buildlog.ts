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

export const ENTRIES: BuildLogEntry[] = [
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
