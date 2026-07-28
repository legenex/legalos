/**
 * Turning a completed quiz into a lead.
 *
 * The quiz collects a flat bag of answers keyed by whatever field names the
 * author chose. The lead pipeline expects a canonical `contact` object plus a
 * free-form `quiz_answers` blob. This module is the mapping between them, kept
 * pure and separate from the runtime component so it can be tested directly -
 * a silent mistake here does not throw, it just delivers a lead with no phone
 * number, which is the most expensive kind of bug this system can have.
 */

/**
 * Quiz field keys that map onto the canonical contact object, in priority
 * order. First non-empty match wins, so a quiz collecting both `phone` and
 * `mobile` sends the more specific one rather than whichever enumerates first.
 */
export const CONTACT_SOURCES: Record<string, string[]> = {
  first_name: ['first_name', 'firstname', 'fname'],
  last_name: ['last_name', 'lastname', 'lname'],
  email: ['email', 'email_address'],
  phone: ['phone', 'mobile', 'phone_number', 'tel'],
  state: ['state', 'accident_state'],
  zip: ['zip', 'zipcode', 'postal_code', 'postcode'],
}

export type QuizContact = {
  first_name: string
  last_name: string
  email: string
  phone: string
  state: string
  zip: string
}

export type SplitAnswers = {
  contact: QuizContact
  quizAnswers: Record<string, unknown>
}

/**
 * Split accumulated answers into the canonical contact object and the rest.
 *
 * Keys consumed by `contact` are REMOVED from quizAnswers rather than copied
 * into it. The pipeline already stores them as first-class lead columns, and
 * duplicating personal data into a free-form JSON blob makes an export or a
 * deletion request harder to satisfy for no benefit.
 */
export const splitQuizAnswers = (fieldValues: Record<string, unknown>): SplitAnswers => {
  const contact: QuizContact = { first_name: '', last_name: '', email: '', phone: '', state: '', zip: '' }
  const consumed = new Set<string>()

  for (const [target, sources] of Object.entries(CONTACT_SOURCES)) {
    for (const key of sources) {
      const v = fieldValues[key]
      if (typeof v === 'string' && v.trim()) {
        contact[target as keyof QuizContact] = v.trim()
        consumed.add(key)
        break
      }
    }
  }

  const quizAnswers: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(fieldValues)) {
    if (!consumed.has(k)) quizAnswers[k] = v
  }

  return { contact, quizAnswers }
}

/**
 * A lead with neither an email nor a phone cannot be contacted, and a row that
 * cannot be contacted is noise in the dashboard rather than a lead. The runtime
 * completes the funnel normally but does not submit one.
 */
export const isDeliverableContact = (contact: QuizContact): boolean =>
  Boolean(contact.email || contact.phone)
