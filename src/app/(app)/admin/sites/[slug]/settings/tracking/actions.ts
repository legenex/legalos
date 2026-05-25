'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'

export type TrackingPayload = {
  meta_pixel?: { enabled?: boolean; id?: string; capi_token?: string; test_event_code?: string; dataset_id?: string }
  google_ads?: { enabled?: boolean; tag_id?: string; conversion_actions?: Array<{ label: string; conversion_id: string; conversion_label: string }> }
  ga4?: { enabled?: boolean; measurement_id?: string; api_secret?: string }
  tiktok?: { enabled?: boolean; pixel_code?: string; access_token?: string; test_event_code?: string }
  gtm?: { enabled?: boolean; container_id?: string }
  trustedform?: { enabled?: boolean; account_id?: string; api_key?: string; retain_certs?: boolean; auto_claim?: boolean }
  truecall?: { enabled?: boolean; api_key?: string; account_id?: string; page_path_mapping?: Array<{ path: string; campaign_id: string }> }
  jornaya?: { enabled?: boolean; account_id?: string; campaign_id?: string }
  custom_webhooks?: Array<{ name: string; url: string; enabled: boolean; event_filter?: string; hmac_secret?: string }>
}

export async function saveTracking(args: {
  siteId: number
  siteSlug: string
  data: TrackingPayload
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  if (!args.siteId) return { ok: false, error: 'missing site id' }

  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: 'tracking-configs',
    where: { site: { equals: args.siteId } },
    limit: 1,
    overrideAccess: true,
  })

  try {
    if (existing.docs[0]) {
      await payload.update({
        collection: 'tracking-configs',
        id: existing.docs[0].id,
        data: args.data as never,
        user: user as never,
        overrideAccess: false,
      })
    } else {
      await payload.create({
        collection: 'tracking-configs',
        data: { site: args.siteId, ...args.data } as never,
        user: user as never,
        overrideAccess: false,
      })
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'save failed' }
  }

  revalidatePath(`/admin/sites/${args.siteSlug}/settings/tracking`)
  return { ok: true }
}
