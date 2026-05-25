'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'

const toTel = (display: string | null | undefined): string => {
  if (!display) return ''
  const digits = display.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return `+${digits}`
}

export async function saveGeneralSettings(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  const siteId = Number(formData.get('site_id'))
  if (!siteId) return { ok: false, error: 'missing site id' }

  const phoneDisplay = String(formData.get('default_phone') ?? '')

  const data = {
    name: String(formData.get('name') ?? ''),
    slug: String(formData.get('slug') ?? ''),
    tagline: String(formData.get('tagline') ?? ''),
    vertical: String(formData.get('vertical') ?? 'multi') as
      | 'mass-tort'
      | 'mva'
      | 'workers-comp'
      | 'personal-injury'
      | 'medical-malpractice'
      | 'class-action'
      | 'multi',
    org_name: String(formData.get('org_name') ?? ''),
    org_address: String(formData.get('org_address') ?? ''),
    support_email: String(formData.get('support_email') ?? ''),
    default_phone: phoneDisplay,
    default_phone_tel: toTel(phoneDisplay),
    default_disclaimer_md: String(formData.get('default_disclaimer_md') ?? ''),
    brand: {
      logo_url: String(formData.get('logo_url') ?? '') || null,
      favicon_url: String(formData.get('favicon_url') ?? '') || null,
      primary: String(formData.get('primary') ?? '#0B1F3A'),
      accent: String(formData.get('accent') ?? '#E8B14B'),
      surface: String(formData.get('surface') ?? '#F7F5F0'),
      ink: String(formData.get('ink') ?? '#0E1116'),
      muted: String(formData.get('muted') ?? '#5C6470'),
      font_heading: String(formData.get('font_heading') ?? 'Inter'),
      font_body: String(formData.get('font_body') ?? 'Inter'),
    },
  }

  const payload = await getPayload({ config })
  await payload.update({
    collection: 'sites',
    id: siteId,
    data,
    user: user as never,
    overrideAccess: false,
  })

  revalidatePath(`/admin/sites/${data.slug}/settings/general`)
  return { ok: true }
}
