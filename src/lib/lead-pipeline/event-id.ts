import crypto from 'crypto'

/**
 * Generate a deduplication event id that's shared across:
 *   - Client pixel (fbq, ttq, gtag)
 *   - Server CAPI (Meta + TikTok)
 *   - Webhook payloads
 *
 * Format: hex 32 chars. Matches what Meta/TikTok expect.
 */
export const newEventId = (): string => crypto.randomBytes(16).toString('hex')
