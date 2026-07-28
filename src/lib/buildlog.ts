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
          'The quiz and quiz-deployment tables had never been created by any migration; they existed only where a development server had pushed them automatically. Since the public page reads them on every request, that drift would have been a 500 on a customer-facing URL. The new migration creates them when absent and brings an existing copy up to shape when present. The four other funnel tables are still undocumented in the migration chain.',
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
      'The four remaining funnel tables (advertorials, landing pages and their deployments) are still missing from the migration chain. That is the rest of finding F001.',
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
