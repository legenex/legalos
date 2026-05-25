import type { CollectionBeforeChangeHook } from 'payload'

/**
 * When the `slug` of a published doc changes, append the old slug to `slug_redirects`
 * so the public router 301s old → new automatically.
 */
export const captureSlugRedirect: CollectionBeforeChangeHook = async ({ data, originalDoc, operation }) => {
  if (operation !== 'update' || !originalDoc) return data
  const prevSlug = (originalDoc as Record<string, unknown>).slug as string | undefined
  const nextSlug = (data as Record<string, unknown>).slug as string | undefined
  const status = (data as Record<string, unknown>).status ?? (originalDoc as Record<string, unknown>).status
  if (!prevSlug || !nextSlug || prevSlug === nextSlug) return data
  if (status !== 'published') return data

  const existing = (((data as Record<string, unknown>).slug_redirects ??
    (originalDoc as Record<string, unknown>).slug_redirects) as Array<{ from: string }> | undefined) ?? []

  if (existing.some((r) => r.from === prevSlug)) return data

  return {
    ...data,
    slug_redirects: [...existing, { from: prevSlug }],
  }
}
