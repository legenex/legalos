// Single source of truth for the DNS records we tell a tenant to create for a
// custom domain. It is APEX-AWARE: a root/apex domain (dont-settle.co) cannot
// hold a CNAME — only an A record — so we must never instruct one there. A
// subdomain (lp.checkmyclaim.co) uses a CNAME instead. The TXT record is only
// an ownership fallback and is always OPTIONAL, because verification in
// src/lib/dns-check.ts accepts ANY ONE of CNAME / A / TXT.
//
// Records are recomputed on read (see brands/domains/page.tsx) so existing
// rows reflect the current logic without a backfill.

export type DnsRecord = {
  type: 'A' | 'CNAME' | 'TXT'
  name: string
  value: string
  required: boolean
  note?: string
}

// A focused set of two-level public suffixes so we can tell an apex domain
// (example.co.uk) from a subdomain (app.example.co.uk) — not the full PSL, but
// enough to be correct for realistic customer domains. A plain ccTLD like `.co`
// (dont-settle.co) is handled by the label-count default below.
const MULTI_LEVEL_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'me.uk', 'ltd.uk', 'plc.uk', 'net.uk', 'sch.uk', 'ac.uk', 'gov.uk', 'nhs.uk',
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au', 'id.au',
  'co.nz', 'net.nz', 'org.nz', 'govt.nz', 'ac.nz',
  'co.za', 'org.za', 'net.za', 'web.za',
  'com.br', 'net.br', 'org.br', 'gov.br',
  'com.mx', 'com.ar', 'com.co', 'net.co', 'nom.co',
  'co.in', 'net.in', 'org.in', 'firm.in', 'gen.in', 'ind.in',
  'co.jp', 'or.jp', 'ne.jp', 'go.jp',
  'com.sg', 'com.my', 'com.ph', 'com.hk', 'com.tw', 'com.tr', 'com.ua', 'com.pl',
  'co.il', 'co.kr', 'co.id', 'co.th',
])

/** True when `host` is a registrable root/apex domain (cannot hold a CNAME). */
export const isApexDomain = (host: string): boolean => {
  const labels = host.toLowerCase().replace(/\.$/, '').split('.').filter(Boolean)
  if (labels.length <= 2) return true // example.com, dont-settle.co
  const lastTwo = labels.slice(-2).join('.')
  if (MULTI_LEVEL_SUFFIXES.has(lastTwo)) return labels.length === 3 // example.co.uk
  return false // app.example.com, lp.checkmyclaim.co
}

/**
 * The DNS records to display for a custom domain, correct for apex vs subdomain.
 * Resolution acceptance is an OR, so exactly ONE "required" record needs to be
 * live; the TXT is an always-optional ownership fallback.
 */
export const buildDnsRecords = (host: string, token: string | null | undefined): DnsRecord[] => {
  const cnameTarget = process.env.LEGALOS_CNAME_TARGET ?? 'cname.legenex.com'
  const aTarget = process.env.LEGALOS_A_TARGET || null

  const txt: DnsRecord | null = token
    ? {
        type: 'TXT',
        name: `_legalos.${host}`,
        value: `legalos-verify=${token}`,
        required: false,
        note: 'Optional ownership fallback. Not needed once the record above resolves.',
      }
    : null

  if (isApexDomain(host)) {
    const records: DnsRecord[] = []
    if (aTarget) {
      records.push({
        type: 'A',
        name: host,
        value: aTarget,
        required: true,
        note: 'Points your root domain at LegalOS. Serves the site AND verifies ownership.',
      })
    } else {
      // No A target configured: apex can't use a plain CNAME, so the tenant
      // needs an ALIAS/ANAME record (CNAME flattening) at their provider.
      records.push({
        type: 'CNAME',
        name: host,
        value: cnameTarget,
        required: true,
        note: 'Apex domains cannot use a plain CNAME — use your provider\'s ALIAS/ANAME (CNAME flattening).',
      })
    }
    if (txt) records.push(txt)
    return records
  }

  // Subdomain: a CNAME is correct and sufficient.
  const records: DnsRecord[] = [
    {
      type: 'CNAME',
      name: host,
      value: cnameTarget,
      required: true,
      note: 'Points this subdomain at LegalOS. Serves the site AND verifies ownership.',
    },
  ]
  if (txt) records.push(txt)
  return records
}
