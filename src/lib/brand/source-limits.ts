/**
 * Limits on what may be attached as a brand source.
 *
 * One module so the server's enforcement and the file picker's `accept` cannot
 * drift apart. The server's check is the control - a server action is a public
 * endpoint, and the browser's limits are a courtesy to whoever is using the
 * screen, not a constraint on what can be posted.
 *
 * Deliberately dependency-free so a client component can import it without
 * pulling anything server-side across the boundary, and so it cannot live in
 * the 'use server' action file, where every export must be an async function.
 */

/** Documents read per request. */
export const MAX_DOCS = 8
/** Characters read from any one document. */
export const MAX_DOC_CHARS = 200_000
/** How much document prose reaches the model, after parsing takes the values. */
export const MAX_PROMPT_CHARS = 48_000

/** Images read per request. */
export const MAX_IMAGES = 4
/**
 * Base64 length ceiling, roughly a 4MB encoding of a 3MB file. Checked on the
 * encoded string because that is what actually crosses the wire and what the
 * model is billed for.
 */
export const MAX_IMAGE_B64 = 5_600_000
/** Formats the vision model accepts. */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
export type BrandImageType = (typeof IMAGE_TYPES)[number]

/** What the file pickers offer, kept next to what the server will accept. */
export const DOC_ACCEPT = '.md,.markdown,.mdx,.txt,text/markdown,text/plain'
export const IMAGE_ACCEPT = IMAGE_TYPES.join(',')
