'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'

type Role = 'admin' | 'editor' | 'analyst'
type Status = 'invited' | 'active' | 'disabled'

type BindingInput = { site: number | string; role: Role }

type ActionResult = { ok: true } | { ok: false; error: string }

const requireSuperAdmin = async () => {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: 'unauthenticated' }
  if (!user.super_admin) return { ok: false as const, error: 'forbidden — super admin required' }
  return { ok: true as const, user }
}

const parseBindings = (raw: FormDataEntryValue | null): BindingInput[] => {
  if (!raw || typeof raw !== 'string') return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((b) => {
        if (!b || typeof b !== 'object') return null
        const site = (b as { site?: unknown }).site
        const role = (b as { role?: unknown }).role
        if (site == null) return null
        if (role !== 'admin' && role !== 'editor' && role !== 'analyst') return null
        return { site: site as number | string, role }
      })
      .filter((b): b is BindingInput => b !== null)
  } catch {
    return []
  }
}

export async function inviteUser(formData: FormData): Promise<ActionResult> {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const name = String(formData.get('name') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const super_admin = formData.get('super_admin') === 'on'
  const status = (String(formData.get('status') ?? 'invited') as Status) || 'invited'
  const bindings = parseBindings(formData.get('siteBindings'))

  if (!email) return { ok: false, error: 'Email is required' }
  if (!name) return { ok: false, error: 'Name is required' }
  if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters' }

  const payload = await getPayload({ config })

  try {
    await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        name,
        super_admin,
        status,
        siteBindings: bindings.map((b) => ({
          site: typeof b.site === 'string' ? Number(b.site) : b.site,
          role: b.role,
          invited_at: new Date().toISOString(),
        })),
      },
      user: auth.user as never,
      overrideAccess: false,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create user'
    return { ok: false, error: msg }
  }

  revalidatePath('/admin/settings/users')
  return { ok: true }
}

export async function updateUser(formData: FormData): Promise<ActionResult> {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth

  const id = String(formData.get('id') ?? '')
  if (!id) return { ok: false, error: 'Missing user id' }

  const name = String(formData.get('name') ?? '').trim()
  const status = String(formData.get('status') ?? 'active') as Status
  const super_admin = formData.get('super_admin') === 'on'
  const bindings = parseBindings(formData.get('siteBindings'))
  const newPassword = String(formData.get('password') ?? '')

  if (!name) return { ok: false, error: 'Name is required' }

  const payload = await getPayload({ config })

  const data: Record<string, unknown> = {
    name,
    status,
    super_admin,
    siteBindings: bindings.map((b) => ({
      site: typeof b.site === 'string' ? Number(b.site) : b.site,
      role: b.role,
    })),
  }
  if (newPassword) {
    if (newPassword.length < 8) return { ok: false, error: 'New password must be at least 8 characters' }
    data.password = newPassword
  }

  try {
    await payload.update({
      collection: 'users',
      id,
      data,
      user: auth.user as never,
      overrideAccess: false,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update user'
    return { ok: false, error: msg }
  }

  revalidatePath('/admin/settings/users')
  return { ok: true }
}

export async function deleteUser(formData: FormData): Promise<ActionResult> {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth

  const id = String(formData.get('id') ?? '')
  if (!id) return { ok: false, error: 'Missing user id' }

  if (String(auth.user.id) === id) {
    return { ok: false, error: 'You cannot delete your own account' }
  }

  const payload = await getPayload({ config })

  try {
    await payload.delete({
      collection: 'users',
      id,
      user: auth.user as never,
      overrideAccess: false,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to delete user'
    return { ok: false, error: msg }
  }

  revalidatePath('/admin/settings/users')
  return { ok: true }
}

export async function setStatus(formData: FormData): Promise<ActionResult> {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth

  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '') as Status
  if (!id) return { ok: false, error: 'Missing user id' }
  if (status !== 'invited' && status !== 'active' && status !== 'disabled') {
    return { ok: false, error: 'Invalid status' }
  }

  if (String(auth.user.id) === id && status === 'disabled') {
    return { ok: false, error: 'You cannot disable your own account' }
  }

  const payload = await getPayload({ config })
  try {
    await payload.update({
      collection: 'users',
      id,
      data: { status },
      user: auth.user as never,
      overrideAccess: false,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update status'
    return { ok: false, error: msg }
  }

  revalidatePath('/admin/settings/users')
  return { ok: true }
}
