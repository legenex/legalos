export type SlackNotificationArgs = {
  webhookUrl: string
  siteName: string
  leadId: string | number
  contact: { first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null; state?: string | null }
  funnelType: string
  testCapture?: boolean
  adminUrl: string
}

export const sendSlackNotification = async (args: SlackNotificationArgs): Promise<{ ok: boolean; error?: string }> => {
  const { webhookUrl, siteName, leadId, contact, funnelType, testCapture, adminUrl } = args
  if (!webhookUrl) return { ok: false, error: 'missing webhook url' }

  const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unnamed lead'
  const fields: Array<{ title: string; value: string; short: boolean }> = []
  if (contact.email) fields.push({ title: 'Email', value: contact.email, short: true })
  if (contact.phone) fields.push({ title: 'Phone', value: contact.phone, short: true })
  if (contact.state) fields.push({ title: 'State', value: contact.state, short: true })
  fields.push({ title: 'Source', value: funnelType, short: true })

  const headline = `${testCapture ? ':test_tube: *TEST LEAD* ' : ':inbox_tray: '} New lead on *${siteName}* — ${name}`

  const body = {
    text: headline,
    attachments: [
      {
        color: testCapture ? '#5CC1E1' : '#2DBE6C',
        fields,
        actions: [
          { type: 'button', text: 'Open in LegalOS', url: adminUrl },
        ],
        footer: `Lead ID ${leadId}`,
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  }

  try {
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!resp.ok) return { ok: false, error: `slack returned ${resp.status}` }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' }
  }
}
