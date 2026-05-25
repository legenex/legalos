'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'

type ActionResult = { ok: true } | { ok: false; error: string }

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const avatar_url = String(formData.get('avatar_url') ?? '').trim()
  const bio = String(formData.get('bio') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim()
  const timezone = String(formData.get('timezone') ?? '').trim()
  const newPassword = String(formData.get('password') ?? '')

  if (!name) return { ok: false, error: 'Name is required' }
  if (!email) return { ok: false, error: 'Email is required' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Enter a valid email' }
  if (newPassword && newPassword.length < 8) {
    return { ok: false, error: 'New password must be at least 8 characters' }
  }

  const data: Record<string, unknown> = {
    name,
    email,
    avatar_url: avatar_url || null,
    bio: bio || null,
    title: title || null,
    timezone: timezone || null,
  }
  if (newPassword) data.password = newPassword

  const payload = await getPayload({ config })
  try {
    await payload.update({
      collection: 'users',
      id: user.id,
      data,
      user: user as never,
      overrideAccess: false,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to save profile'
    return { ok: false, error: msg }
  }

  revalidatePath('/admin/profile')
  revalidatePath('/admin', 'layout')
  return { ok: true }
}
