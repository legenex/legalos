// Server-side TrustedForm cert claim. Called from /api/leads after a Lead is written.
// Never exposes account credentials to the client.

export type TrustedFormClaimArgs = {
  certUrl: string
  accountId: string
  apiKey: string
  reference?: string
  vendor?: string
  retainCert?: boolean
}

export type TrustedFormClaimResult = {
  ok: boolean
  cert_id?: string
  raw?: unknown
  error?: string
}

export const claimTrustedFormCert = async (args: TrustedFormClaimArgs): Promise<TrustedFormClaimResult> => {
  const { certUrl, accountId, apiKey, reference, vendor, retainCert } = args
  if (!certUrl) return { ok: false, error: 'missing certUrl' }
  if (!accountId || !apiKey) return { ok: false, error: 'missing trustedform credentials' }

  const body = new URLSearchParams()
  if (reference) body.set('reference', reference)
  if (vendor) body.set('vendor', vendor)
  if (retainCert) body.set('retain', 'true')

  const auth = Buffer.from(`${accountId}:${apiKey}`).toString('base64')
  try {
    const resp = await fetch(certUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    })
    const raw = await resp.json().catch(() => ({}))
    if (!resp.ok) return { ok: false, raw, error: `trustedform returned ${resp.status}` }
    return { ok: true, cert_id: (raw as { cert_id?: string }).cert_id, raw }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' }
  }
}
