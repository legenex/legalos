/**
 * Create (or re-key) the build-log capture account.
 *
 *   pnpm payload run scripts/create-capture-user.ts
 *
 * The capture job has to sign in to photograph the admin, which means it needs
 * an identity. It gets its own rather than borrowing a person's: captures are
 * then attributable to a job in the audit log instead of looking like a real
 * user clicking through every screen at three in the morning, and the account
 * can be disabled without locking anyone out.
 *
 * It is a super admin because the recipes span every Site, and a capture that
 * silently skipped screens the account could not see would produce a board
 * that looks complete and is not.
 *
 * Credentials come from the environment, never from this file. Run it again
 * with a new password to rotate: an existing account is re-keyed rather than
 * duplicated, so this is safe to repeat.
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const EMAIL = (process.env.BUILDLOG_CAPTURE_EMAIL || '').trim().toLowerCase()
const PASSWORD = process.env.BUILDLOG_CAPTURE_PASSWORD || ''

const fail = (message: string): never => {
  console.error(message)
  process.exit(1)
}

if (!EMAIL || !PASSWORD) {
  fail('Set BUILDLOG_CAPTURE_EMAIL and BUILDLOG_CAPTURE_PASSWORD before running this.')
}
// This account can read every Site, so a guessable password on it is a way in
// to every tenant's data. Refused rather than warned about.
if (PASSWORD.length < 24) {
  fail('BUILDLOG_CAPTURE_PASSWORD is under 24 characters. This account can read every Site; use a long random value.')
}

const payload = await getPayload({ config })

const existing = await payload.find({
  collection: 'users',
  where: { email: { equals: EMAIL } },
  limit: 1,
  overrideAccess: true,
})

if (existing.docs[0]) {
  await payload.update({
    collection: 'users',
    id: existing.docs[0].id,
    data: { password: PASSWORD, super_admin: true },
    overrideAccess: true,
  })
  console.log(`re-keyed the existing capture account ${EMAIL}`)
} else {
  await payload.create({
    collection: 'users',
    data: {
      email: EMAIL,
      password: PASSWORD,
      name: 'Build log capture',
      super_admin: true,
    },
    overrideAccess: true,
  })
  console.log(`created the capture account ${EMAIL}`)
}

// Never print the password. This runs on a server whose output goes to a
// terminal and, if anyone pipes it, to a log file.
console.log('password taken from the environment and not echoed')
process.exit(0)
