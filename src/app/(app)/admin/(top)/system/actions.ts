'use server'

import { revalidatePath } from 'next/cache'
import { invalidateSystemReport } from '@/lib/system-health'
import { getCurrentUser } from '@/lib/auth'

export async function refreshSystemReport(): Promise<void> {
  const user = await getCurrentUser()
  if (!user) return
  invalidateSystemReport()
  revalidatePath('/admin/system')
}
