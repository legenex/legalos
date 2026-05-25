/**
 * DNS verification via DNS-over-HTTPS (DoH). No extra deps; works from serverless edges.
 *
 * Acceptance: a custom domain is "verified" when AT LEAST ONE of these is true:
 *   - Its CNAME chain ends at LEGALOS_CNAME_TARGET (or a CNAME of LEGALOS_CNAME_TARGET).
 *   - Its A record matches LEGALOS_A_TARGET (if configured).
 *   - A TXT record at `_legalos.<host>` contains the verification token we issued.
 *
 * This deliberately tolerates apex-domains (which can't CNAME) by also accepting
 * the A-record path. Tenant just needs ONE of the records right.
 */

const CLOUDFLARE_DOH = 'https://cloudflare-dns.com/dns-query'

type DohAnswer = { name: string; type: number; data: string; TTL?: number }
type DohResponse = { Status: number; Answer?: DohAnswer[] }

const RECORD_TYPE = { A: 1, CNAME: 5, TXT: 16 } as const

const queryDoh = async (name: string, type: keyof typeof RECORD_TYPE): Promise<DohAnswer[]> => {
  const url = `${CLOUDFLARE_DOH}?name=${encodeURIComponent(name)}&type=${type}`
  const resp = await fetch(url, { headers: { Accept: 'application/dns-json' }, cache: 'no-store' })
  if (!resp.ok) return []
  const json = (await resp.json()) as DohResponse
  if (json.Status !== 0) return []
  return (json.Answer ?? []).filter((a) => a.type === RECORD_TYPE[type])
}

const stripTrailingDot = (s: string): string => s.replace(/\.$/, '').toLowerCase()

const stripQuotes = (s: string): string => s.replace(/^"+|"+$/g, '')

export type DnsCheckResult = {
  ok: boolean
  matched: 'cname' | 'a' | 'txt' | null
  observed: {
    cname: string[]
    a: string[]
    txt: string[]
  }
  expected: {
    cname_target: string | null
    a_target: string | null
    txt_token_at: string | null
  }
}

export const checkDomainDns = async (args: {
  host: string
  cnameTarget?: string | null
  aTarget?: string | null
  verificationToken?: string | null
}): Promise<DnsCheckResult> => {
  const host = stripTrailingDot(args.host)
  const cnameTarget = args.cnameTarget ? stripTrailingDot(args.cnameTarget) : null
  const aTarget = args.aTarget ? stripTrailingDot(args.aTarget) : null
  const txtName = `_legalos.${host}`

  const [cnameAnswers, aAnswers, txtAnswers] = await Promise.all([
    queryDoh(host, 'CNAME').catch(() => []),
    queryDoh(host, 'A').catch(() => []),
    args.verificationToken ? queryDoh(txtName, 'TXT').catch(() => []) : Promise.resolve([] as DohAnswer[]),
  ])

  const cnameValues = cnameAnswers.map((a) => stripTrailingDot(a.data))
  const aValues = aAnswers.map((a) => a.data)
  const txtValues = txtAnswers.map((a) => stripQuotes(a.data))

  let matched: DnsCheckResult['matched'] = null
  if (cnameTarget && cnameValues.some((v) => v === cnameTarget || v.endsWith(`.${cnameTarget}`))) matched = 'cname'
  else if (aTarget && aValues.includes(aTarget)) matched = 'a'
  else if (args.verificationToken && txtValues.some((v) => v.includes(args.verificationToken!))) matched = 'txt'

  return {
    ok: matched !== null,
    matched,
    observed: { cname: cnameValues, a: aValues, txt: txtValues },
    expected: {
      cname_target: cnameTarget,
      a_target: aTarget,
      txt_token_at: args.verificationToken ? txtName : null,
    },
  }
}
