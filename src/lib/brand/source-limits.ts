/**
 * Limits on what may be attached as a brand source.
 *
 * One module so the server's enforcement and the file picker's `accept` cannot
 * drift apart. The server's check is the control - a server action is a public
 * endpoint, and the browser's limits are a courtesy to whoever is using the
 * screen, not a constraint on what can be posted.
 *
 * Every number here is chosen against ONE budget: the server-action body limit
 * set in next.config.mjs. That reconciliation is the whole point of this file.
 * The first version of these limits was internally consistent and still failed
 * in production, because 4 images at 3MB plus 8 documents at 200k characters
 * cannot cross a 1MB transport no matter how sensible each number looks on its
 * own. The framework rejects an oversized body BEFORE the action runs, with a
 * 413 no server-side code can catch or explain, so the totals below have to add
 * up to less than the configured limit or the feature is broken by arithmetic.
 *
 * Dependency-free so a client component can import it without pulling anything
 * server-side across the boundary, and so it cannot live in the 'use server'
 * action file, where every export must be an async function.
 */

/** Must match `experimental.serverActions.bodySizeLimit` in next.config.mjs. */
export const BODY_LIMIT_BYTES = 4 * 1024 * 1024

/**
 * What the attachments may total, leaving room for the rest of the request.
 * The margin covers the action's other arguments and the multipart framing.
 */
export const MAX_TOTAL_PAYLOAD = 3 * 1024 * 1024

/** Documents read per request. */
export const MAX_DOCS = 8
/**
 * Characters read from any one document.
 *
 * Sized from what brand guidelines actually are: a thorough one runs to a few
 * tens of kilobytes of markdown. 64k leaves generous headroom over that while
 * keeping eight of them inside the payload budget.
 */
export const MAX_DOC_CHARS = 64_000
/** Characters across all documents in one request. */
export const MAX_DOCS_TOTAL_CHARS = 256_000
/** How much document prose reaches the model, after parsing takes the values. */
export const MAX_PROMPT_CHARS = 48_000

/** Images read per request. */
export const MAX_IMAGES = 4
/**
 * Encoded length ceiling for one image, after the browser has downscaled it.
 *
 * Checked on the base64 string because that is what crosses the wire. A 1568px
 * JPEG lands well under this; the ceiling exists so one dense image cannot eat
 * the whole budget and starve the others.
 */
export const MAX_IMAGE_B64 = 900_000
/** Formats the vision model accepts. */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
export type BrandImageType = (typeof IMAGE_TYPES)[number]

/** What the file pickers offer, kept next to what the server will accept. */
export const DOC_ACCEPT = '.md,.markdown,.mdx,.txt,text/markdown,text/plain'
export const IMAGE_ACCEPT = IMAGE_TYPES.join(',')

/**
 * The size one request would post, measured the same way on both sides.
 *
 * Shared so the message the operator sees before sending and the check the
 * action applies after receiving can never disagree about what "too big" means.
 */
export const brandPayloadSize = (
  docs: Array<{ text?: string }> = [],
  images: Array<{ dataBase64?: string }> = [],
): number =>
  docs.reduce((n, d) => n + (d.text?.length ?? 0), 0) +
  images.reduce((n, i) => n + (i.dataBase64?.length ?? 0), 0)

export const formatBytes = (n: number): string =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`
