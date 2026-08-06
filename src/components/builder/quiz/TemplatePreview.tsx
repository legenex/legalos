// @ts-nocheck
/* eslint-disable */
'use client'

/**
 * A live miniature of a quiz template, for the picker.
 *
 * Not a screenshot and not a drawing: it runs the real progress form and the
 * real answer form, in the real brand's colours, through the same components
 * the deployed quiz uses. A picker backed by static thumbnails goes stale the
 * first time a template changes and then quietly lies about what you are
 * choosing, which matters most for exactly the templates you have never seen.
 *
 * The sample labels are the handoff's own and never leave this component. They
 * exist so a form has something to draw; nothing here is written to a
 * deployment, and the questions a visitor sees still come from the quiz.
 */

import { QuizProgress } from '@/components/public/quiz/forms/progress'
import { QuizAnswer, answerLayout } from '@/components/public/quiz/forms/answers'
import { quizTheme } from '@/lib/quiz-templates/theme'

const SAMPLE = ['Auto / Motorcycle Accident', 'Commercial / Semi Accident']

/**
 * @param spec      the template being drawn
 * @param brand     whose colours to draw it in
 * @param progress  an override, when the deployment has chosen one
 */
export const TemplatePreview = ({ spec, brand, progress = null, height = 132 }) => {
  const shown = progress ? { ...spec, progress } : spec
  const theme = quizTheme(shown, brand)
  const s = theme.surface

  return (
    <div
      aria-hidden="true"
      style={{
        height,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: s.bg,
        border: `1px solid ${s.line}`,
        borderRadius: 6,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        // The miniature is a real render at real sizes, shrunk. Scaling rather
        // than re-specifying every size is what keeps it honest: a template
        // whose answers are oversized looks oversized here too.
        transform: 'scale(0.82)',
        transformOrigin: 'top left',
        width: '122%',
      }}
    >
      <QuizProgress form={shown.progress} theme={theme} index={1} total={5} />

      <div style={{ fontFamily: theme.fonts.question, fontSize: 13, fontWeight: shown.serifQuestion ? 600 : 700, color: s.text, lineHeight: 1.25 }}>
        How were you injured?
      </div>

      <div style={{ ...answerLayout(shown.answers), pointerEvents: 'none' }}>
        {SAMPLE.map((label, i) => (
          <QuizAnswer
            key={i}
            form={shown.answers}
            icons={shown.icons}
            theme={theme}
            label={label}
            index={i}
            selected={i === 0}
            onSelect={() => {}}
          />
        ))}
      </div>

      {/* The miniature is taller than its window on purpose for the templates
          with rails and tabs; this fades the cut rather than slicing it. */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 26, background: `linear-gradient(to bottom, transparent, ${s.bg})`, pointerEvents: 'none' }} />
    </div>
  )
}
